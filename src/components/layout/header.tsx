import Link from "next/link";

import { Container } from "@/components/layout/container";
import { LogoLink } from "@/components/layout/logo-link";
import { buttonVariants } from "@/components/ui/button";

const navItems = [
  { href: "/analyze", label: "Analyze" },
  { href: "/sample-report", label: "Sample Report" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-dashed bg-background/90 backdrop-blur-xl">
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
        <Link href="/analyze" className={buttonVariants({ size: "sm" })}>
          Analyze
        </Link>
      </Container>
    </header>
  );
}
