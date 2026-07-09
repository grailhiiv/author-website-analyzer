import "server-only";

import { z } from "zod";

function requiredString(name: string, purpose: string) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().min(1, `${name} is required. ${purpose}`)
  );
}

const serverEnvSchema = z.object({
  DATABASE_URL: requiredString(
    "DATABASE_URL",
    "Add the PostgreSQL connection string used by Prisma."
  ).pipe(z.string().url("DATABASE_URL must be a valid database URL.")),
  OPENAI_API_KEY: requiredString(
    "OPENAI_API_KEY",
    "Add the server-side OpenAI API key used for report explanations."
  ),
  PAGESPEED_API_KEY: requiredString(
    "PAGESPEED_API_KEY",
    "Add the PageSpeed Insights API key used for performance data."
  ),
  APP_URL: requiredString(
    "APP_URL",
    "Add the public app URL, such as https://example.com or http://localhost:3000."
  ).pipe(z.string().url("APP_URL must be a valid URL.")),
  ADMIN_EMAIL: requiredString(
    "ADMIN_EMAIL",
    "Add the email address for the first admin or admin notifications."
  ).pipe(z.string().email("ADMIN_EMAIL must be a valid email address.")),
  AUTH_SECRET: requiredString(
    "AUTH_SECRET",
    "Add a long random secret for signing authentication data."
  ).pipe(
    z
      .string()
      .min(32, "AUTH_SECRET must be at least 32 characters long.")
  ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function formatEnvErrors(error: z.ZodError) {
  return error.issues
    .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

export function validateServerEnv(runtimeEnv: NodeJS.ProcessEnv): ServerEnv {
  const parsed = serverEnvSchema.safeParse(runtimeEnv);

  if (!parsed.success) {
    throw new Error(
      `Missing or invalid server environment variables:\n${formatEnvErrors(
        parsed.error
      )}`
    );
  }

  return parsed.data;
}

export const env = validateServerEnv(process.env);
