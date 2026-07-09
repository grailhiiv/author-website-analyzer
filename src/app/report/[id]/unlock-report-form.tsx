"use client";

import { useActionState } from "react";
import { AlertCircleIcon, LockOpenIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { unlockReportAction, type UnlockReportState } from "./actions";

const initialState: UnlockReportState = {};

export function UnlockReportForm({ reportId }: { reportId: string }) {
  const [state, formAction, isPending] = useActionState(
    unlockReportAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="reportId" value={reportId} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertCircleIcon data-icon="inline-start" />
          <AlertTitle>Could not unlock report</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/20 p-3">
          <label className="text-sm font-medium" htmlFor="unlock-name">
            Name
          </label>
          <Input
            id="unlock-name"
            name="name"
            type="text"
            autoComplete="name"
            defaultValue={state.name}
            placeholder="Jane Author"
          />
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/20 p-3">
          <label className="text-sm font-medium" htmlFor="unlock-email">
            Email
          </label>
          <Input
            id="unlock-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.email}
            placeholder="jane@example.com"
            required
          />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/20 p-4">
        <input
          id="unlock-consent"
          name="consent"
          type="checkbox"
          className="mt-1 size-4 rounded border-input"
          required
        />
        <label htmlFor="unlock-consent" className="text-sm leading-6">
          I agree to share these details so GrailHiiv can unlock this report and
          follow up about author website help.
        </label>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-fit">
        <LockOpenIcon data-icon="inline-start" />
        {isPending ? "Unlocking..." : "Unlock full report"}
      </Button>
    </form>
  );
}
