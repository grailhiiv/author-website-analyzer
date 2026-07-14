# Sitewide author website standards

These practices apply across page roles. The detector should evaluate them at the narrowest defensible scope: response, page, template family, or whole scan.

## Identity and navigation

- The site should expose a consistent author/site identity in text, metadata, structured data, or accessible logo naming.
- Primary navigation should use understandable destination labels and keep core routes discoverable.
- Current-page state, keyboard focus, menus, and mobile navigation should remain operable and perceivable.
- Internal links should have descriptive context and valid destinations. Repeated sitewide footer links are weaker evidence of page prominence than main navigation or main-content links.
- A user should have a recoverable path from deep content to the homepage, books, About, and Contact where applicable.

## Content structure and accessibility

- Page titles, headings, labels, and link text should describe their topic or purpose.
- Each page should have an identifiable main topic. A single descriptive H1 is the preferred project convention, but the detector must not claim that accessibility standards universally require exactly one H1.
- Heading levels should communicate structure rather than visual styling alone.
- Informative images should have useful text alternatives; decorative images should not create noise for assistive technology.
- Forms should have programmatically associated names/instructions, clear validation, keyboard access, and perceivable success/error feedback.
- Content and controls should reflow and remain usable at narrow viewport sizes and text zoom.
- Color, focus indication, target size, captions/transcripts, and motion behavior should follow the relevant WCAG 2.2 success criteria.

## Search visibility and metadata

- Each indexable content page should have a descriptive, page-specific title.
- A useful meta description should summarize the page; it is recommendation evidence, not a guarantee of the snippet a search engine displays.
- Canonical signals should be consistent and should not point unrelated pages to one URL.
- Indexability must combine response headers, robots metadata, redirects, canonical context, and fetch status. A robots.txt rule alone does not prove a page is absent from an index.
- Structured data must match visible content. Prefer relevant types such as `Person`, `ProfilePage`, `Book`, `Article`/`BlogPosting`, `Event`, `WebSite`, and `BreadcrumbList` when supported by the page.
- Open Graph and social metadata improve link presentation but do not replace title, heading, content, or structured-data evidence.
- Important images should use stable sources, descriptive context, appropriate dimensions, and crawlable markup. The extractor should inspect `src`, `srcset`, `<picture>`, and common lazy-loading attributes.

## Mobile and performance

- Evaluate the mobile experience as rendered and interacted with, not merely from a viewport meta tag.
- Use current Core Web Vitals as external performance benchmarks: LCP at or below 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1 at the 75th percentile. The app's implemented score thresholds remain authoritative until deliberately changed.
- Preserve the distinction between field data and lab diagnostics. Missing field data is not a performance failure.
- Avoid page weight, blocking scripts, oversized images, unstable layout, and interaction delay that materially obstruct the reader's task.
- Do not double-score the same underlying audit result across categories.

## Technical health and security

- Public content should load over HTTPS without mixed-content or certificate failures.
- Redirects should settle on the intended canonical host and page without loops.
- Successful fetch status, meaningful HTML, and inspectability are prerequisites for declaring content absent.
- Record response content type, final URL, redirect chain, relevant robots headers, canonical URL, and fetch/render failures as evidence.
- Broken internal links and failed priority pages should be reported with their source page and destination.
- Scripts, consent systems, overlays, and bot protection should not make the primary content or navigation unusable.

## Trust and transparency

- Author identity, contact routes, representation, testimonials, awards, reviews, and press claims should be attributable and not misleading.
- Purchase, signup, download, and contact actions should identify what will happen next.
- Privacy information should be discoverable where personal data is collected.
- Copyright recency can be a maintenance clue, but an old or missing year alone is weak evidence of site abandonment.

## Evidence scope

The same observation has different meaning depending on where it occurs:

| Scope | Example | Appropriate use |
| --- | --- | --- |
| HTTP response | Status, content type, X-Robots-Tag | Technical/indexability checks |
| Head metadata | Title, description, canonical, Open Graph, JSON-LD | Page identity, search, sharing, structured evidence |
| Main content | H1, biography, synopsis, form, event details | Primary page-role checks |
| Navigation | About, Books, Contact links | Discoverability and classification support |
| Footer/boilerplate | Social, privacy, copyright | Sitewide support; weak page-specific evidence |
| Rendered interaction | Menu, modal, validation, layout shift | Usability and dynamic-content evidence |

Detectors should retain scope instead of flattening all page text into one undifferentiated match surface.
