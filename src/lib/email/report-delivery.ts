import "server-only";

import { ReportStatus } from "@/generated/prisma/client";
import {
  getExecutiveSummaryFromReportSummary,
  parseSerializedReportNarrative,
} from "@/lib/ai/report-narrative.core";
import { prisma } from "@/lib/db/prisma";
import { buildFullReportEmail } from "@/lib/email/report-delivery.core";
import { env, validateReportDeliveryEnv } from "@/lib/env/server";
import { getReportPath } from "@/lib/reports/domain";
import {
  getAuthorReportPdfFileName,
  renderAuthorReportPdf,
} from "@/lib/reports/pdf";
import { Resend } from "resend";

type DeliverFullReportEmailInput = {
  reportId: string;
  recipientEmail: string;
  recipientName?: string;
};

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

export async function deliverFullReportEmail({
  reportId,
  recipientEmail,
  recipientName,
}: DeliverFullReportEmailInput) {
  const deliveryEnv = validateReportDeliveryEnv(process.env);
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      scores: true,
      findings: {
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!report || report.status !== ReportStatus.COMPLETE) {
    throw new Error("A completed report is required for email delivery.");
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
  const reportUrl = new URL(getReportPath(report.domain), env.APP_URL).toString();
  const message = buildFullReportEmail({
    recipientName,
    domain: report.domain,
    reportUrl,
  });
  const resend = new Resend(deliveryEnv.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: `GrailHiiv <${deliveryEnv.RESEND_FROM_EMAIL}>`,
    to: [recipientEmail],
    subject: message.subject,
    html: message.html,
    text: message.text,
    attachments: [
      {
        content: pdf,
        filename: getAuthorReportPdfFileName(report.domain),
      },
    ],
  });

  if (error) {
    throw new Error(`Resend could not deliver the report: ${error.message}`);
  }
}
