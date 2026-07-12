import { z } from "zod";

import { isBlockedHostname, normalizeWebsiteUrl } from "@/lib/urls/normalize";

export const websiteScanSchema = z.object({
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
});

export type WebsiteScanValues = z.input<typeof websiteScanSchema>;
