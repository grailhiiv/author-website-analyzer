import Link from "next/link";

import { Container } from "@/components/layout/container";
import { LogoLink } from "@/components/layout/logo-link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container className="flex flex-col gap-8 py-10 text-sm md:flex-row md:items-center md:justify-between">
        <LogoLink className="flex shrink-0 items-center" />
        <div className="flex flex-wrap gap-4 text-slate-500">
          {[
            { href: "/analyze", label: "Analyze website" },
            { href: "/sample-report", label: "Sample Report" },
            { href: "/admin", label: "Admin" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </Container>
    </footer>
  );
}
