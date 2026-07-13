"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { deliverFullReportEmail } from "@/lib/email/report-delivery";
import { getReportPath } from "@/lib/reports/domain";

export type UnlockReportState = {
  email?: string;
  fullName?: string;
  error?: string;
};

const unlockReportSchema = z.object({
  reportId: z.string().min(1, "Report ID is missing."),
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120, "Full Name must be 120 characters or less."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  consent: z.enum(["on"]).optional(),
});

export async function unlockReportAction(
  _previousState: UnlockReportState,
  formData: FormData,
): Promise<UnlockReportState> {
  const parsed = unlockReportSchema.safeParse({
    reportId: formData.get("reportId"),
    fullName: formData.get("fullName") ?? "",
    email: formData.get("email"),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      error:
        parsed.error.issues[0]?.message ??
        "Please check the form and try again.",
    };
  }

  const { reportId, fullName, email, consent } = parsed.data;
  let reportPath = "";

  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        domain: true,
        normalizedUrl: true,
      },
    });

    if (!report) {
      return {
        fullName,
        email,
        error: "We could not find this report.",
      };
    }

    reportPath = getReportPath(report.domain);

    await prisma.lead.upsert({
      where: { reportId: report.id },
      create: {
        reportId: report.id,
        fullName,
        email,
        websiteUrl: report.normalizedUrl,
        consent: consent === "on",
      },
      update: {
        fullName,
        email,
        websiteUrl: report.normalizedUrl,
        consent: consent === "on",
      },
    });

    await deliverFullReportEmail({
      reportId: report.id,
      recipientEmail: email,
      recipientName: fullName,
    });

    revalidatePath(reportPath);
  } catch (error) {
    console.error("Failed to unlock report", error);

    return {
      fullName,
      email,
      error:
        "We saved your details, but could not email the report yet. Please try again in a moment.",
    };
  }

  redirect(reportPath);
}
