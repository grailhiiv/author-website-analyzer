import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminRouteAccess } from "@/lib/admin/access";
import { getAllowedAdminEmail } from "@/lib/auth/admin";
import { auth } from "@/lib/auth/server";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const access = getAdminRouteAccess({
    allowedAdminEmail: getAllowedAdminEmail(),
    userEmail: session?.user.email,
  });

  if (!session || !access.allowed) {
    redirect(access.redirectTo ?? "/admin/login");
  }

  return <AdminShell email={session.user.email}>{children}</AdminShell>;
}
