import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileTextIcon,
  LightbulbIcon,
  SparklesIcon,
} from "lucide-react";

import { GridSection } from "@/components/layout/grid-section";
import { PageHeader } from "@/components/layout/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { sampleReport } from "@/lib/reports/sample-report";

function scoreLabel(score: number) {
  if (score >= 90) {
    return "Strong";
  }

  if (score >= 75) {
    return "Good foundation";
  }

  if (score >= 60) {
    return "Needs improvement";
  }

  if (score >= 40) {
    return "Weak";
  }

  return "Needs major attention";
}

export default function SampleReportPage() {
  return (
    <GridSection>
      <div className="py-10 sm:px-4 lg:px-6">
        <PageHeader
          eyebrow="Sample report"
          title="Fictional Author Website Scorecard"
          description="A realistic preview of what a completed author website report can look like. This sample uses fictional scan data."
          actions={
            <Link href="/analyze" className={buttonVariants()}>
              Analyze My Website
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="rounded-lg border-dashed shadow-none">
            <CardHeader className="border-b border-dashed">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Overall score</CardTitle>
                <Badge variant="secondary">{sampleReport.status}</Badge>
              </div>
              <CardDescription className="break-all">
                {sampleReport.websiteUrl}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-semibold">
                    {sampleReport.overallScore}
                  </span>
                  <span className="pb-1 text-lg text-muted-foreground">
                    /100
                  </span>
                </div>
                <Badge className="mt-3" variant="outline">
                  {scoreLabel(sampleReport.overallScore)}
                </Badge>
              </div>
              <Progress value={sampleReport.overallScore} />
              <p className="text-sm leading-6 text-muted-foreground">
                Scores are deterministic and based on detected website signals.
                AI wording, when used, explains findings without changing the
                numbers.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-dashed shadow-none">
            <CardHeader className="border-b border-dashed">
              <CardTitle>Report overview</CardTitle>
              <CardDescription>
                {sampleReport.authorName} - {sampleReport.authorType} - Goal:{" "}
                {sampleReport.websiteGoal}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <OverviewItem label="Report date" value={sampleReport.reportDate} />
              <OverviewItem label="Pages scanned" value="5 pages" />
              <OverviewItem label="Service fit" value="Website optimization" />
              <div className="md:col-span-3">
                <Alert>
                  <FileTextIcon data-icon="inline-start" />
                  <AlertTitle>Executive summary</AlertTitle>
                  <AlertDescription>
                    {sampleReport.executiveSummary}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-lg border-dashed shadow-none">
            <CardHeader className="border-b border-dashed">
              <CardTitle>Score breakdown</CardTitle>
              <CardDescription>
                The report separates author-site quality into practical
                categories instead of treating it as a generic SEO audit.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {sampleReport.categories.map((category) => (
                <div key={category.id} className="rounded-lg border border-dashed p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{category.label}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                    <Badge variant={category.priorityVariant}>
                      {category.priority}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={category.score} />
                    <span className="w-12 text-right text-sm font-medium">
                      {category.score}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="rounded-lg border-dashed shadow-none">
              <CardHeader className="border-b border-dashed">
                <CardTitle>Top priority fixes</CardTitle>
                <CardDescription>
                  The sample highlights the highest-impact reader journey
                  improvements first.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {sampleReport.findings.map((finding) => (
                  <div key={finding} className="flex gap-3 rounded-lg border border-dashed p-4">
                    <SparklesIcon
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-sm leading-6 text-muted-foreground">
                      {finding}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-dashed shadow-none">
              <CardHeader className="border-b border-dashed">
                <CardTitle>Quick wins</CardTitle>
                <CardDescription>
                  These are practical changes an author or web team can review
                  quickly.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {sampleReport.quickWins.map((quickWin) => (
                  <div key={quickWin} className="flex gap-3 rounded-lg border border-dashed p-4">
                    <CheckCircle2Icon
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-sm leading-6 text-muted-foreground">
                      {quickWin}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-6 rounded-lg border-dashed shadow-none">
          <CardHeader className="border-b border-dashed">
            <CardTitle>Category critique</CardTitle>
            <CardDescription>
              Detailed findings stay tied to what the scan detected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion>
              {sampleReport.detailedFindings.map((finding) => (
                <AccordionItem key={finding.title}>
                  <AccordionTrigger>
                    <span className="pr-3 text-left">{finding.category}</span>
                  </AccordionTrigger>
                  <AccordionContent className="grid gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          finding.severity === "High"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {finding.severity}
                      </Badge>
                      <p className="font-medium">{finding.title}</p>
                    </div>
                    <p className="leading-7 text-muted-foreground">
                      {finding.finding}
                    </p>
                    <p className="leading-7">{finding.recommendation}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-lg border-dashed shadow-none">
            <CardHeader className="border-b border-dashed">
              <CardTitle>Suggested improvements</CardTitle>
              <CardDescription>
                Example author-friendly recommendations from the completed
                report.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Improvement
                title="Homepage"
                body={sampleReport.suggestedHomepageImprovement}
              />
              <Improvement
                title="Call to action"
                body={sampleReport.suggestedCTAImprovement}
              />
              <Improvement
                title="SEO title"
                body={sampleReport.suggestedSeoTitle}
              />
              <Improvement
                title="Meta description"
                body={sampleReport.suggestedMetaDescription}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-dashed shadow-none">
            <CardHeader className="border-b border-dashed">
              <CardTitle>Technical snapshot</CardTitle>
              <CardDescription>
                The real analyzer stores PageSpeed and crawl details when they
                are available.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="mobile">
                <TabsList>
                  <TabsTrigger value="mobile">Mobile</TabsTrigger>
                  <TabsTrigger value="desktop">Desktop</TabsTrigger>
                  <TabsTrigger value="crawl">Crawl</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="mobile"
                  className="grid gap-3 pt-4 sm:grid-cols-2"
                >
                  <Metric
                    label="Performance"
                    value={sampleReport.technicalSnapshot.mobilePerformance}
                  />
                  <Metric
                    label="Accessibility"
                    value={sampleReport.technicalSnapshot.mobileAccessibility}
                  />
                </TabsContent>
                <TabsContent
                  value="desktop"
                  className="grid gap-3 pt-4 sm:grid-cols-2"
                >
                  <Metric
                    label="Performance"
                    value={sampleReport.technicalSnapshot.desktopPerformance}
                  />
                  <Metric
                    label="Accessibility"
                    value={sampleReport.technicalSnapshot.desktopAccessibility}
                  />
                </TabsContent>
                <TabsContent
                  value="crawl"
                  className="grid gap-3 pt-4 sm:grid-cols-3"
                >
                  <Metric
                    label="Pages scanned"
                    value={sampleReport.technicalSnapshot.pagesScanned}
                  />
                  <Metric
                    label="Forms found"
                    value={sampleReport.technicalSnapshot.formsFound}
                  />
                  <Metric
                    label="Retailer links"
                    value={sampleReport.technicalSnapshot.retailerLinksFound}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-start gap-3">
              <LightbulbIcon
                className="mt-1 size-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <CardTitle>Final recommendation</CardTitle>
                <CardDescription className="text-primary-foreground/75">
                  A low-pressure next step for the author.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <p className="max-w-3xl text-sm leading-6 text-primary-foreground/85">
              {sampleReport.finalRecommendation}
            </p>
            <Link
              href="/analyze"
              className={buttonVariants({
                variant: "secondary",
                className: "w-fit",
              })}
            >
              Get your author website score
              <ExternalLinkIcon data-icon="inline-end" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </GridSection>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-dashed p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function Improvement({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-dashed p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
