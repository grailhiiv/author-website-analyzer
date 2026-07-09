import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type GridSectionProps = ComponentPropsWithoutRef<"section"> & {
  containerClassName?: string;
  hideBottomLine?: boolean;
  hideVerticalLines?: boolean;
};

export function GridSection({
  children,
  className,
  containerClassName,
  hideBottomLine = false,
  hideVerticalLines = false,
  ...props
}: GridSectionProps) {
  return (
    <section className={cn("w-full overflow-hidden", className)} {...props}>
      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8",
          containerClassName
        )}
      >
        <div className="relative">
          {!hideVerticalLines ? (
            <>
              <div className="absolute inset-y-0 left-0 hidden w-px bg-border lg:block" />
              <div className="absolute inset-y-0 right-0 hidden w-px bg-border lg:block" />
            </>
          ) : null}
          {children}
        </div>
      </div>
      {!hideBottomLine ? <div className="border-t" /> : null}
    </section>
  );
}

export function DashedLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full border-t",
        className
      )}
    />
  );
}
