import Link from "next/link";

import { AnalyzeForm } from "@/app/analyze/analyze-form";
import { Logo } from "@/components/salient/Logo";
import { SlimLayout } from "@/components/salient/SlimLayout";
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

export default function AnalyzePage() {
  return (
    <SlimLayout>
      <div className="flex">
        <Link href="/" aria-label="Home">
          <Logo className="h-10 w-auto max-w-[242px]" />
        </Link>
      </div>
      <h1 className="mt-20 text-lg font-semibold text-slate-900">
        Start an author website scorecard
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        Enter the author site and primary goal. The scan reviews book promotion,
        newsletter paths, SEO basics, mobile experience, trust, and technical
        health.
      </p>

      <AnalyzeForm />

      <aside className="mt-10 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <p className="text-sm font-semibold text-slate-900">What happens next</p>
        <div className="mt-5 grid gap-5">
          {steps.map((step, index) => (
            <div key={step.title} className="relative pl-8">
              <span className="absolute left-0 top-0 flex size-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {step.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-sm font-semibold text-slate-900">
            Score categories
          </p>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            {scoreCategories.slice(0, 4).map((category) => (
              <p key={category.id}>{category.label}</p>
            ))}
          </div>
        </div>
      </aside>
    </SlimLayout>
  );
}
