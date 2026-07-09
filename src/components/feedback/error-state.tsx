import { AlertCircleIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ErrorStateProps = {
  title?: string;
  description: string;
  action?: ReactNode;
};

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon data-icon="inline-start" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{description}</span>
        {action}
      </AlertDescription>
    </Alert>
  );
}
