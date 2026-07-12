"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { deliverFullReportEmail } from "@/lib/email/report-delivery";
import { getReportPath } from "@/lib/reports/domain";

export type UnlockReportState = {
  email?: string;
  name?: string;
  error?: string;
};

const unlockReportSchema = z.object({
  reportId: z.string().min(1, "Report ID is missing."),
  name: z
    .string()
    .trim()
    .max(120, "Name must be 120 characters or less.")
    .optional()
    .default(""),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  consent: z.enum(["on"]).optional(),
});

export async function unlockReportAction(
  _previousState: UnlockReportState,
  formData: FormData,
): Promise<UnlockReportState> {
  const parsed = unlockReportSchema.safeParse({
    reportId: formData.get("reportId"),
    name: formData.get("name") ?? "",
    email: formData.get("email"),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      error:
        parsed.error.issues[0]?.message ??
        "Please check the form and try again.",
    };
  }

  const { reportId, name, email, consent } = parsed.data;
  let reportPath = "";

  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        domain: true,
        normalizedUrl: true,
        authorType: true,
        websiteGoal: true,
      },
    });

    if (!report) {
      return {
        name,
        email,
        error: "We could not find this report.",
      };
    }

    reportPath = getReportPath(report.domain);

    await prisma.lead.upsert({
      where: { reportId: report.id },
      create: {
        reportId: report.id,
        name,
        email,
        websiteUrl: report.normalizedUrl,
        authorType: report.authorType,
        websiteGoal: report.websiteGoal,
        consent: consent === "on",
      },
      update: {
        name,
        email,
        websiteUrl: report.normalizedUrl,
        authorType: report.authorType,
        websiteGoal: report.websiteGoal,
        consent: consent === "on",
      },
    });

    await deliverFullReportEmail({
      reportId: report.id,
      recipientEmail: email,
      recipientName: name,
    });

    revalidatePath(reportPath);
  } catch (error) {
    console.error("Failed to unlock report", error);

    return {
      name,
      email,
      error:
        "We saved your details, but could not email the report yet. Please try again in a moment.",
    };
  }

  redirect(reportPath);
}
