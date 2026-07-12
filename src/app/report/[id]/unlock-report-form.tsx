"use client";

import { useActionState } from "react";
import { AlertCircleIcon, LockOpenIcon } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/report/report-ui";
import { Button } from "@/components/report/report-ui";
import Input from "@/components/ui/Input";

import { unlockReportAction, type UnlockReportState } from "./actions";

const initialState: UnlockReportState = {};

export function UnlockReportForm({ reportId }: { reportId: string }) {
  const [state, formAction, isPending] = useActionState(
    unlockReportAction,
    initialState,
  );

  return (
    <form action={formAction} className="mx-auto flex max-w-3xl flex-col gap-5">
      <input type="hidden" name="reportId" value={reportId} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertCircleIcon data-icon="inline-start" />
          <AlertTitle>Could not unlock report</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Input
            id="unlock-name"
            name="name"
            type="text"
            aria-label="Full name"
            autoComplete="name"
            defaultValue={state.name}
            placeholder="Full Name"
            className="h-13 rounded-full border-white/80 bg-white/85 px-5 shadow-sm backdrop-blur-sm placeholder:text-gray-400 dark:border-white/10 dark:bg-slate-950/55"
          />
        </div>

        <div>
          <Input
            id="unlock-email"
            name="email"
            type="email"
            aria-label="Email address"
            autoComplete="email"
            defaultValue={state.email}
            placeholder="Email Address"
            required
            className="h-13 rounded-full border-white/80 bg-white/85 px-5 shadow-sm backdrop-blur-sm placeholder:text-gray-400 dark:border-white/10 dark:bg-slate-950/55"
          />
        </div>
      </div>

      <div className="flex items-start gap-3 py-3.5">
        <input
          id="unlock-consent"
          name="consent"
          type="checkbox"
          className="mt-1 size-4 rounded border-input"
        />
        <label htmlFor="unlock-consent" className="text-sm leading-6 text-gray-600 dark:text-gray-300">
          (Optional) I’d like to receive helpful author website tips, resources,
          and service updates.
        </label>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        icon={<LockOpenIcon aria-hidden="true" />}
        size="lg"
        className="mx-auto inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-7 font-semibold leading-none text-white shadow-lg shadow-blue-700/15 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:translate-y-0 sm:w-fit"
      >
        {isPending ? "Unlocking..." : "Unlock full report"}
      </Button>
    </form>
  );
}
