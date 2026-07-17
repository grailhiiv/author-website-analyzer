# Needs Review Status Content — Author Website Analyzer

These are fallback Details statements and the canonical technical recommendations for each deterministic check. During a completed scan, Details are generated from the actual inspected evidence, page, observation, and threshold.

## 1. Brand Clarity — 15 points

### Author name is clear — 4 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Verify that the published author name appears as visible text in the homepage header, hero, primary H1, document title, or Person structured data. When the name exists only inside a logo, image, slider, or interaction-dependent component, add a readable HTML equivalent and rerun the scan after confirming the public page renders completely.

### Writing category is clear — 3 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Inspect the rendered homepage introduction, hero, and headings to confirm that a clear genre, subject, or writing-category phrase is visible to readers. When this information appears only in artwork, rotating slides, hidden tabs, or script-loaded content, expose it as persistent HTML text and rescan the public homepage.

### Homepage headline gives brand clarity — 4 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Open the homepage in a signed-out desktop and mobile browser and confirm that one prominent headline clearly identifies the author, books, genre, audience, or reader promise. When the headline is hidden by a carousel, popup, consent layer, artwork, or delayed rendering, expose a default HTML version and rerun the scan.

### About path is present — 3 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Follow the likely About links from the homepage, navigation, footer, and sitemap and confirm that a public biography destination loads successfully. When the page is unlinked, blocked, excessively redirected, protected by login, or unavailable to the scanner, correct the access path and rerun the crawl before assigning a confirmed result.

### Homepage has useful introductory content — 1 point

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Inspect the initial rendered homepage for readable introductory text that explains the author or books and provides a useful next step. When the only context appears inside artwork, sliders, delayed scripts, tabs, or blocked components, add a persistent HTML introduction and rerun the scan after confirming complete rendering.

## 2. Book Visibility — 20 points

### Book cover is visible — 4 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Verify that a current book cover appears visibly in the inspected homepage or book content and is not loaded only after a carousel click, popup, hover, or unsupported script action. Prefer an accessible `<img>` with a valid source, dimensions, and descriptive alt text, then rescan the fully rendered public page.

### Book title is visible — 3 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Inspect each featured-book presentation and confirm that the full title appears as visible HTML text near the correct cover and actions. When the title exists only inside cover artwork, a hidden tab, rotating slide, or delayed component, add a semantic text heading and rerun the scan after the default view renders.

### Book description is present — 4 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Review the public book presentation for visible descriptive copy associated with at least one featured title. When the hook or synopsis appears only in artwork, an inaccessible accordion, a blocked widget, or script-dependent content, expose a readable HTML version and rerun the scan after the relevant section loads completely.

### Book purchase links are present — 4 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Test every visible purchase control and confirm that it functions as a standard link or accessible button leading to the intended book or retailer destination. When the action depends on JavaScript-only handlers, blocked redirectors, third-party widgets, or inaccessible regional routing, provide a crawlable final URL and rerun the scan.

### Purchase options match book availability — 2 points

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so purchase options match book availability requires review.

**Recommendation:** Confirm whether the featured book is widely distributed, retailer-exclusive, or direct-only, then compare that model with the purchase options shown on the site. When availability cannot be reliably determined from the inspected pages or external destinations, verify it manually, update the links or exclusivity wording as needed, and rescan.

### Reader proof is present — 2 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Inspect visible review excerpts, ratings, awards, and endorsements and confirm that they relate to the featured book and include recognizable attribution. When proof is supplied only through a blocked third-party widget, hidden carousel, inaccessible embed, or ambiguous copy, add a readable attributed HTML version and rerun the scan.

### Featured book section is present — 1 point

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Confirm that one current title is intentionally presented as a complete default section containing its cover, text title, useful description, and purchase path. When these elements are separated across tabs, sliders, popups, or interaction-dependent components, expose a complete initial presentation and rerun the fully rendered page scan.

## 3. Email Growth — 15 points

### Newsletter signup is present — 5 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Locate and manually test the newsletter form or subscription destination to confirm that it is publicly accessible and accepts an email address. When the signup is blocked by an iframe, bot challenge, popup trigger, delayed script, or inaccessible provider page, expose a persistent usable path and rerun the scan.

### Newsletter is visible on the homepage — 3 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Open the homepage at desktop and mobile widths and confirm that a newsletter form or clearly labeled signup link is visible without waiting for a popup or performing an unsupported interaction. When only a delayed or blocked subscription prompt exists, add a persistent inline path and rerun the scan.

### Reader magnet is present — 4 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Verify that the site clearly offers a reader incentive and that the offer explains what is delivered after signup. When the magnet appears only in a popup, image, inaccessible iframe, or email-platform script the scanner cannot inspect, expose the offer as readable page content and test delivery before rescanning.

### Subscriber benefit is clear — 3 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Read the copy immediately surrounding the newsletter form or subscription link and confirm that it clearly explains what subscribers receive. When the benefit appears only in placeholder text, an image, delayed script, popup, or blocked embed, add persistent HTML copy and rerun the scan after the form renders fully.

## 4. Search Visibility — 15 points

### Title tag is present — 1 point

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Inspect both the initial page source and final rendered document head to confirm that one meaningful homepage `<title>` is present. When metadata is added only client-side, overwritten by a plugin, duplicated, or unavailable because rendering failed, correct the metadata configuration and rerun the scan.

### Title supports the author brand — 2 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Check the final rendered homepage title and confirm that it contains the published author name, recognized pen name, or another clear author-brand identifier. When plugins, templates, or client-side scripts overwrite the expected value, correct the metadata output and rerun the scan against the live public URL.

### Meta description is present — 2 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Inspect the initial source and final rendered head for one distinct, non-empty `<meta name="description">`. When the description is missing from the server response, duplicated, overwritten client-side, or unavailable because rendering failed, correct the metadata template and rerun the scan on the public homepage.

### Primary heading structure is clear — 2 points

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so primary heading structure is clear requires review.

**Recommendation:** Inspect the final rendered heading hierarchy and determine whether one clear page-level H1 identifies the homepage’s primary topic. When headings are inserted only after interaction, duplicated by the theme, hidden behind overlays, or unavailable because rendering failed, correct the template or component and rerun the scan.

### Main heading gives author clarity — 3 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Read the visible primary heading independently from nearby imagery and confirm that it identifies the author, books, genre, audience, or reader promise. When the heading is artwork, pseudo-content, delayed JavaScript, or hidden by an overlay, replace or supplement it with semantic HTML and rerun the scan.

### Page appears indexable — 3 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Inspect the live page’s meta robots directives, canonical destination, authentication state, and rendered metadata to determine whether the page is intended to be indexable. When headers, redirects, page access, or rendering are incomplete, correct the access condition and rerun the scan before treating the page as blocked.

### Useful internal links are present — 2 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Inspect the rendered homepage and navigation for standard crawlable anchors to important reader pages, then follow each destination to confirm it loads correctly. When navigation depends on JavaScript-only controls, blocked redirects, incomplete rendering, or uncrawled pages, expose direct final URLs and rerun the crawl.

## 5. Mobile Experience — 10 points

### Mobile performance meets target — 4 points

**Status:** Needs Review

**Details:** The required PageSpeed result was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Run a current mobile PageSpeed or Lighthouse audit against the exact public homepage and confirm that a complete result is returned. When authentication, bot protection, consent interstitials, server errors, or blocked resources prevent testing, correct the access condition and rerun the analyzer before evaluating performance.

### Mobile accessibility meets target — 1 point

**Status:** Needs Review

**Details:** The required PageSpeed result was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Run a complete mobile accessibility audit and manually inspect the page’s navigation, forms, controls, focus behavior, and readable content. When a login gate, bot challenge, persistent overlay, rendering error, or blocked asset prevents reliable testing, remove the obstruction and rerun the analyzer before assigning a confirmed result.

### Mobile text meets baseline contrast — 1 point

**Status:** Needs Review

**Details:** The required rendered-page or viewport evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Measure representative mobile text, links, buttons, and controls against their actual rendered backgrounds using a contrast-testing method. When overlays, missing assets, animation, blocked content, or incomplete viewport capture prevents reliable measurement, correct the rendering condition and rerun the scan before confirming compliance or failure.

### Mobile interactive controls meet usability baseline — 1 point

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so mobile interactive controls meet usability baseline requires review.

**Recommendation:** Operate the homepage’s mobile menu, forms, purchase controls, dialogs, and other interactive components using touch and keyboard input where applicable. When rendering errors, overlays, blocked scripts, or incomplete interaction testing prevent a reliable conclusion, correct those conditions and rerun the mobile scan.

### Images include appropriate alt text — 1 point

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so images include appropriate alt text requires review.

**Recommendation:** Inspect meaningful images in the rendered mobile DOM and confirm that each has useful alternative text while decorative images use `alt=""`. When images are generated by inaccessible widgets, supplied only as CSS backgrounds, lazy-loaded after interaction, or unavailable to the scanner, add accessible equivalents and rescan.

### Homepage loads with a main heading — 1 point

**Status:** Needs Review

**Details:** The required rendered-page or viewport evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Load the homepage in a signed-out mobile browser and confirm that it returns successfully with one visible, readable text H1 in the initial rendered content. When authentication, overlays, delayed scripts, or client-side failures prevent inspection, correct the rendering condition and rerun the scan.

### Mobile page fits the viewport — 1 point

**Status:** Needs Review

**Details:** The required rendered-page or viewport evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Test the rendered page at common mobile widths and determine whether the document itself scrolls horizontally or clips essential content. When overlays, missing assets, blocked scripts, or incomplete capture prevent reliable measurement, correct those conditions, inspect oversized elements, and rerun the viewport scan.

## 6. Technical Health — 10 points

### Desktop performance meets target — 2 points

**Status:** Needs Review

**Details:** The required PageSpeed result was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Run a complete desktop PageSpeed or Lighthouse performance audit against the exact public URL. When authentication, WAF rules, consent interstitials, bot challenges, server errors, or unavailable assets prevent a valid result, correct the access or rendering condition and rerun the analyzer before assigning a confirmed status.

### Browser best practices meet target — 2 points

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so browser best practices meet target requires review.

**Recommendation:** Run complete mobile and desktop browser best-practice audits and inspect console, security, image-delivery, API, and dependency findings. When either result is blocked or incomplete because of access restrictions, persistent overlays, resource failures, or rendering errors, correct the underlying condition and rerun both audits.

### Desktop accessibility meets target — 1 point

**Status:** Needs Review

**Details:** The required PageSpeed result was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Run a current desktop accessibility audit and manually inspect keyboard focus, navigation, form labels, link names, dialogs, and interactive controls. When authentication, a bot challenge, persistent overlay, blocked resource, or rendering failure prevents complete inspection, correct the access condition and rerun the analyzer.

### Homepage uses HTTPS — 1 point

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Open the homepage and priority public URLs and inspect the certificate, browser security state, redirect chain, hostname coverage, and mixed-content warnings. When the final destination is unavailable, blocked, or inconsistently redirected, correct the access path and rerun the scan before confirming whether HTTPS is properly implemented.

### Critical scanned pages load successfully — 1 point

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so critical scanned pages load successfully requires review.

**Recommendation:** Open every critical URL recorded by the scan and capture its final response status, redirect chain, and rendered destination. When the crawler could not complete the request because of timeouts, access restrictions, bot challenges, or server instability, correct the condition and rerun the crawl before confirming failure.

### Search-engine access is available — 1 point

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so search-engine access is available requires review.

**Recommendation:** Inspect robots.txt, X-Robots-Tag response headers, authentication, server status, and final routing for the homepage and priority pages. When the crawler cannot retrieve complete technical evidence because of access restrictions, redirects, bot protection, or response failures, correct the condition and rerun the scan.

### Canonical URL is valid — 1 point

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so canonical url is valid requires review.

**Recommendation:** Inspect the initial source and rendered document head for a valid canonical URL, then compare it with the final response URL, protocol, hostname, and page identity. When source and rendered values conflict or the page cannot be fully retrieved, correct the output and rerun the scan.

### Author or site structured data is valid — 1 point

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so author or site structured data is valid requires review.

**Recommendation:** Inspect the rendered page source for parsable Person or Organization JSON-LD and compare its name, URL, and profiles with the visible author brand. When markup is malformed, inserted only after unsupported interaction, duplicated, conflicting, or unavailable because rendering failed, correct and validate it before rescanning.

## 7. Author Trust — 10 points

### Author bio is present — 2 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Open the public About page or biography section and confirm that substantive author information appears as readable HTML. When the biography is hidden behind a tab, image, login, blocked page, or client-side failure, expose a default accessible version and rerun the scan after the page loads completely.

### Author photo is present — 2 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Confirm that a recognizable author portrait is visible near biography or identity content and represented by an accessible image element. When the image is lazy-loaded only after interaction, used as an inaccessible background, ambiguously classified, or unavailable because rendering failed, correct the component and rerun the scan.

### Contact path is present — 2 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Follow the Contact link, confirm that the destination returns a successful public page, and manually test the form or email path. When broken routes, embedded-form restrictions, bot challenges, authentication, or script failures prevent inspection, correct the access condition and rerun the scan before confirming the result.

### Social profile links are present — 1 point

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Open each visible social control and confirm that it is a standard link leading to an active official author profile rather than a share action or generic platform homepage. When icon-only controls lack accessible names, redirects are blocked, or destinations cannot be verified, correct the links and rescan.

### Media kit is present — 1 point

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Open the likely media or press destination and confirm that biographies, book information, downloadable images, and contact details are publicly accessible. When the page is unlinked, blocked, protected, or dependent on inaccessible cloud files, correct the permissions and navigation path and rerun the scan.

### Privacy policy is present — 1 point

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Open the privacy-policy link from the footer and relevant forms and confirm that it returns a successful public page with substantive content. When the destination is broken, protected, empty, script-only, or unavailable to the scanner, correct the route or access settings and rerun the scan.

### Trust proof is present — 1 point

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Inspect visible awards, media mentions, credentials, endorsements, and professional claims and confirm that they relate to the author and include credible attribution. When proof is supplied through a blocked widget, hidden component, ambiguous statement, or inaccessible source, add a readable supported version and rerun the scan.

## 8. Site Usability — 5 points

### Primary navigation works across viewports — 1 point

**Status:** Needs Review

**Details:** The required rendered-page or viewport evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.

**Recommendation:** Operate the primary navigation at desktop, tablet, and mobile widths using both pointer and keyboard input. When missing controls, hidden links, focus traps, overlays, viewport-specific rendering failures, or blocked scripts prevent complete testing, correct those conditions and rerun the usability scan.

### Priority reader paths are easy to reach — 1 point

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so priority reader paths are easy to reach requires review.

**Recommendation:** Follow the homepage’s main reader journeys and determine whether Books, About, newsletter, Contact, and featured purchase destinations can be reached within one or two clear actions. When pages were not crawled or navigation depends on blocked interactions, correct the access condition and rerun the usability test.

### Calls to action are clear and descriptive — 1 point

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so calls to action are clear and descriptive requires review.

**Recommendation:** Inspect prominent homepage buttons and links and confirm that each label clearly communicates the resulting action or destination. When controls rely on icons, surrounding images, hidden context, script-generated labels, or inaccessible components, add descriptive visible and accessible text and rerun the scan.

### Forms and interactive controls are usable — 1 point

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so forms and interactive controls are usable requires review.

**Recommendation:** Operate the website’s visible forms, menus, dialogs, accordions, sliders, and primary action controls to confirm that they can be understood and used. When blocked scripts, overlays, third-party embeds, rendering errors, or incomplete interaction testing prevent verification, correct those conditions and rerun the usability scan.

### Content is not blocked or visually broken — 1 point

**Status:** Needs Review

**Details:** The available evidence was incomplete or inconclusive, so content is not blocked or visually broken requires review.

**Recommendation:** Inspect the rendered homepage at representative desktop and mobile widths and confirm that key content is not hidden by overlays, broken assets, collapsed components, or layout failures. When incomplete rendering or blocked resources prevent reliable inspection, correct the page condition and rerun the visual usability scan.
