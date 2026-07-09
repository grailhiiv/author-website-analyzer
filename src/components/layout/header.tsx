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
    <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-4">
        <LogoLink className="flex shrink-0 items-center" />
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
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
              className: "md:hidden",
            })}
          >
            Sample
          </Link>
          <Link href="/analyze" className={buttonVariants({ size: "sm" })}>
            Analyze website
          </Link>
        </div>
      </Container>
    </header>
  );
}
