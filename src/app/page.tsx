import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  FileSearchIcon,
  GaugeIcon,
  MailIcon,
  MonitorSmartphoneIcon,
  SparklesIcon,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { scoreCategories } from "@/lib/analyzer/categories";
import { cn } from "@/lib/utils";

const workflow = [
  {
    title: "Scan",
    description: "Capture public website signals, page structure, and reader paths.",
  },
  {
    title: "Score",
    description: "Apply deterministic rules across eight author-focused categories.",
  },
  {
    title: "Explain",
    description: "Turn findings into clear guidance without changing the numeric score.",
  },
];

const checks = [
  {
    title: "Book selling path",
    description: "Is the featured book visible, clear, and easy to buy or sample?",
    icon: BookOpenIcon,
  },
  {
    title: "Newsletter path",
    description: "Can readers understand why to subscribe and what they get?",
    icon: MailIcon,
  },
  {
    title: "Mobile trust",
    description: "Does the site feel credible and usable on smaller screens?",
    icon: MonitorSmartphoneIcon,
  },
  {
    title: "Technical health",
    description: "Are performance, metadata, and maintenance risk under control?",
    icon: GaugeIcon,
  },
];

const faqs = [
  {
    question: "What does the analyzer check?",
    answer:
      "It checks author brand clarity, book promotion, newsletter growth, SEO basics, mobile experience, performance, trust signals, and maintenance risk.",
  },
  {
    question: "Is this only for fiction authors?",
    answer:
      "No. It can review fiction, nonfiction, memoir, children's book, series, speaker, and expert author websites.",
  },
  {
    question: "Do I need a WordPress website?",
    answer:
      "No. The analyzer reviews public website pages, so it can work with WordPress and other website platforms.",
  },
  {
    question: "Will this fix my website automatically?",
    answer:
      "No. The report explains what was found and what to improve. GrailHiiv can help with website updates separately if you want support.",
  },
  {
    question: "How long does the report take?",
    answer:
      "Most reports start quickly, but scanning, screenshots, PageSpeed checks, and report writing can take a moment.",
  },
  {
    question: "Is the report free?",
    answer:
      "The public flow is designed to give a useful preview first. The app can unlock a fuller critique when contact details are provided.",
  },
];

function DashedGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
    />
  );
}

function ScorePreview() {
  return (
    <div className="relative rounded-lg border bg-background p-4 shadow-sm shadow-foreground/5">
      <div className="absolute -top-px left-6 h-px w-24 bg-[var(--brand)]" />
      <div className="flex items-start justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--brand)]">
            Live Scorecard
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">78</h2>
        </div>
        <Badge variant="secondary">Good foundation</Badge>
      </div>
      <div className="grid gap-3 py-4">
        {scoreCategories.slice(0, 5).map((category, index) => (
          <div
            key={category.id}
            className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg border bg-muted/20 p-3 text-sm"
          >
            <span className="min-w-0 truncate text-muted-foreground">
              {category.label}
            </span>
            <span className="font-medium tabular-nums">
              {category.sampleScore + index}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-primary p-4 text-primary-foreground">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SparklesIcon className="size-4" aria-hidden="true" />
          Author-friendly summary
        </div>
        <p className="mt-3 text-sm leading-6 text-primary-foreground/80">
          Strong author positioning, but the homepage needs a clearer book CTA
          and newsletter reason above the fold.
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Section className="relative overflow-hidden border-b">
        <DashedGrid />
        <Container className="grid gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:py-20">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-5 border-[color:var(--brand)] bg-[var(--brand-soft)] text-foreground">
              Built for author websites, not generic SEO
            </Badge>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Website audits that show authors what blocks readers from taking
              action.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Score book promotion, newsletter growth, trust, SEO, mobile
              experience, performance, and maintenance risk in one reader-first
              report.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/analyze" className={buttonVariants({ size: "lg" })}>
                Analyze website
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <Link
                href="/sample-report"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                View sample report
              </Link>
            </div>
          </div>
          <ScorePreview />
        </Container>
        <Container className="pb-12">
          <div className="grid gap-3 sm:grid-cols-3">
            {workflow.map((step, index) => (
              <div
                key={step.title}
                className="rounded-lg border bg-background/85 p-4 text-sm shadow-sm shadow-foreground/5"
              >
                <p className="font-medium">
                  <span className="mr-2 text-[var(--brand)] tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {step.title}
                </p>
                <p className="mt-2 leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="py-14">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="rounded-lg border bg-[var(--brand-soft)] p-6 lg:col-span-5">
              <FileSearchIcon className="size-5 text-[var(--brand)]" />
              <h2 className="mt-5 max-w-md text-2xl font-semibold tracking-tight">
                The score follows the job an author website needs to do.
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Every category maps to a real reader decision: understand the
                author, find the right book, trust the site, subscribe, buy, or
                reach out.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {checks.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-lg border bg-background p-5"
                  >
                    <Icon className="size-5 text-[var(--brand)]" />
                    <h3 className="mt-5 font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-y bg-muted/20">
        <Container className="grid gap-8 py-14 lg:grid-cols-[300px_1fr]">
          <div>
            <Badge variant="outline">
              Eight score areas
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Author-specific categories, scored with deterministic rules.
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {scoreCategories.map((category, index) => (
              <div
                key={category.id}
                className={cn(
                  "rounded-lg border bg-background p-4 shadow-sm shadow-foreground/5",
                  index === 0 &&
                    "border-[color:var(--brand)] bg-[var(--brand-soft)] md:row-span-2 md:p-5"
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-medium">{category.label}</h3>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {category.sampleScore}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-8 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge variant="outline">
              Scoring rule
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              AI explains the report. It does not invent the score.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
              Numeric scores come from repeatable checks. AI is used only after
              the scan to translate detected findings into author-friendly
              language.
            </p>
          </div>
          <div className="rounded-lg border p-5">
            {[
              "Deterministic numeric scoring",
              "Reader-focused recommendations",
              "No exaggerated SEO promises",
              "Admin reports and lead visibility",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 border-b py-3 last:border-b-0"
              >
                <CheckCircle2Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t bg-muted/20">
        <Container className="grid gap-8 py-14 lg:grid-cols-[320px_1fr]">
          <div>
            <Badge variant="outline">
              FAQ
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Questions authors usually ask first.
            </h2>
          </div>
          <Accordion>
            {faqs.map((faq) => (
              <AccordionItem key={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="leading-7 text-muted-foreground">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      <Section>
        <Container className="py-14">
          <div className="rounded-lg bg-primary p-6 text-primary-foreground md:flex md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-primary-foreground/75">
                Ready for a reader-focused review?
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Get your author website score.
              </h2>
            </div>
            <Link
              href="/analyze"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "mt-5 md:mt-0"
              )}
            >
              Analyze website
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
