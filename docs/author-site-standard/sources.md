# External source register

Last reviewed: **2026-07-14**

This register records authoritative sources used for cross-site technical, accessibility, and search guidance. Author-specific page practices combine these technical sources with the product's observable reader outcomes. External guidance informs the standard but does not override confirmed product decisions or automatically change scoring thresholds.

| Source | Authority | Supports |
| --- | --- | --- |
| [W3C Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/) | W3C Recommendation | Accessibility principles and success criteria for perceivable, operable, understandable, and robust web content. |
| [W3C: Headings and Labels](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels) | W3C explanatory guidance | Descriptive headings and labels that communicate topic or purpose. |
| [Google: Web Vitals](https://web.dev/articles/vitals) | Google web.dev | Current Core Web Vitals definitions, thresholds, percentile evaluation, and field/lab distinction. |
| [Google Search appearance](https://developers.google.com/search/docs/appearance) | Google Search Central | Search-result appearance features and the role of supported structured data. |
| [Google: Title links](https://developers.google.com/search/docs/appearance/title-link) | Google Search Central | Descriptive, distinct title text and title-link generation context. |
| [Google: Snippets and meta descriptions](https://developers.google.com/search/docs/appearance/snippet) | Google Search Central | Meta-description guidance and the fact that snippets may be generated from page content. |
| [Google: Site names](https://developers.google.com/search/docs/appearance/site-names) | Google Search Central | `WebSite` structured data and consistent site identity signals. |
| [Google Images SEO](https://developers.google.com/search/docs/appearance/google-images) | Google Search Central | Crawlable image markup, descriptive context, and image metadata practices. |
| [Google: Robots meta tag and X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) | Google Search Central | Page-level and response-header indexing controls. |
| [Schema.org Book](https://schema.org/Book) | Schema.org vocabulary | Machine-readable representation of a book and its properties. |
| [Schema.org Person](https://schema.org/Person) | Schema.org vocabulary | Machine-readable representation of an author/person. |
| [Schema.org ProfilePage](https://schema.org/ProfilePage) | Schema.org vocabulary | Profile-page semantics and relationship to the represented person. |

## Source maintenance

- Prefer standards bodies, search-engine documentation for that engine, platform documentation for provider behavior, and primary research over secondary SEO summaries.
- Record the exact claim a source supports; do not treat a general SEO article as authority for author-specific scoring.
- Re-review time-sensitive performance thresholds, structured-data support, and platform behavior before changing code.
- Archive or note materially changed guidance in the changelog.
