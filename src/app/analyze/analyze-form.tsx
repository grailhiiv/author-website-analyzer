"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  createQueuedReport,
  type CreateQueuedReportResult,
} from "@/app/analyze/actions";
import { Button } from "@/components/salient/Button";
import { authorTypes, websiteGoals } from "@/lib/analyzer/options";
import {
  analyzeFormSchema,
  type AnalyzeFormValues,
  type NormalizedAnalyzeFormValues,
} from "@/lib/schemas/analyze";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-red-600">{message}</p>;
}

export function AnalyzeForm() {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<AnalyzeFormValues, unknown, NormalizedAnalyzeFormValues>({
    resolver: zodResolver(analyzeFormSchema),
    defaultValues: {
      websiteUrl: "",
      authorType: authorTypes[0].value,
      websiteGoal: websiteGoals[0].value,
      name: "",
      email: "",
      consent: false,
    },
  });

  async function onSubmit(values: NormalizedAnalyzeFormValues) {
    setServerMessage(null);

    const result: CreateQueuedReportResult = await createQueuedReport(values);

    if (result.ok) {
      router.push(`/report/${result.reportId}`);
      return;
    }

    setServerMessage(result.message);

    if (result.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        if (message) {
          setError(field as keyof AnalyzeFormValues, { message });
        }
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-10 grid grid-cols-1 gap-y-8">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Author website details
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          This can take a moment while the scanner reviews the site.
        </p>
      </div>

          {serverMessage ? (
            <div
              role="alert"
              className="rounded-md bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200"
            >
              <p className="font-semibold">Report was not created</p>
              <p className="mt-1">{serverMessage}</p>
            </div>
          ) : null}

      <div>
        <label htmlFor="websiteUrl" className="mb-3 block text-sm font-medium text-slate-700">
                Website URL
              </label>
        <input
                id="websiteUrl"
                type="text"
                placeholder="authorname.com"
          className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                autoCapitalize="none"
                autoComplete="url"
                inputMode="url"
                spellCheck={false}
                aria-invalid={Boolean(errors.websiteUrl)}
                aria-describedby={
                  errors.websiteUrl ? "websiteUrl-error" : undefined
                }
                {...register("websiteUrl")}
              />
              <div id="websiteUrl-error">
                <FieldError message={errors.websiteUrl?.message} />
              </div>
          </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="authorType" className="mb-3 block text-sm font-medium text-slate-700">
                Author type
              </label>
          <select
            id="authorType"
            className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={Boolean(errors.authorType)}
            {...register("authorType")}
          >
                      {authorTypes.map((type) => (
              <option key={type.value} value={type.value}>
                          {type.label}
              </option>
                      ))}
          </select>
              <FieldError message={errors.authorType?.message} />
            </div>

        <div>
          <label htmlFor="websiteGoal" className="mb-3 block text-sm font-medium text-slate-700">
                Primary website goal
              </label>
          <select
            id="websiteGoal"
            className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={Boolean(errors.websiteGoal)}
            {...register("websiteGoal")}
          >
                      {websiteGoals.map((goal) => (
              <option key={goal.value} value={goal.value}>
                          {goal.label}
              </option>
                      ))}
          </select>
              <FieldError message={errors.websiteGoal?.message} />
            </div>
          </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-3 block text-sm font-medium text-slate-700">
                Name
              </label>
          <input
                id="name"
                type="text"
                placeholder="Optional"
            className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>

        <div>
          <label htmlFor="email" className="mb-3 block text-sm font-medium text-slate-700">
                Email for the full report
              </label>
          <input
                id="email"
                type="email"
                placeholder="author@example.com"
            className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                autoCapitalize="none"
                autoComplete="email"
                spellCheck={false}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              <div id="email-error">
                <FieldError message={errors.email?.message} />
              </div>
            </div>
          </div>

      <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <input
              id="consent"
              type="checkbox"
          className="mt-1 size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? "consent-error" : undefined}
              {...register("consent")}
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="consent" className="text-sm font-medium">
                I agree that GrailHiiv can save my report details and contact
                information for this website review.
              </label>
          <p className="text-sm leading-6 text-slate-600">
                This is used to prepare and follow up on the author website
                report.
              </p>
              <div id="consent-error">
                <FieldError message={errors.consent?.message} />
              </div>
            </div>
          </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Analyzing website..." : "Analyze website"}
      </Button>
    </form>
  );
}
