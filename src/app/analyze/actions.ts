"use server";

import { ReportStatus } from "@/generated/prisma/client";
import {
  enqueueAnalysisJob,
  scheduleAnalysisJob,
} from "@/lib/analysis/jobs";
import { prisma } from "@/lib/db/prisma";
import {
  analyzeFormSchema,
  type AnalyzeFormValues,
} from "@/lib/schemas/analyze";
import { validateUrlForScan } from "@/lib/urls/security";

type AnalyzeFieldErrors = Partial<Record<keyof AnalyzeFormValues, string>>;

export type CreateQueuedReportResult =
  | {
      ok: true;
      reportId: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: AnalyzeFieldErrors;
    };

function getFieldErrors(
  fieldErrors: Record<string, string[] | undefined>
): AnalyzeFieldErrors {
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .map(([field, messages]) => [field, messages?.[0]])
      .filter((entry): entry is [keyof AnalyzeFormValues, string] =>
        Boolean(entry[1])
      )
  );
}

export async function createQueuedReport(
  input: AnalyzeFormValues
): Promise<CreateQueuedReportResult> {
  const parsed = analyzeFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const data = parsed.data;
  const urlValidation = await validateUrlForScan(data.websiteUrl);

  if (!urlValidation.ok) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        websiteUrl: urlValidation.message,
      },
    };
  }

  const rawWebsiteUrl = input.websiteUrl.trim();
  const leadEmail = data.email.trim();

  try {
    const report = await prisma.report.create({
      data: {
        url: rawWebsiteUrl,
        normalizedUrl: urlValidation.finalUrl,
        domain: urlValidation.domain,
        authorType: data.authorType,
        websiteGoal: data.websiteGoal,
        status: ReportStatus.QUEUED,
        lead: leadEmail
          ? {
              create: {
                name: data.name.trim(),
                email: leadEmail,
                websiteUrl: urlValidation.finalUrl,
                authorType: data.authorType,
                websiteGoal: data.websiteGoal,
                consent: data.consent,
              },
            }
          : undefined,
      },
      select: {
        id: true,
      },
    });
    await enqueueAnalysisJob(report.id);
    scheduleAnalysisJob(report.id);

    return {
      ok: true,
      reportId: report.id,
    };
  } catch (error) {
    console.error("Failed to create queued report", error);

    return {
      ok: false,
      message:
        "We could not start the report yet. Please check the database connection and try again.",
    };
  }
}
