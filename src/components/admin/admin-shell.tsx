import Link from "next/link";
import { LogOutIcon, SearchIcon, ShieldCheckIcon } from "lucide-react";

import { AdminNavLink } from "@/components/admin/admin-nav-link";
import { LogoLink } from "@/components/layout/logo-link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOutAdminAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const adminNavItems = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Scorecard overview",
    icon: "dashboard",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    description: "Website scans",
    icon: "reports",
  },
  {
    href: "/admin/leads",
    label: "Leads",
    description: "Captured authors",
    icon: "leads",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    description: "Backend controls",
    icon: "settings",
  },
] as const;

export function AdminShell({
  children,
  email,
}: Readonly<{
  children: React.ReactNode;
  email: string;
}>) {
  return (
    <div className="flex min-h-dvh bg-muted/20">
      <aside className="hidden w-72 shrink-0 border-r border-dashed bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-dashed px-5">
          <LogoLink className="flex shrink-0 items-center" />
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {adminNavItems.map((item) => (
            <AdminNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              description={item.description}
              icon={item.icon}
            />
          ))}
        </nav>

        <div className="border-t border-dashed p-3">
          <div className="mb-3 rounded-lg border border-dashed bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheckIcon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Protected admin
              </span>
            </div>
            <p className="truncate text-sm font-medium">{email}</p>
          </div>
          <form action={signOutAdminAction}>
            <Button type="submit" variant="outline" className="w-full">
              <LogOutIcon data-icon="inline-start" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-dashed bg-background/95 px-4 backdrop-blur lg:px-6">
          <LogoLink className="flex shrink-0 items-center lg:hidden" />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              <ShieldCheckIcon data-icon="inline-start" />
              Protected
            </Badge>
            <Link
              href="/analyze"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hidden md:inline-flex"
              )}
            >
              <SearchIcon data-icon="inline-start" />
              New scan
            </Link>
            <form action={signOutAdminAction} className="lg:hidden">
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-dashed bg-background px-4 py-2 lg:hidden">
          {adminNavItems.map((item) => (
            <AdminNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              mobile
            />
          ))}
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
