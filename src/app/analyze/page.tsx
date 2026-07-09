import {
  BookOpenIcon,
  CheckCircle2Icon,
  GaugeIcon,
  MailIcon,
} from "lucide-react";

import { AnalyzeForm } from "@/app/analyze/analyze-form";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { scoreCategories } from "@/lib/analyzer/categories";

const steps = [
  {
    title: "Website URL",
    description: "We normalize the address and queue a public scan.",
  },
  {
    title: "Author context",
    description: "Author type and goal shape the recommendation language.",
  },
  {
    title: "Scorecard",
    description: "Rules create the scores, then AI explains detected findings.",
  },
];

const focusAreas = [
  { label: "Books", icon: BookOpenIcon },
  { label: "Newsletter", icon: MailIcon },
  { label: "Trust", icon: CheckCircle2Icon },
  { label: "Health", icon: GaugeIcon },
];

export default function AnalyzePage() {
  return (
    <>
      <Section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
        />
        <Container className="grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-5 border-[color:var(--brand)] bg-[var(--brand-soft)]">
              Website analysis
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Start with the website readers see before they subscribe or buy.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Enter the author site and the primary goal. The scan reviews book
              promotion, newsletter paths, SEO basics, mobile experience, trust,
              and technical health.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {focusAreas.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-lg border bg-background p-4 shadow-sm shadow-foreground/5"
                >
                  <Icon className="size-4 text-[var(--brand)]" aria-hidden="true" />
                  <p className="mt-4 text-sm font-medium">{item.label}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-6 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <AnalyzeForm />
          <aside className="flex h-fit flex-col gap-4 rounded-lg border bg-muted/20 p-5 shadow-sm shadow-foreground/5">
            <Badge variant="outline" className="w-fit">
              What happens next
            </Badge>
            <div className="grid gap-4">
              {steps.map((step, index) => (
                <div key={step.title} className="border-l pl-4">
                  <p className="text-sm font-medium">
                    <span className="mr-2 text-[var(--brand)] tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-background p-4">
              <p className="text-sm font-medium">Score categories</p>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                {scoreCategories.slice(0, 4).map((category) => (
                  <p key={category.id}>{category.label}</p>
                ))}
              </div>
            </div>
          </aside>
        </Container>
      </Section>
    </>
  );
}
