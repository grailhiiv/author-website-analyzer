"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, AlertCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  createQueuedReport,
  type CreateQueuedReportResult,
} from "@/app/analyze/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authorTypes, websiteGoals } from "@/lib/analyzer/options";
import {
  analyzeFormSchema,
  type AnalyzeFormValues,
  type NormalizedAnalyzeFormValues,
} from "@/lib/schemas/analyze";
import { cn } from "@/lib/utils";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function AnalyzeForm() {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const {
    control,
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
    <Card className="w-full border-dashed shadow-sm">
      <CardHeader className="border-b border-dashed bg-muted/20">
        <CardTitle>Author website details</CardTitle>
        <CardDescription>
          Start an author-focused website analysis. This can take a moment while
          the scanner reviews the site.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-5 pt-6">
          {serverMessage ? (
            <Alert variant="destructive">
              <AlertCircleIcon data-icon="inline-start" />
              <AlertTitle>Report was not created</AlertTitle>
              <AlertDescription>{serverMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded-lg border border-dashed bg-background p-4">
            <div className="flex flex-col gap-2">
            <label htmlFor="websiteUrl" className="text-sm font-medium">
              Website URL
            </label>
            <Input
              id="websiteUrl"
              type="text"
              placeholder="authorname.com"
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
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="authorType" className="text-sm font-medium">
                Author type
              </label>
              <Controller
                control={control}
                name="authorType"
                render={({ field }) => (
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="authorType"
                      className="w-full"
                      aria-invalid={Boolean(errors.authorType)}
                    >
                      <SelectValue placeholder="Choose author type" />
                    </SelectTrigger>
                    <SelectContent>
                      {authorTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.authorType?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="websiteGoal" className="text-sm font-medium">
                Primary website goal
              </label>
              <Controller
                control={control}
                name="websiteGoal"
                render={({ field }) => (
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="websiteGoal"
                      className="w-full"
                      aria-invalid={Boolean(errors.websiteGoal)}
                    >
                      <SelectValue placeholder="Choose website goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {websiteGoals.map((goal) => (
                        <SelectItem key={goal.value} value={goal.value}>
                          {goal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.websiteGoal?.message} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Optional"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email for the full report
              </label>
              <Input
                id="email"
                type="email"
                placeholder="author@example.com"
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

          <div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/20 p-4">
            <input
              id="consent"
              type="checkbox"
              className={cn(
                "mt-1 size-4 rounded border border-input accent-primary",
                errors.consent && "outline outline-2 outline-destructive"
              )}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? "consent-error" : undefined}
              {...register("consent")}
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="consent" className="text-sm font-medium">
                I agree that GrailHiiv can save my report details and contact
                information for this website review.
              </label>
              <p className="text-sm text-muted-foreground">
                This is used to prepare and follow up on the author website
                report.
              </p>
              <div id="consent-error">
                <FieldError message={errors.consent?.message} />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 border-t border-dashed bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            No pressure, no automated sales promises, just a practical website
            critique.
          </p>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Starting analysis..." : "Start Analysis"}
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
