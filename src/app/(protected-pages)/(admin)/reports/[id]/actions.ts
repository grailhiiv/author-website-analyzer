"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { SalesLeadStatus } from "@/generated/prisma/client";
import {
  generateOutreachMessage,
  serializeOutreachMessage,
} from "@/lib/ai/outreach-message.core";
import { isAllowedAdminEmail } from "@/lib/auth/admin";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

const salesNoteSchema = z.object({
  reportId: z.string().min(1, "Report ID is missing."),
  manualNote: z
    .string()
    .trim()
    .max(5000, "Manual note must be 5,000 characters or less.")
    .default(""),
  leadStatus: z.nativeEnum(SalesLeadStatus),
  serviceFit: z
    .string()
    .trim()
    .max(120, "Service fit must be 120 characters or less.")
    .optional()
    .default(""),
  priority: z.coerce
    .number()
    .int()
    .min(1, "Priority must be between 1 and 5.")
    .max(5, "Priority must be between 1 and 5."),
});

const outreachSchema = z.object({
  reportId: z.string().min(1, "Report ID is missing."),
});

async function requireAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !isAllowedAdminEmail(session.user.email)) {
    redirect("/login");
  }
}

export async function updateSalesNotesAction(formData: FormData) {
  await requireAdminSession();

  const parsed = salesNoteSchema.parse({
    reportId: formData.get("reportId"),
    manualNote: formData.get("manualNote") ?? "",
    leadStatus: formData.get("leadStatus"),
    serviceFit: formData.get("serviceFit") ?? "",
    priority: formData.get("priority"),
  });

  const report = await prisma.report.findUnique({
    where: { id: parsed.reportId },
    select: { id: true },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  await prisma.reportSalesNote.upsert({
    where: { reportId: report.id },
    create: {
      reportId: report.id,
      manualNote: parsed.manualNote,
      leadStatus: parsed.leadStatus,
      serviceFit: parsed.serviceFit || null,
      priority: parsed.priority,
    },
    update: {
      manualNote: parsed.manualNote,
      leadStatus: parsed.leadStatus,
      serviceFit: parsed.serviceFit || null,
      priority: parsed.priority,
    },
  });

  revalidatePath(`/reports/${report.id}`);
  redirect(`/reports/${report.id}`);
}

export async function generateOutreachMessageAction(formData: FormData) {
  await requireAdminSession();

  const parsed = outreachSchema.parse({
    reportId: formData.get("reportId"),
  });

  const report = await prisma.report.findUnique({
    where: { id: parsed.reportId },
    include: {
      lead: true,
      salesNote: true,
      findings: {
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  const result = await generateOutreachMessage(
    {
      authorName: report.lead?.name ?? null,
      websiteUrl: report.normalizedUrl,
      domain: report.domain,
      authorType: report.authorType,
      websiteGoal: report.websiteGoal,
      overallScore: report.overallScore,
      serviceFit: report.salesNote?.serviceFit ?? null,
      findings: report.findings.map((finding) => ({
        title: finding.title,
        finding: finding.finding,
        recommendation: finding.recommendation,
        priority: finding.priority,
        severity: finding.severity,
        category: finding.category,
      })),
    },
    {
      apiKey: process.env.OPENAI_API_KEY,
    }
  );
  const serializedMessage = serializeOutreachMessage(result);
  const generatedAt = new Date();

  await prisma.reportSalesNote.upsert({
    where: { reportId: report.id },
    create: {
      reportId: report.id,
      manualNote: "",
      leadStatus: SalesLeadStatus.NEW,
      serviceFit: null,
      priority: 3,
      outreachMessage: serializedMessage,
      outreachSource: result.source,
      outreachGeneratedAt: generatedAt,
    },
    update: {
      outreachMessage: serializedMessage,
      outreachSource: result.source,
      outreachGeneratedAt: generatedAt,
    },
  });

  revalidatePath(`/reports/${report.id}`);
  redirect(`/reports/${report.id}`);
}
