import Link from "next/link";

import { Container } from "@/components/layout/container";
import { LogoLink } from "@/components/layout/logo-link";
import { buttonVariants } from "@/components/ui/button";

const navItems = [
  { href: "/sample-report", label: "Sample Report" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
      <Container className="flex h-20 items-center justify-between gap-4">
        <LogoLink className="flex shrink-0 items-center" />
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "rounded-full px-3 text-slate-600 hover:text-slate-950",
              })}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/sample-report"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "rounded-full md:hidden",
            })}
          >
            Sample
          </Link>
          <Link
            href="/analyze"
            className={buttonVariants({
              size: "sm",
              className: "h-9 rounded-full px-4",
            })}
          >
            Analyze website
          </Link>
        </div>
      </Container>
    </header>
  );
}
