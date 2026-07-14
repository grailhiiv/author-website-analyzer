import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  parseAuthorSiteBenchmarkCorpus,
  runAuthorSiteBenchmark,
  type ConfusionMetrics,
} from "@/lib/benchmark/author-site-benchmark";

const benchmarkDirectory = path.resolve(
  process.cwd(),
  "benchmarks",
  "author-sites",
);

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function confusionSummary(metrics: ConfusionMetrics) {
  return `TP ${metrics.truePositive}, FP ${metrics.falsePositive}, FN ${metrics.falseNegative}, TN ${metrics.trueNegative}`;
}

async function main() {
  const manifestPath = path.join(benchmarkDirectory, "manifest.json");
  const corpus = parseAuthorSiteBenchmarkCorpus(
    JSON.parse(await readFile(manifestPath, "utf8")) as unknown,
  );
  const report = await runAuthorSiteBenchmark({
    corpus,
    readFixture: (fixturePath) =>
      readFile(path.resolve(benchmarkDirectory, fixturePath), "utf8"),
  });
  const passedCases = report.cases.filter((result) => result.passed).length;

  console.log(`Author-site analyzer benchmark ${report.schemaVersion}`);
  console.log(`Cases: ${passedCases}/${report.cases.length} passed`);
  console.log(
    `Signals: precision ${percent(report.metrics.signals.precision)}, recall ${percent(report.metrics.signals.recall)} (${confusionSummary(report.metrics.signals)})`,
  );
  console.log(
    `Primary roles: ${percent(report.metrics.primaryRoles.accuracy)} (${report.metrics.primaryRoles.correct}/${report.metrics.primaryRoles.total})`,
  );
  console.log(
    `Secondary roles: ${percent(report.metrics.secondaryRoles.accuracy)} (${report.metrics.secondaryRoles.exactMatches}/${report.metrics.secondaryRoles.labeledPages})`,
  );
  console.log(
    `Evidence: recall ${percent(report.metrics.evidence.recall)}, forbidden violations ${report.metrics.evidence.forbiddenViolations}/${report.metrics.evidence.forbiddenTotal}`,
  );
  console.log(
    `Browser trigger: precision ${percent(report.metrics.browserTrigger.precision)}, recall ${percent(report.metrics.browserTrigger.recall)} (${confusionSummary(report.metrics.browserTrigger)})`,
  );
  console.log(
    `Browser adoption: ${percent(report.metrics.browserAdoption.accuracy)} (${report.metrics.browserAdoption.correct}/${report.metrics.browserAdoption.labeled})`,
  );
  console.log(
    `Diagnostic expectations: ${percent(report.metrics.outcomes.accuracy)} (${report.metrics.outcomes.correct}/${report.metrics.outcomes.labeled}); observed unknown rate ${percent(report.metrics.outcomes.unknownRate)}`,
  );
  console.log(
    `Crawl coverage: ${report.metrics.crawlCoverage.successfulHtmlPages}/${report.metrics.crawlCoverage.discoveredUrls} successful/discovered (${percent(report.metrics.crawlCoverage.successfulToDiscoveredRatio)})`,
  );

  console.log("\nPer-case results:");
  for (const result of report.cases) {
    console.log(
      `${result.passed ? "PASS" : "FAIL"} ${result.id} (${result.pageCount} pages, ${result.signalExpectationCount} signal labels, ${result.outcomeExpectationCount} outcome labels)`,
    );
    for (const failure of result.failures) console.log(`  - ${failure}`);
  }

  if (!report.passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
