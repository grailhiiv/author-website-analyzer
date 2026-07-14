import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  parseAuthorSiteBenchmarkCorpus,
  runAuthorSiteBenchmark,
} from "@/lib/benchmark/author-site-benchmark";

const benchmarkDirectory = path.resolve(
  process.cwd(),
  "benchmarks",
  "author-sites",
);

async function loadCorpus() {
  const manifest = JSON.parse(
    await readFile(path.join(benchmarkDirectory, "manifest.json"), "utf8"),
  ) as unknown;

  return parseAuthorSiteBenchmarkCorpus(manifest);
}

test("author-site benchmark exercises the production analyzer path without regressions", async () => {
  const corpus = await loadCorpus();
  const report = await runAuthorSiteBenchmark({
    corpus,
    readFixture: (fixturePath) =>
      readFile(path.resolve(benchmarkDirectory, fixturePath), "utf8"),
  });
  const failures = report.cases.flatMap((result) =>
    result.failures.map((failure) => `${result.id}: ${failure}`),
  );
  const tags = new Set(corpus.cases.flatMap((benchmarkCase) => benchmarkCase.tags));

  assert.ok(corpus.cases.length >= 15, "Keep at least 15 representative cases.");
  for (const requiredTag of [
    "positive",
    "negative",
    "ambiguous",
    "dynamic",
    "false-positive",
    "crawl-coverage",
  ]) {
    assert.ok(tags.has(requiredTag), `Missing required corpus tag: ${requiredTag}`);
  }
  assert.ok(report.metrics.signals.labeled >= 45);
  assert.ok(report.metrics.primaryRoles.total >= 20);
  assert.ok(report.metrics.browserTrigger.labeled >= 4);
  assert.ok(report.metrics.outcomes.labeled >= 20);
  assert.equal(report.passed, true, failures.join("\n"));
});

test("author-site benchmark manifest rejects duplicate case ids", () => {
  assert.throws(() =>
    parseAuthorSiteBenchmarkCorpus({
      schemaVersion: "1.0.0",
      description: "Duplicate-id validation fixture.",
      cases: [
        {
          id: "duplicate",
          description: "First.",
          tags: ["validation"],
          baseUrl: "https://one.author.test/",
          pages: [
            {
              path: "/",
              fixture: "one.html",
              expectedPrimaryRole: "HOME",
            },
          ],
        },
        {
          id: "duplicate",
          description: "Second.",
          tags: ["validation"],
          baseUrl: "https://two.author.test/",
          pages: [
            {
              path: "/",
              fixture: "two.html",
              expectedPrimaryRole: "HOME",
            },
          ],
        },
      ],
    }),
  );
});
