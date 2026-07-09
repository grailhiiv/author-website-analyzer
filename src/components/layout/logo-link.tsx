import Image from "next/image";
import Link from "next/link";

export function LogoLink({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={className}
      aria-label="Go to the Author Website Analyzer home page"
    >
      <Image
        src="/grailhiiv-logo.svg"
        alt=""
        width={46}
        height={46}
        className="size-[46px] shrink-0"
      />
    </Link>
  );
}
