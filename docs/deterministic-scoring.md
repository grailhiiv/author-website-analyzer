# Deterministic website scoring

The Author Website Analyzer assigns every numeric score from saved scan data. AI can explain the resulting scores and findings, but it cannot create, change, or override them.

## Formula

For each category `c`:

```text
applicable ratio(c) = earned check points(c) / available applicable check points(c)
category score(c)   = round(applicable ratio(c) * category maximum(c))
overall score       = sum(category score(c))
```

Each category score is an integer. It is clamped between zero and the category maximum. The fixed category maxima sum to 100, so the overall score is the direct sum of the eight stored category scores.

| Category | Maximum |
| --- | ---: |
| First Impression and Author Brand Clarity | 15 |
| Book Promotion and Sales Readiness | 20 |
| Reader Conversion and Newsletter Growth | 15 |
| SEO Discoverability | 15 |
| Mobile Experience and Accessibility | 10 |
| Performance and Technical Health | 10 |
| Trust and Credibility | 10 |
| Maintenance and Website Risk | 5 |
| **Overall** | **100** |

The engine also derives a percentage from each stored category score for fair strongest/weakest comparisons:

```text
category percentage(c) = round(category score(c) / category maximum(c) * 100)
```

For example, `12/15` and `16/20` both represent 80 percent even though the categories contribute different point totals to the overall score.

## Scored evidence

The category rules consume deterministic evidence saved by the scan, including:

- crawled page status, headings, titles, descriptions, links, images, forms, word counts, and screenshot presence;
- author-specific signals for brand clarity, books, retailer links, newsletter conversion, trust, and structured data;
- PageSpeed/Lighthouse performance, accessibility, SEO, and best-practices scores;
- technical and maintenance signals such as failed pages, indexability, canonical/schema evidence, HTTPS-related audit data, and stale copyright text.

Failed checks create findings with a fixed category, severity, priority, and recommendation. A conditional check is included only when it applies. For example, the series-page check is part of Book Promotion only for a series author; excluded checks do not reduce another author type's score.

## Scan integration

The analysis pipeline runs in this order:

1. Crawl and save website pages.
2. Capture screenshots and technical audit data when available.
3. Detect author-website signals from the saved scan.
4. Run the deterministic scoring engine.
5. Save each category's score and maximum, save findings, and save the overall score.
6. Generate an AI or fallback narrative from those locked scores and findings. The AI response schema has no numeric score field; application code attaches the already-calculated category percentages after the narrative returns.

AI output can explain findings, but it cannot supply or change a numeric score.

Newly scored reports therefore store category contributions such as `12/15` or `16/20`, rather than normalizing every category to `/100`. Existing reports that were already saved with `/100` remain display-compatible; rescoring a report writes the fixed-point model.
