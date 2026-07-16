---
title: Validate the analyzer against approved live author sites
description: Run a controlled website crawl against approved author sites, compare deterministic detections with explicit labels, and save a privacy-safe validation report.
nav_title: Live-site validation
---

Use this workflow to find crawler, page-role, and signal-detection misses that synthetic fixtures do not reproduce. The command uses the production crawl and analysis path, but it does not create a user report, calculate a score, or call AI.

Live crawling sends requests to third-party websites. Only include sites an operator has approved for this validation, and review the site's terms and crawl policy before running it.

## Example

As an example, we will approve one public author site, run the bounded validator, then label a confirmed expectation so future runs can detect a regression.

We will start with the committed [example manifest](../../validation/live-sites.example.json), then run the validator, and finally convert confirmed misses into minimized offline fixtures.

### Step 1: Create an approved local manifest

Copy `validation/live-sites.example.json` to `validation/live-sites.json`. The working manifest is ignored by Git so the approved site list and operator notes are not committed accidentally.

```json filename="validation/live-sites.json"
{
  "schemaVersion": "1.0.0",
  "sites": [
    {
      "id": "approved-author-one",
      "url": "https://author.example/",
      "approved": true
    }
  ]
}
```

The manifest refuses unknown fields, duplicate IDs, non-HTTP URLs, embedded credentials, and entries without the literal value `"approved": true`. This prevents a loose URL list from becoming an accidental crawl target.

Before continuing, replace the example domain with a site that has been reviewed and approved. Keep the list small. A single run accepts at most 25 sites and processes them sequentially.

### Step 2: Run the bounded production path

Run the validator from the repository root:

```powershell
npm run validate:live-sites -- --manifest validation/live-sites.json
```

Each site uses the production limits and safety policy. Crawling stays on the final homepage host, saves at most 10 successful HTML pages, makes at most 30 crawl requests, and renders at most two deterministic JavaScript-shell candidates. Sites run one at a time to avoid a request burst.

The terminal prints the completed-site count, expectation totals, and output path. The JSON file is written below `artifacts/live-site-validation/`, which is also ignored by Git.

```text
Live validation completed: 1/1 sites
Expectation results: 0 passed, 0 failed
Sanitized report: ...\artifacts\live-site-validation\report-....json
```

The saved report contains sanitized page URLs, counts, page-role classifications, boolean detections, outcome states, reason codes, and expectation mismatches. It omits page copy, HTML, forms, links, images, raw evidence, exception messages, query strings, fragments, manifest notes, scores, and AI output.

### Step 3: Add labels and preserve confirmed misses offline

After manually reviewing the site and the first sanitized report, add only expectations that a reviewer can confirm. Unlabeled detections do not count as passes or failures.

```json filename="validation/live-sites.json"
{
  "schemaVersion": "1.0.0",
  "sites": [
    {
      "id": "approved-author-one",
      "url": "https://author.example/",
      "approved": true,
      "expectedSignals": {
        "newsletter.newsletterSignupForm": true
      },
      "expectedOutcomes": {
        "engagement.newsletter_signup": "present"
      },
      "expectedPageRoles": [
        {
          "path": "/reader-club",
          "primaryRole": "NEWSLETTER"
        }
      ]
    }
  ]
}
```

Run the same command again. A crawl failure, runner error, or labeled mismatch produces exit code 1 while still writing the sanitized report. This makes the command suitable for an operator-reviewed validation session, but not for unattended crawling of an expanding URL list.

When a label exposes a real miss, reduce the necessary page to the smallest sanitized HTML that still fails. Remove names, credentials, form values, tracking parameters, private lead data, and unrelated content. Add that fixture and its explicit labels to the [offline benchmark corpus](./benchmark-corpus.md), prove the fixture fails, then fix the production extractor or detector. Keep the live URL out of the fixture unless it is required to reproduce URL classification behavior, in which case use a fictional host.

## Manual design review

The report may also show an experimental, unscored `Design & reader experience` section based on Playwright layout evidence. Confirm each automated `Review` item against the matching desktop, tablet, or mobile viewport. Mark it as a true issue, a false positive, or unknown, and record the exact visible element that supports the decision. Do not use design observations to change a score during calibration.

Use this quick checklist for the judgments that snapshots cannot make reliably:

- **Site Structure:** Is the hierarchy logical? Is the menu consistent? Can a reader reach Books, About, newsletter, and Contact without getting lost? Record the click count for buying a book and joining the list.
- **Visual Design:** Does the first impression feel professional and current? Does it fit the author's genre, books, emotional tone, and intended readers? Are book covers, imagery, typography, color, hierarchy, and spacing clear and consistent across the pages reviewed?
- **Conversion design:** Are Buy, Read a sample, Join the newsletter, and Contact actions specific and prominent without competing with one another? Do forms request only necessary information?

The wider 20-point design rubric is supporting detail under these three lenses, not 20 new score categories. Existing analyzer findings remain authoritative when the review overlaps brand clarity, book visibility, reader engagement, trust, freshness, mobile performance, accessibility, or usability.

## Calibration record

The second approved three-site calibration completed on 2026-07-14. Manual review confirmed four reusable detector scenarios:

- a concise homepage positioning statement can appear outside an H1 and immediately after navigation text;
- repeated footer wording must not classify unrelated pages as contact pages;
- a What's New page with multiple book purchase destinations is a books index rather than one book detail page; and
- exact plain `author` image alt text can identify an author portrait, while generic phrases such as `author website logo` cannot.

The crawl-priority calibration also added legacy `.html` route handling, `contact-us` and privacy-disclosure variants, and protection for core contact/privacy surfaces when a site exposes many nested book pages. All confirmed misses were converted into anonymized offline fixtures. The resulting 27-case benchmark passes without changing score weights or category maxima.

The third approved three-site calibration completed on 2026-07-14 against Kristin Hannah, Michael Robotham, and Dervla McTiernan. Manual browser review confirmed seven reusable detector misses:

- author portraits can use hyphenated `author-photo`, `author-img`, or `About the Author` image conventions;
- a root homepage remains primarily `HOME` when a newsletter form is a strong embedded feature;
- a privacy-policy route remains primarily `PRIVACY` when the page also contains article-like markup; and
- WordPress posts can expose reliable semantic article evidence through a `type-post` class or a dated `<time>` element even when the URL has no conventional article prefix.

Each confirmed miss was reduced to an anonymized offline fixture before the production detector was repaired. The expanded 31-case, 41-page benchmark and all 145 tests pass. The final bounded live rerun completed 3/3 sites, passed 7/7 explicit expectations, and reported no crawl failures. All three sites yielded sufficient static HTML, so browser fallback was correctly recorded as `not_needed`. Score weights and category maxima remain unchanged.

## Next steps

You can now measure confirmed live-site misses without changing scores or retaining page content.

Next, use these references:

- [Analyzer benchmark corpus](./benchmark-corpus.md) for permanent regression fixtures and quality metrics.
- [Detection evidence](./detection-evidence.md) for accepted evidence, uncertainty, and false-positive safeguards.
- [Check registry](./check-registry.md) before proposing a new scored rule.
