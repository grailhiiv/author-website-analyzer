import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  title?: string;
  className?: string;
};

export function LoadingState({
  title = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn("flex flex-col gap-4", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="grid gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
