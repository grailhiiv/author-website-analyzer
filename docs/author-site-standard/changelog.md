# Author website quality standard changelog

## 0.6 - 2026-07-14

- Added an operator-approved live-site validation workflow that invokes the production crawler and deterministic analyzer without creating reports or changing scores.
- Added strict manifest validation, sequential crawling, privacy-safe result minimization, explicit expectation labels, and nonzero exit status for crawl or expectation failures.
- Rejected submitted and redirected URLs that contain embedded credentials.

**Scoring impact:** numeric weights and formulas are unchanged. Live validation measures crawler and detector behavior and provides input for sanitized regression fixtures.

## 0.5 - 2026-07-14

- Added a versioned offline author-site benchmark with 18 cases, 25 scanned pages, explicit positive and negative labels, page-role expectations, evidence assertions, diagnostic outcomes, crawl-coverage scenarios, and rendered-fallback checks.
- Added a repeatable `npm run benchmark:analyzer` quality gate that executes the production extraction and deterministic detection path and reports precision, recall, role accuracy, unknown rate, and crawl coverage.
- Prevented YouTube subscription links from being accepted as newsletter signup evidence and event ticket purchases from being accepted as book purchase evidence.

**Scoring impact:** numeric weights and formulas are unchanged. The benchmark calibrates existing deterministic evidence and diagnostics without determining scores.

## 0.4 — 2026-07-14

- Added a deterministic, page-scoped Playwright fallback for explicit JavaScript shells while retaining Cheerio as the default crawler.
- Added exact-host browser network controls, hard page/request/DOM limits, provenance-aware merging, and versioned rendering diagnostics.
- Updated coverage resolution so successful rendering can support absence while failed or unattempted rendering remains `unknown`.

**Scoring impact:** numeric weights and formulas are unchanged. Rendered evidence enriches the same deterministic signal inputs and retains its provenance in `PageScanned.renderedJson`.

## 0.3 — 2026-07-14

- Persisted versioned page roles, observations, crawl coverage, capability limits, and initial signal outcomes with each scored report.
- Added conservative `present`, `absent`, and `unknown` resolution for high-value About, book, newsletter, contact, privacy, and homepage metadata checks.
- Prevented failed HTTP pages and discovered-but-unrequested About candidates from becoming accepted evidence.
- Added extraction for `srcset`, `<picture>`, and common lazy-image attributes, with a bounded responsive-source list.
- Added regression fixtures for unrequested candidates, exhausted bounded discovery, request failures, unsupported CSS/rendered book covers, and responsive image sources.

**Scoring impact:** existing weights and formulas are unchanged. The new outcomes are persisted diagnostics for calibration and later scoring migration; they do not yet replace the legacy deterministic signal inputs.

## 0.2 — 2026-07-14

- Implemented deterministic content-derived page-role classification in the signal layer.
- Added source-attributed, versioned positive observations for role decisions.
- Integrated classified roles into About, book, series, newsletter, contact, media-kit, privacy, and homepage signal detection.
- Added regression coverage for custom slugs, generic newsletter submit buttons, structured Book data, ordered series copy, footer-link noise, and ambiguous pages.

**Scoring impact:** existing weights and formulas are unchanged. Some existing checks can now pass when equivalent evidence was previously missed because a URL-only page type was unknown.

## 0.1 — 2026-07-14

- Established document authority and requirement levels.
- Defined primary page roles and page-by-page observable standards.
- Added sitewide accessibility, search, performance, technical, and trust guidance.
- Defined a proposed evidence model with provenance, evidence strength, coverage safeguards, and explicit uncertainty.
- Defined a proposed stable check-registry contract.
- Recorded primary external sources.
- Flagged reader-magnet, media-kit, rendered-browser fallback, and not-applicable scoring as unresolved decisions.

**Scoring impact:** none. This release documents a calibration baseline and does not modify the deterministic scoring engine.
