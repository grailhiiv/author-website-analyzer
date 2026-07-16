# Author website quality standard changelog

## 0.9 - 2026-07-16

- Replaced the active audit-check status model with exactly Passed, Needs Review, and Failed.
- Preserved deterministic scoring: Passed receives full credit, Needs Review receives half credit, and Failed receives zero.
- Added canonical Details and Recommendation content for all 50 checks and all three statuses.
- Removed the separate Action field from audit guidance, findings, report rendering, and persistence.
- Migrated saved check results and deterministic finding content to the new status model.

**Scoring impact:** category maxima, check weights, and the overall 100-point model are unchanged.

## 0.8 - 2026-07-14

- Approved and implemented the first stable-ID rendered scoring checks: `usability.primary_navigation`, `mobile.viewport_fit`, and `mobile.text_contrast`.
- Replaced three existing proxy points without changing the eight category maxima or 100-point total.
- Added interactive collapsed-menu inspection, unclipped overflow-source detection, contrast measurement coverage thresholds, versioned per-check persistence, finding origins, fixed recommendations, and anonymized regression fixtures.
- Distinguished invalid or hostname-mismatched HTTPS certificates from request timeouts so unreachable sites receive the correct owner-facing repair guidance.
- Kept all subjective design judgments and the remaining Site Structure, Visual Design, and Conversion Design observations advisory.

**Scoring impact:** confirmed failures can now reduce one existing Site Usability raw point and two existing Mobile Performance raw points. Missing or insufficient rendered evidence receives half credit and creates no failure finding. Category maxima and conditional applicability are unchanged.

## 0.7 - 2026-07-14

- Completed a third operator-approved calibration batch across three live author sites, with 3/3 bounded crawls and 7/7 explicit regression expectations passing on the final run.
- Added production recognition for semantic WordPress posts and common author-portrait filename and alt-text conventions.
- Kept homepage and privacy routes as the primary page role when strong embedded newsletter, article, or contact evidence is also present.
- Expanded the anonymized offline regression corpus to 31 cases and 41 scanned pages.

**Scoring impact:** numeric weights and conditional-check applicability are unchanged. These changes improve deterministic extraction and classification only.

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
- Flagged reader-magnet, media-kit, and rendered-browser fallback policies as unresolved decisions.

**Scoring impact:** none. This release documents a calibration baseline and does not modify the deterministic scoring engine.
