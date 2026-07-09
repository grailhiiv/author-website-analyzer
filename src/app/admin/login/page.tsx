import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyholeIcon, ShieldCheckIcon } from "lucide-react";

import { Badge } from "@/components/catalyst/badge";
import { Logo } from "@/components/salient/Logo";
import { isAllowedAdminEmail } from "@/lib/auth/admin";
import { auth } from "@/lib/auth/server";

import { AdminLoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session && isAllowedAdminEmail(session.user.email)) {
    redirect("/admin");
  }

  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-8 px-6 py-10 lg:grid-cols-[1fr_440px] lg:px-8">
        <div className="hidden max-w-xl flex-col gap-8 lg:flex">
          <Link href="/" className="flex shrink-0 items-center">
            <Logo className="h-10 w-auto max-w-[242px]" />
          </Link>
          <div>
            <Badge color="zinc" className="mb-4">
              <ShieldCheckIcon data-slot="icon" />
              Protected dashboard
            </Badge>
            <h1 className="font-display text-4xl font-medium tracking-tight text-slate-900">
              Review author website reports without leaving the analyzer.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Sign in to review scorecards, captured leads, internal notes, and
              sales follow-up context.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Reports", "Leads", "Outreach"].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-zinc-950/10 bg-white p-4 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-900">{item}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Admin-only workflow
                </p>
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-lg border border-zinc-950/10 bg-white shadow-sm">
          <div className="border-b border-zinc-950/10 p-6">
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg border border-zinc-950/10 bg-zinc-50">
              <LockKeyholeIcon className="size-4 text-zinc-600" aria-hidden="true" />
            </div>
            <h2 className="text-base/7 font-semibold text-zinc-950">
              Admin access
            </h2>
            <p className="mt-1 text-sm/6 text-zinc-500">
              Use the email configured in ADMIN_EMAIL. The first successful
              login creates the admin account with the password you enter.
            </p>
          </div>
          <div className="p-6">
            <AdminLoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
