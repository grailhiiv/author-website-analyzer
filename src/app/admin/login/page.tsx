import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LockKeyholeIcon, ShieldCheckIcon } from "lucide-react";

import { GridSection } from "@/components/layout/grid-section";
import { LogoLink } from "@/components/layout/logo-link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <GridSection containerClassName="max-w-6xl" hideBottomLine>
      <div className="grid min-h-[calc(100dvh-1px)] items-center gap-8 py-10 lg:grid-cols-[1fr_440px] lg:px-6">
        <div className="hidden max-w-xl flex-col gap-8 lg:flex">
          <LogoLink className="flex shrink-0 items-center" />
          <div>
            <Badge variant="outline" className="mb-4 rounded-full">
              <ShieldCheckIcon data-icon="inline-start" />
              Protected dashboard
            </Badge>
            <h1 className="font-heading text-4xl font-semibold tracking-tight">
              Review author website reports without leaving the analyzer.
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Sign in to review scorecards, captured leads, internal notes, and
              sales follow-up context.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Reports", "Leads", "Outreach"].map((item) => (
              <div key={item} className="rounded-lg border border-dashed p-4">
                <p className="text-sm font-medium">{item}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Admin-only workflow
                </p>
              </div>
            ))}
          </div>
        </div>

        <Card className="rounded-lg border-dashed shadow-none">
          <CardHeader className="border-b border-dashed">
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg border bg-muted/40">
              <LockKeyholeIcon className="size-4" aria-hidden="true" />
            </div>
            <CardTitle>Admin access</CardTitle>
            <CardDescription>
              Use the email configured in ADMIN_EMAIL. The first successful
              login creates the admin account with the password you enter.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminLoginForm />
          </CardContent>
        </Card>
      </div>
    </GridSection>
  );
}
