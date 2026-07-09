"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardListIcon,
  LayoutDashboardIcon,
  MailIcon,
  PlugZapIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navIcons = {
  dashboard: LayoutDashboardIcon,
  reports: ClipboardListIcon,
  leads: MailIcon,
  settings: SettingsIcon,
  scoring: SlidersHorizontalIcon,
  integrations: PlugZapIcon,
};

export type AdminNavIcon = keyof typeof navIcons;

type AdminNavLinkProps = {
  description?: string;
  href: string;
  icon: AdminNavIcon;
  label: string;
  mobile?: boolean;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavLink({
  description,
  href,
  icon,
  label,
  mobile = false,
}: AdminNavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);
  const Icon = navIcons[icon];

  if (mobile) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors",
          active
            ? "bg-zinc-950 text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-zinc-950 text-white shadow-sm"
          : "text-zinc-600 hover:bg-zinc-950/5 hover:text-zinc-950"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-white" : "text-zinc-500 group-hover:text-zinc-950"
        )}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        {description ? (
          <span
            className={cn(
              "block truncate text-xs",
              active ? "text-white/65" : "text-zinc-500"
            )}
          >
            {description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
