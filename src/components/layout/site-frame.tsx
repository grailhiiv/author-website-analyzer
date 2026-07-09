"use client";

import { usePathname } from "next/navigation";

export function SiteFrame({
  children,
  footer,
  header,
}: Readonly<{
  children: React.ReactNode;
  footer: React.ReactNode;
  header: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}
