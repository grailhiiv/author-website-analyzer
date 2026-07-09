"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAllowedAdminEmail, isAllowedAdminEmail } from "@/lib/auth/admin";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

export type AdminLoginState = {
  email?: string;
  error?: string;
};

const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid admin email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function signInAdminAction(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check your login details.",
    };
  }

  const { email, password } = parsed.data;

  if (!getAllowedAdminEmail()) {
    return {
      email,
      error:
        "Admin login is not configured yet. Add ADMIN_EMAIL to your environment variables.",
    };
  }

  if (!isAllowedAdminEmail(email)) {
    return {
      email,
      error: "Use the admin email configured for this app.",
    };
  }

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    const requestHeaders = await headers();

    if (existingAdmin) {
      await auth.api.signInEmail({
        body: {
          email,
          password,
          rememberMe: true,
        },
        headers: requestHeaders,
      });
    } else {
      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: "GrailHiiv Admin",
        },
        headers: requestHeaders,
      });
    }
  } catch (error) {
    console.error("Admin sign-in failed", error);

    return {
      email,
      error:
        "Could not sign in. Check the admin email and password, then try again.",
    };
  }

  redirect("/admin");
}
