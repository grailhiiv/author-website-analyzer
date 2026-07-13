"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { deliverFullReportEmail } from "@/lib/email/report-delivery";
import { getReportPath } from "@/lib/reports/domain";
import { parseUnlockReportFormData } from "@/lib/reports/unlock-report-form";

export type UnlockReportState = {
  email?: string;
  fullName?: string;
  error?: string;
};

export async function unlockReportAction(
  _previousState: UnlockReportState,
  formData: FormData,
): Promise<UnlockReportState> {
  const parsed = parseUnlockReportFormData(formData);

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
