# Analyzer benchmark corpus

Status: **implemented offline regression gate, schema version 1.0.0**
Last reviewed: **2026-07-14**

The analyzer benchmark is a curated set of synthetic author-site pages with explicit expected evidence. It measures whether extraction, page-role classification, deterministic signal detection, crawl diagnostics, and controlled browser fallback recognize supported evidence without accepting known false positives.

It is a detector calibration tool, not a scoring model. It does not assign points, call AI, or change a report score.

## Run the benchmark

From the repository root:

```bash
npm run benchmark:analyzer
```

The command exits with a nonzero status when any labeled expectation fails. It reports:

- signal precision and recall, including true positives, false positives, false negatives, and true negatives;
- primary- and secondary-role accuracy;
- expected and forbidden evidence-observation results;
- browser-fallback trigger precision, recall, and rendered-evidence adoption;
- analyzer-outcome accuracy and the observed `unknown` rate; and
- successful saved pages compared with discovered crawl candidates.

The same corpus runs in `npm test`, which also enforces minimum case, page, label, outcome, fallback, and scenario-tag coverage.

## Production-path boundary

The runner reads local HTML fixtures, but it uses the same production functions as an actual scan:

1. `extractPageData` performs static extraction.
2. `detectBrowserFallbackTrigger` evaluates deterministic shell indicators.
3. `mergeRenderedExtraction` decides whether an explicitly supplied rendered fixture adds material evidence.
4. `detectAuthorWebsiteSignals` classifies page roles and detects author-site signals.
5. `buildAnalyzerDiagnostics` resolves the persisted `present`, `absent`, and `unknown` outcomes from crawl coverage.

This avoids a second benchmark-only detector that could pass while production still misses the evidence. The runner never fetches a live website, launches a browser, or sends fixture content to an external service, so results remain fast and reproducible.

## Corpus layout

The corpus lives under `benchmarks/author-sites/`:

- `manifest.json` is the versioned, validated annotation contract.
- `fixtures/` contains static and, where needed, rendered HTML snapshots.

Each case declares an ID, description, tags, base URL, and one or more pages. Every page has a site-relative path, fixture path, and expected primary role. A page can also declare expected secondary roles and an optional rendered fixture with explicit fallback trigger and adoption expectations.

Cases may label any of the following:

- `expectedSignals`: dotted production signal paths mapped to `true` or `false`;
- `expectedOutcomes`: diagnostic check IDs mapped to `present`, `absent`, or `unknown`;
- `expectedObservations`: evidence that must exist, optionally constrained by page, source kind, and state;
- `forbiddenObservations`: evidence that must not exist; and
- `crawl`: discovered, attempted, and failed paths used to exercise coverage-aware uncertainty.

Unlabeled values are excluded from precision and recall. This is deliberate: a fixture should not imply a negative result for evidence it was not designed to evaluate.

## Adding a confirmed miss

When a real scan misses evidence or creates a false positive:

1. Reduce the page to the smallest sanitized HTML that still reproduces the behavior. Do not store credentials, form values, private lead data, or unnecessary personal information.
2. Add the fixture under `benchmarks/author-sites/fixtures/`.
3. Add a plainly named case in `manifest.json` with the relevant scenario tags.
4. Label the expected role, signals, observations, outcomes, or fallback behavior. Use `false` labels for known false-positive traps.
5. Run `npm run benchmark:analyzer` and confirm the new case fails for the intended reason.
6. Fix the production extractor, classifier, detector, or diagnostic rule. Do not special-case the benchmark runner.
7. Run the benchmark and the normal test, lint, and type-check suites before merging.

Keep both the regression fixture and its negative safeguards after the fix. A recall improvement is incomplete if it weakens precision.

## Current baseline

Schema version 1.0.0 contains 18 cases and 25 scanned pages. It includes conventional and custom paths, structured-data discovery, local and hosted newsletters, ambiguous forms, article and event traps, malformed JSON-LD, incomplete crawl coverage, JavaScript shells, render failures, and rendered pages with and without material evidence gain.

Corpus results describe only the labeled synthetic scenarios. They are a regression gate, not a claim of perfect accuracy on all live author websites. Confirmed production misses should continuously expand this baseline.
