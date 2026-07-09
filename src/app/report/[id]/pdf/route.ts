import { NextResponse } from "next/server";

import { ReportStatus } from "@/generated/prisma/client";
import {
  getExecutiveSummaryFromReportSummary,
  parseSerializedReportNarrative,
} from "@/lib/ai/report-narrative.core";
import { prisma } from "@/lib/db/prisma";
import { renderAuthorReportPdf } from "@/lib/reports/pdf";

export const runtime = "nodejs";

function fallbackSummary({
  overallScore,
  topFindingTitle,
}: {
  overallScore: number | null;
  topFindingTitle?: string;
}) {
  const parts = [
    "This report uses saved scan data to evaluate how well the website supports the author's books, reader trust, newsletter growth, and technical health.",
  ];

  if (overallScore !== null) {
    parts.push(`The current score is ${overallScore}/100.`);
  }

  if (topFindingTitle) {
    parts.push(`Start with: ${topFindingTitle}.`);
  }

  return parts.join(" ");
}

function pdfFileName(domain: string) {
  const safeDomain =
    domain
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "author-website-report";

  return `${safeDomain}-author-website-report.pdf`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      scores: true,
      findings: {
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      },
      lead: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  if (report.status !== ReportStatus.COMPLETE) {
    return NextResponse.json(
      { error: "PDF export is available after the report is complete." },
      { status: 409 }
    );
  }

  if (!report.lead?.email) {
    return NextResponse.json(
      { error: "Unlock the full report before downloading the PDF." },
      { status: 403 }
    );
  }

  const serializedNarrative = parseSerializedReportNarrative(report.summary);
  const narrative = serializedNarrative?.narrative ?? null;
  const executiveSummary =
    narrative?.executiveSummary ??
    getExecutiveSummaryFromReportSummary(report.summary) ??
    fallbackSummary({
      overallScore: report.overallScore,
      topFindingTitle: report.findings[0]?.title,
    });
  const pdf = await renderAuthorReportPdf({
    report,
    scores: report.scores,
    findings: report.findings,
    narrative,
    executiveSummary,
    generatedAt: new Date(),
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${pdfFileName(report.domain)}"`,
      "Content-Type": "application/pdf",
    },
  });
}
