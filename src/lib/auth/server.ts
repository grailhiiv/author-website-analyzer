import "server-only";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db/prisma";
import {
  getAuthBaseUrl,
  getAuthSecret,
  isAllowedAdminEmail,
} from "@/lib/auth/admin";

const baseURL = getAuthBaseUrl();

export const auth = betterAuth({
  appName: "Author Website Analyzer",
  baseURL,
  secret: getAuthSecret(),
  trustedOrigins: [baseURL],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!isAllowedAdminEmail(user.email)) {
            throw new APIError("FORBIDDEN", {
              message: "This email is not allowed to access the admin dashboard.",
            });
          }

          return {
            data: {
              ...user,
              email: user.email.trim().toLowerCase(),
            },
          };
        },
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [nextCookies()],
});
