import { z } from "zod";

import { authorTypes, websiteGoals } from "@/lib/analyzer/options";
import { isBlockedHostname, normalizeWebsiteUrl } from "@/lib/urls/normalize";

const authorTypeValues = authorTypes.map((type) => type.value) as [
  (typeof authorTypes)[number]["value"],
  ...(typeof authorTypes)[number]["value"][],
];

const websiteGoalValues = websiteGoals.map((goal) => goal.value) as [
  (typeof websiteGoals)[number]["value"],
  ...(typeof websiteGoals)[number]["value"][],
];

const emailSchema = z.string().email();

export const analyzeFormSchema = z.object({
  websiteUrl: z
    .string()
    .min(1, "Enter an author website URL.")
    .transform((value, context) => {
      try {
        const normalized = normalizeWebsiteUrl(value);
        const hostname = new URL(normalized).hostname;

        if (isBlockedHostname(hostname)) {
          context.addIssue({
            code: "custom",
            message: "Enter a public website URL.",
          });

          return z.NEVER;
        }

        return normalized;
      } catch {
        context.addIssue({
          code: "custom",
          message: "Enter a valid website URL.",
        });

        return z.NEVER;
      }
    }),
  authorType: z.enum(authorTypeValues),
  websiteGoal: z.enum(websiteGoalValues),
  name: z.string().trim().max(120, "Name must be 120 characters or less."),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || emailSchema.safeParse(value).success,
      "Enter a valid email address."
    ),
  consent: z.boolean(),
}).superRefine((value, context) => {
  if (value.email && !value.consent) {
    context.addIssue({
      code: "custom",
      path: ["consent"],
      message: "Please confirm consent before saving lead details.",
    });
  }

  if (value.consent && !value.email) {
    context.addIssue({
      code: "custom",
      path: ["email"],
      message: "Enter an email address to receive the full report.",
    });
  }
});

export type AnalyzeFormValues = z.input<typeof analyzeFormSchema>;
export type NormalizedAnalyzeFormValues = z.output<typeof analyzeFormSchema>;
