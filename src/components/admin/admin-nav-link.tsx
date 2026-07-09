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
          "inline-flex h-8 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
          active
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
        "group flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
        active
          ? "border-border bg-muted/70 text-foreground shadow-xs"
          : "border-transparent text-muted-foreground hover:border-dashed hover:border-border hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active
            ? "text-foreground"
            : "text-muted-foreground group-hover:text-foreground"
        )}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        {description ? (
          <span className="block truncate text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
