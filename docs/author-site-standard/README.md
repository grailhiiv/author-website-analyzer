# Author website quality standard

Status: **calibration baseline, version 0.6**
Last reviewed: **2026-07-14**

This standard defines what the Author Website Analyzer means by a strong author website, page by page, and what observable evidence can support that conclusion. It gives product, crawler, detector, scoring, QA, and report-writing work a shared basis.

## Authority and scope

When documents disagree, use this order:

1. [`../product-plan.md`](../product-plan.md) for confirmed product decisions and explicitly unresolved decisions.
2. [`../deterministic-scoring.md`](../deterministic-scoring.md) and the scoring engine for the currently implemented numeric score.
3. This standard for recommended author-site practices and detector calibration.
4. AI-generated wording for explanation only.

This standard does **not** change the numeric score merely by documenting a practice. A proposed practice becomes scored only after its applicability, evidence, points, recommendation, tests, and version impact are approved and implemented deterministically.

The app evaluates observable website output. It does not ask the author to declare an author type or website goal, and it must not infer a different scoring model from an AI guess about either one.

## Standard structure

- [`page-standards.md`](./page-standards.md): expected content and reader outcomes for each page role.
- [`sitewide.md`](./sitewide.md): navigation, accessibility, search, mobile, performance, security, and trust requirements that cross page boundaries.
- [`detection-evidence.md`](./detection-evidence.md): evidence states, confidence, page classification, false-positive safeguards, and crawl coverage.
- [`check-registry.md`](./check-registry.md): the proposed durable interface between a written standard and executable scoring checks.
- [`benchmark-corpus.md`](./benchmark-corpus.md): the versioned fixture corpus, regression metrics, and workflow for adding confirmed misses.
- [`live-site-validation.md`](./live-site-validation.md): the approved, privacy-safe workflow for measuring the analyzer against real sites.
- [`sources.md`](./sources.md): authoritative external references and the claims they support.
- [`changelog.md`](./changelog.md): versioned changes to this standard and their scoring impact.

## Requirement levels

Every practice is labeled with one of these levels:

- **Core:** broadly expected for the page role and suitable for deterministic evaluation when sufficient evidence exists.
- **Supporting:** improves clarity or conversion but should not fail a score unless a scoring check explicitly adopts it.
- **Conditional:** valuable only when the relevant page, feature, or offer exists. Its absence is not automatically a problem.
- **Advisory:** expert guidance that is difficult to measure reliably or depends on editorial judgment. AI may explain it only from approved evidence; it cannot score it.

## Applicability rule

A detector can mark a practice absent only when all of the following are true:

1. the practice is applicable to the site or identified page role;
2. the relevant page was successfully fetched and inspectable;
3. the detector examined the evidence sources required by the check; and
4. no accepted alternative satisfied the practice.

Otherwise the result is `unknown` or `not_applicable`, not a failure. The current scoring model supports pass, fail, and unknown; adding `not_applicable` to numeric scoring is a product and engine decision, not an assumption made by this document.

## Page roles

The standard recognizes these primary roles:

| Role | Applicability | Main reader outcome |
| --- | --- | --- |
| Homepage | Core | Understand who the author is, what they write, and where to go next. |
| About | Core | Establish identity, relevance, credibility, and connection. |
| Books index | Core when the author has published work | Discover the author's available books. |
| Book detail | Core when an individual book is promoted | Understand one book and take a purchase or discovery action. |
| Series | Conditional | Understand series membership and reading order. |
| Newsletter | Supporting; may be embedded or hosted | Understand the signup value and subscribe confidently. |
| Contact | Core | Find a legitimate, usable route to contact the author or team. |
| Events | Conditional | Find complete details for appearances or events. |
| Media or press kit | Conditional | Give media and event professionals approved facts and assets. |
| Blog or news index | Conditional | Discover current articles, updates, or announcements. |
| Article or post | Conditional | Read a useful, attributable, navigable piece of content. |
| Privacy or legal | Conditional on data collection and jurisdiction | Understand relevant data practices and terms. |
| Store | Conditional | Evaluate and purchase products without ambiguity. |
| Utility or other | Neutral | Support a task without being mistaken for a core content page. |

The page classifier must not rely on the URL slug alone. A page's navigation label, title, heading, structured data, dominant content, forms, and outbound links can provide stronger evidence.

## The eight evaluation categories

Practices map to the confirmed categories: Brand Clarity, Book Visibility, Reader Engagement, Search Visibility, Mobile Performance, Technical Health, Author Trust, and Site Usability. Page standards name relevant categories but do not assign points.

## Known unresolved policy questions

The following must remain explicit until approved:

- **Reader magnets:** the current recommendation says to offer one when it fits the author's goals and genre, but the app intentionally does not collect goals and the current engine scores detection. A deterministic applicability rule or an advisory-only treatment is needed.
- **Media kits:** a press kit is valuable for authors seeking press, speaking, interviews, or events, but it is not universal. The current engine scores it; the future rule needs deterministic applicability or advisory-only treatment.
- **Not-applicable scoring:** the implemented score has pass, fail, and unknown. Whether conditional checks should be excluded from available points requires a deliberate formula and migration decision.

## Change discipline

Every new or changed scored practice should include:

1. a stable check ID;
2. requirement level and deterministic applicability;
3. accepted positive evidence and accepted alternatives;
4. rules for absent, unknown, and false-positive cases;
5. category, points, severity, recommendation, and practical actions;
6. positive, negative, ambiguous, and regression fixtures;
7. a standard version and changelog entry; and
8. a calibration review against a representative author-site corpus.
