import { z } from "zod";

const unlockReportSchema = z.object({
  reportId: z.string().min(1, "Report ID is missing."),
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120, "Full Name must be 120 characters or less."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  consent: z.literal("on").optional(),
});

export function parseUnlockReportFormData(formData: FormData) {
  return unlockReportSchema.safeParse({
    reportId: formData.get("reportId"),
    fullName: formData.get("fullName") ?? "",
    email: formData.get("email"),
    consent: formData.get("consent") ?? undefined,
  });
}
