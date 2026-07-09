import Link from "next/link";
import type React from "react";
import {
  ChartBarSquareIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/20/solid";

import { Button } from "@/components/catalyst/button";
import {
  Navbar,
  NavbarItem,
  NavbarLabel,
  NavbarSection,
  NavbarSpacer,
} from "@/components/catalyst/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "@/components/catalyst/sidebar";
import { SidebarLayout } from "@/components/catalyst/sidebar-layout";
import { Logo } from "@/components/salient/Logo";
import { signOutAdminAction } from "@/lib/auth/actions";

const adminNavItems = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Scorecard overview",
    icon: ChartBarSquareIcon,
  },
  {
    href: "/admin/reports",
    label: "Reports",
    description: "Website scans",
    icon: DocumentTextIcon,
  },
  {
    href: "/admin/leads",
    label: "Leads",
    description: "Captured authors",
    icon: UserGroupIcon,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    description: "Backend controls",
    icon: Cog6ToothIcon,
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
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem href="/analyze">
              <MagnifyingGlassIcon data-slot="icon" />
              <NavbarLabel>New scan</NavbarLabel>
            </NavbarItem>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Link href="/admin" aria-label="Admin dashboard" className="px-2 py-1">
              <Logo className="h-8 w-auto max-w-[210px]" />
            </Link>
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection>
              {adminNavItems.map((item) => (
                <SidebarItem key={item.href} href={item.href}>
                  <item.icon data-slot="icon" />
                  <SidebarLabel>{item.label}</SidebarLabel>
                </SidebarItem>
              ))}
            </SidebarSection>
            <SidebarSpacer />
            <SidebarSection>
              <SidebarItem href="/analyze">
                <MagnifyingGlassIcon data-slot="icon" />
                <SidebarLabel>New scan</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>
          <SidebarFooter>
            <div className="rounded-lg bg-zinc-950/[2.5%] p-3 text-sm/6 ring-1 ring-zinc-950/5">
              <div className="mb-2 flex items-center gap-2 text-xs/5 font-medium text-zinc-500">
                <ShieldCheckIcon className="size-4" aria-hidden="true" />
                Protected admin
              </div>
              <p className="truncate font-medium text-zinc-950">{email}</p>
            </div>
            <form action={signOutAdminAction}>
              <Button type="submit" outline className="mt-3 w-full">
                Sign out
              </Button>
            </form>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  );
}
