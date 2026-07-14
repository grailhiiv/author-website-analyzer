# Detection and evidence standard

Status: **partially implemented detector contract**. Page-role classification, source-attributed role observations, crawl coverage, a first set of `present`/`absent`/`unknown` outcomes, and controlled rendered-browser enrichment are implemented and persisted. Conflicting-state resolution and broader signal migration remain future work.

## Principle

The crawler collects observations. Detectors interpret those observations. Scoring checks consume explicit detector results. A report finding is created only by a failed deterministic scoring check.

```text
fetch -> extract observations -> classify page roles -> detect signals
      -> apply applicability -> run scoring checks -> save findings
```

No layer should hide uncertainty by converting missing crawl coverage into absence.

## Page-role classification

Classify a page from a weighted, deterministic combination of:

1. structured data and semantic page type;
2. main heading, title, and dominant content;
3. navigation/anchor text that led to the page;
4. characteristic entities and actions, such as Book data, retailer links, or an email signup form;
5. URL path as supporting evidence; and
6. sitewide context and relationships to other classified pages.

Keep the winning primary role, supported secondary roles, contributing observations, and classifier version. A path such as `/about` is useful evidence but cannot override content that is clearly a book page, redirect, error page, or company About page.

## Evidence states

Each check should resolve to one of these conceptual states:

- `present`: accepted evidence satisfies the check.
- `absent`: the relevant surface was inspectable and the required evidence was not found after accepted alternatives were evaluated.
- `unknown`: coverage, extraction, rendering, or external audit limitations prevent a defensible result.
- `not_applicable`: a deterministic applicability rule excludes the check.
- `conflicting`: evidence sources materially disagree and require a defined resolution rule.

The implemented score currently accepts pass, fail, and unknown. `not_applicable` and `conflicting` must be mapped only through an approved scoring design. Until then, they should not silently become failures.

## Evidence observation

An observation should retain enough provenance to reproduce a detector result:

```ts
type EvidenceObservation = {
  signalId: string
  sourceUrl: string
  pageRole: string
  scope: 'response' | 'head' | 'main' | 'navigation' | 'footer' | 'rendered'
  sourceKind: 'http' | 'dom' | 'jsonld' | 'link' | 'image' | 'form' | 'text' | 'audit'
  selectorOrProperty?: string
  normalizedValue?: string
  state: 'present' | 'absent' | 'unknown' | 'not_applicable' | 'conflicting'
  strength: 'strong' | 'supporting' | 'weak'
  ruleVersion: string
  observedAt: string | null
}
```

The current baseline emits `present` observations for evidence that contributes to a primary or supported secondary page role. It includes the source URL, source kind, evidence strength, and rule version. It also resolves an initial high-value set of analyzer outcomes to `present`, `absent`, or `unknown` using crawl coverage. Page roles, observations, coverage, outcome reasons, and their rule versions are persisted under `Report.crawlDiagnostics.analysis` whenever scoring is saved.

The persisted outcomes currently cover About presence, book-cover evidence, book purchase paths, newsletter signup, contact routes, privacy information, and homepage title, meta description, and H1. They are diagnostic evidence only in this release: the numeric scoring engine continues to consume the existing deterministic boolean/unknown signal contract until a separately approved scoring migration is calibrated.

Implemented classifier inputs are the final page URL, stored crawler page type, title, H1 and other headings, extracted body text, links, forms, and recursively inspected JSON-LD types. URL paths are supporting evidence except for the root homepage. The classifier uses fixed integer points and deterministic tie-breaking; it does not call AI and does not set numeric scorecard values.

Do not store sensitive form values, credentials, or unnecessary personal data as evidence.

## Evidence strength

- **Strong:** direct, page-relevant evidence such as valid Book JSON-LD matching visible content, a labeled email signup form, a working retailer link attached to a book, or an HTTP header.
- **Supporting:** semantically relevant evidence that needs corroboration, such as a heading plus nearby prose or an About navigation label plus biography copy.
- **Weak:** ambiguous evidence such as a filename, isolated keyword, portrait aspect ratio, or footer-only text.

Strength may resolve conflicts or require corroboration, but it must not become AI confidence or an unapproved floating-point score. Thresholds and combinations must be fixed and tested.

## Minimum detection matrix

| Signal | Accepted positive evidence | Must not count | Unknown when |
| --- | --- | --- | --- |
| Author identity | Matching Person/ProfilePage data; prominent author-name heading/title; corroborated biography attribution | Logo image filename alone; unrelated post byline; publisher/team name | Homepage or About is not inspectable, or sources conflict |
| Writing category or genre | Explicit author/works context in prominent copy, Book data, or repeated book categorization | Navigation category, blog tag, or isolated genre word | Relevant author/book content was not captured |
| About presence | Classified About page with author-focused main content | Company/team About; footer link to a failed page | Candidate failed or classification is ambiguous |
| Book title | Book data matching visible title; title in a book-detail or repeated book-card context | Article/media title; footer mention; filename alone | Book surface was not successfully scanned |
| Book cover | Image tied to a detected book title through card/detail context, structured association, alt/caption, or nearby content | Portrait ratio alone; generic mockup; unrelated affiliate image | Images are CSS-only, lazy sources were not extracted, or book page failed |
| Synopsis | Substantive descriptive prose attached to an identified book | Review quote, author bio, metadata snippet only | Main book content is truncated or dynamic |
| Book action | Working purchase, preorder, borrow, sample, or retailer link attached to a book | Retailer logo without URL; unrelated store/affiliate link | Destination or association could not be inspected |
| Series order | Series identity plus explicit number/order or corroborated ordered Book list | Generic ordered list or a single “series” word | Series page or structured relation was not captured |
| Newsletter signup | Labeled email form with signup intent; clear hosted newsletter destination; recognized provider embed with intent text | Login, checkout, contact email field, or plain mailto link | Dynamic embed/rendering was unavailable or provider was blocked |
| Reader magnet | Explicit free reader-content offer plus delivery/signup/download route | Generic “free,” free shipping, or an unconnected sample word | Offer surface was not captured; applicability remains unresolved |
| Contact route | Working mailto/visible email/labeled contact form or clearly identified representation route | Newsletter form; social icons without contact context | Contact candidate failed or form is uninspectable |
| Social presence | Valid profile link on a recognized platform associated with the author/site | Share buttons, platform scripts, or icon class without link | Links are injected only after rendering |
| Media kit | Classified press/media surface with reusable author/book assets or media contact | Press quotes only; unrelated downloads | Candidate failed; applicability remains unresolved |
| Privacy information | Working privacy-policy link with relevant substantive content | Placeholder/dead link or unrelated platform policy | Policy destination was not fetched |
| Unique title | Nonempty page-specific title distinguishable from other saved pages | Site name repeated identically everywhere | Head metadata could not be extracted |
| Meta description | Nonempty page-relevant description | Open Graph description counted twice as a separate pass | Head metadata was unavailable; accepted fallback not defined |
| Main heading | Descriptive main-topic heading in main content | Logo text, navigation, modal heading, or hidden duplicate | Main content could not be isolated |
| Canonical/indexability | Consistent canonical plus response/meta/header evidence | Canonical alone used to claim indexability | Response headers or final URL are missing/conflicting |
| Structured data | Parseable relevant types whose properties agree with visible content | Type name in raw text; invalid/unrelated schema | Script was truncated or parsing failed |

## Absence and coverage rules

Before returning `absent`, record:

- which page roles were required;
- which candidate URLs were discovered;
- which candidates were requested, redirected, saved, rejected, or failed;
- whether HTML, metadata, structured data, images, forms, and links were inspected;
- whether content was likely JavaScript-dependent;
- which accepted alternatives were evaluated; and
- why no positive evidence qualified.

Examples:

- No newsletter form on saved static HTML + visible provider placeholder + no browser rendering = `unknown`, not absent.
- Successful inspection of homepage, newsletter page, forms, hosted-provider links, and embeds with no signup route = defensible absence.
- No book cover after checking `src`, `srcset`, `<picture>`, and common lazy-image attributes, while the site may use CSS background images or rendered markup = extraction gap, not absence.
- No About page among ten saved URLs, while an unrequested About candidate was discovered = coverage gap, not absence.

## Extraction requirements

For each saved HTML page, retain or derive at least:

- request URL, final URL, status, content type, redirect chain, and relevant response headers;
- canonical, robots, title, description, Open Graph, Twitter metadata, and parseable JSON-LD;
- headings with level and scope;
- links with destination, anchor text, location/scope, and relationship attributes;
- images from `src`, `srcset`, `<picture>`, common lazy attributes, and useful context such as alt/caption/nearby book title;
- forms, controls, labels, input types/names, action/destination, and signup/contact context;
- main-content text separated from navigation/footer boilerplate; and
- extraction warnings and truncation/rendering status.

## Crawl diagnostics

A scan should make misses explainable. Record candidate discovery source, priority score/reason, request outcome, deduplication reason, saved-slot decision, and page-role classification. The current cap is ten unique saved pages and thirty request attempts. Persisted diagnostics now include their schema and extraction versions, those limits, discovered and attempted URLs, request failures, saved URLs, page roles, capability limits, likely JavaScript-dependent saved pages, and unattempted candidates.

`queue_exhausted` means the bounded static discovery queue was exhausted; it is not a claim that every possible site URL exists in the crawl corpus. A failed request or relevant unattempted candidate prevents a confident absence for the affected outcome.

## Dynamic content

Cheerio/static HTML remains the default extraction path. Playwright is a page-scoped fallback, not a second crawler. It runs only for a successfully fetched high-value page that is materially thin and also contains an affirmative shell indicator such as an empty framework root or a JavaScript-required `noscript` message.

The current fallback contract is:

- no more than two rendered pages per report, one at a time;
- exact validated homepage hostname for document and active subresource requests;
- private, local, cross-host, unsafe-protocol, download, popup, service-worker, media, and font activity is blocked;
- no clicking, scrolling, consent acceptance, form submission, or authentication;
- static response facts such as status, canonical, and robots remain authoritative;
- rendered content is adopted only when deterministic richness rules show a material evidence gain;
- trigger, attempt, adoption, request-budget, discovery, truncation, and failure outcomes are persisted; and
- failed or unattempted rendering remains `unknown`, never confident absence.

The rendered fallback does not eliminate the need for infrastructure-level outbound network controls in production. Browser request interception reduces application risk but is not a complete defense against DNS rebinding by itself.

## Regression and calibration corpus

The implemented corpus and contribution workflow are documented in [`benchmark-corpus.md`](./benchmark-corpus.md). Run it with `npm run benchmark:analyzer`; the command fails when any explicitly labeled production-path expectation regresses.

Maintain annotated fixtures covering:

- different author platforms, site builders, languages, naming conventions, and information architectures;
- local and hosted newsletter providers;
- single-book, multi-book, series, unpublished/forthcoming, and hybrid storefront sites;
- positive, negative, ambiguous, blocked, dynamic, duplicate, redirected, and malformed pages; and
- every confirmed production miss and false positive.

For each detector release, report precision, recall, unknown rate, and crawl coverage by signal and page role. A detector improvement is not complete if it increases recall by accepting obvious false positives.

Only explicit labels participate in benchmark metrics. Unlabeled evidence is not treated as absent, because each fixture may be designed to evaluate only a narrow detector boundary.

## Versioning

Version crawler extraction, page classification, signal rules, and scoring checks separately. Save the versions used by each report so a changed detector can be reproduced and old reports are not silently reinterpreted.
