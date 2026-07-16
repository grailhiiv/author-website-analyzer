# Deterministic website scoring

The Author Website Analyzer assigns every numeric score from saved scan data. AI can explain the resulting scores and findings, but it cannot create, change, or override them.

## Related standards

- [`author-site-standard/README.md`](./author-site-standard/README.md) defines the authority, scope, and maintenance rules for the author-site standard.
- [`author-site-standard/page-standards.md`](./author-site-standard/page-standards.md) documents recommended observable qualities by page role.
- [`author-site-standard/detection-evidence.md`](./author-site-standard/detection-evidence.md) defines how crawler evidence should support a deterministic result.
- [`author-site-standard/check-registry.md`](./author-site-standard/check-registry.md) documents the implemented stable-ID contract and all current registered checks.

Those documents are a calibration basis. They do not add, remove, or reweight a scoring check by themselves. A numeric scoring change requires an explicit product decision, an engine change, tests, and an entry in the standard changelog.

## Formula

For each category `c`:

```text
earned check points(c) = full points for pass + half points for unknown
category score(c)      = round(earned check points(c) / available points(c) * category maximum(c))
overall score          = sum(category score(c))
```

Each category score is an integer. It is clamped between zero and the category maximum. The fixed category maxima sum to 100, so the overall score is the direct sum of the eight stored category scores.

| Category | Maximum |
| --- | ---: |
| Brand Clarity | 15 |
| Book Visibility | 20 |
| Reader Engagement | 15 |
| Search Visibility | 15 |
| Mobile Performance | 10 |
| Technical Health | 10 |
| Author Trust | 10 |
| Site Usability | 5 |
| **Overall** | **100** |

The engine also derives a percentage from each stored category score for fair strongest/weakest comparisons:

```text
category percentage(c) = round(category score(c) / category maximum(c) * 100)
```

For example, `12/15` and `16/20` both represent 80 percent even though the categories contribute different point totals to the overall score.

## Scored evidence

Every check has one of three states:

- **Pass:** awards all check points.
- **Fail:** awards no points and creates a fixed finding, primary recommendation, and practical-action list.
- **Unknown:** awards half the check points and does not create a site-problem finding. This is used when an external audit such as PageSpeed is temporarily unavailable.

The persisted check-result model also supports **Not applicable**, but all 50 current registered checks retain their existing universal applicability and never use it. The unresolved conditional-check and not-applicable policies remain unchanged. Three registered rendered checks use objective browser observations; the remaining design observations stay advisory. Each registered result stores the registry version, check version, state, available and earned points, reason code, and bounded evidence references. Rescoring replaces deterministic score findings and check results while preserving separately marked system-diagnostic findings.

The category rules consume deterministic evidence saved by the scan, including:

- crawled page status, headings, titles, descriptions, links, images, forms, word counts, and screenshot presence;
- author-specific signals for brand clarity, books, retailer links, newsletter conversion, trust, and structured data;
- PageSpeed/Lighthouse performance, accessibility, SEO, and best-practices scores;
- rendered homepage navigation behavior, genuine page-level mobile overflow, and sufficiently covered measurable mobile text contrast;
- technical and maintenance signals such as HTTPS, failed pages, indexability, canonical/schema evidence, and stale copyright text.

Failed checks create findings with a fixed category, severity, priority, primary recommendation, and several concrete practical actions. The primary recommendation states what to improve; its practical actions explain how to begin. Both are deterministic rule content and are saved with the report, so they do not depend on AI availability. Numeric scores are based only on observable website evidence. Author type and website goal do not change the score.

Passed checks display fixed check-specific confirmation details, a maintenance recommendation, and practical tips. Unknown checks display fixed reason-aware evidence limitations, a manual-verification recommendation, and practical actions. This status guidance is selected from the registered check ID and result state, remains independent of AI, and does not alter points, applicability, or finding creation.

AI receives these saved recommendations and actions as constrained source material. It may make the explanation more author-friendly or select the most relevant supplied action, but it cannot create a failed check, change its score, or replace the deterministic fallback.

PageSpeed data is divided by module rather than scored twice:

- **Mobile Performance** uses mobile performance, mobile accessibility, and mobile Lighthouse SEO, plus crawl-based mobile review evidence.
- **Mobile Performance** assigns one existing raw point to `mobile.viewport_fit` and one existing raw point to `mobile.text_contrast`; these replace proxy points and do not increase the category maximum.
- **Technical Health** uses desktop performance, mobile and desktop best practices, desktop accessibility, HTTPS, successful page loading, indexability, and canonical/schema structure.
- **Site Usability** no longer loses points when PageSpeed is unavailable.
- **Site Usability** assigns one existing raw point to `usability.primary_navigation`, replacing the former multi-page-count proxy.

When PageSpeed cannot run, the report can show a separate audit-availability notice, but it does not claim that the website failed those checks.

## Crawl and detection safeguards

The crawler saves up to ten unique pages. It prioritizes the homepage, books and book-detail paths, about/bio pages, newsletter paths, contact, and supporting content. Tracking parameters are removed before URLs are compared.

A duplicate URL, canonical URL, or exact normalized content fingerprint does not consume a saved crawl slot. This keeps aliases such as `/home` from replacing a more useful Books or About page.

Author-focused detection now combines multiple deterministic sources:

- author names from Person schema, Unicode-aware title and heading candidates, and biography language;
- book titles from Book schema and contextual headings on home, books, series, and book-detail pages;
- cover images from explicit cover wording, detected book-title filenames or alt text, and portrait image dimensions on book-focused pages;
- newsletter signup evidence from local forms, hosted provider links, and embedded providers such as Substack, Kit/ConvertKit, Mailchimp, MailerLite, beehiiv, Buttondown, Flodesk, and Campaign Monitor.

## Scan integration

The analysis pipeline runs in this order:

1. Crawl and save website pages.
2. Capture screenshots and technical audit data when available.
3. Detect author-website signals from the saved scan.
4. Run the deterministic scoring engine.
5. Save each category's score and maximum, each registered check result and evidence reference, findings with their primary recommendations and practical actions, and the overall score.
6. Generate an AI or fallback narrative from those locked scores and findings. The AI response schema has no numeric score field; application code attaches the already-calculated category percentages after the narrative returns.

AI output can explain findings, but it cannot supply or change a numeric score.

Newly scored reports therefore store category contributions such as `12/15` or `16/20`, rather than normalizing every category to `/100`. Existing reports that were already saved with `/100` remain display-compatible; rescoring a report writes the fixed-point model.
