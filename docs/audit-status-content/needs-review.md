# Needs Review Status Content — Author Website Analyzer

Use this content when the analyzer does not have enough reliable evidence to determine whether a check passes or fails.

> **Status routing rule:** **Needs Review** is an evidence status, not a confirmed website problem. Do not deduct the check as a confirmed failure until manual verification or a successful rescan establishes the result.

Each check contains exactly one **Details** statement and one technical **Recommendation**.

## 1. Brand Clarity — 15 points

### Author name is clear — 4 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Inspect the rendered homepage, document `<title>`, primary H1, header text, and Person schema to confirm that the published author name is exposed as text. If the name appears only inside an image, slider, or interaction-dependent component, add an accessible text equivalent or make that component available to the scanner before rescanning.

### Writing category is clear — 3 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Review the visible homepage introduction and headings for a plain-language genre or writing-category phrase. If the wording is loaded only after interaction or embedded in artwork, expose it as rendered HTML text and rerun the scan.

### Homepage headline gives brand clarity — 4 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Open the homepage in a signed-out browser and verify that one prominent headline identifies the author, books, genre, or reader promise. Confirm that the headline exists in the rendered DOM and is not hidden behind a carousel, popup, or consent layer before rescanning.

### About path is present — 3 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Follow the About path from the homepage and primary navigation, confirm that the destination returns a direct successful HTML response, and verify that the biography is visible without login. If the page is unlinked, redirected excessively, or blocked from crawling, correct that access path and rerun the scan.

### Homepage has useful introductory content — 1 point

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Inspect the initial rendered homepage for a readable introduction that explains the author or books. If the only context is inside images, sliders, or content injected after user interaction, add a short HTML introduction that the scanner and assistive technology can read.

## 2. Book Visibility — 20 points

### Book cover is visible — 4 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Verify that a current cover is rendered as a visible image at the inspected viewport and is not deferred until a carousel click or popup opens. Prefer an `<img>` with a valid `src` or `srcset`, intrinsic dimensions, and descriptive alt text, then rescan the public page.

### Book title is visible — 3 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Confirm that each featured book has its full title in visible HTML text near the cover. If the title exists only inside cover artwork or appears after interaction, add a semantic text heading and rerun the scan.

### Book description is present — 4 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Check the public page for a visible hook, blurb, or synopsis associated with at least one featured book. Place the description in rendered HTML rather than an image, inaccessible accordion, or script-dependent fragment, then rescan.

### Book purchase links are present — 4 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Test every visible purchase control and confirm that it is a standard link or accessible button leading to the intended book or retailer page. Replace JavaScript-only click handlers or blocked redirectors with crawlable final URLs where possible, then rerun the scan.

### Multiple retailer options are present — 2 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Verify that at least two currently valid retailer destinations are shown for the same featured book when the edition is distributed to multiple stores. Use direct, crawlable links and ensure regional or affiliate routing does not block the scanner before rescanning.

### Reader proof is present — 2 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Inspect visible review excerpts, endorsements, ratings, and awards and confirm that each includes a recognizable attribution. If proof is injected through a third-party widget or hidden carousel, add a readable HTML version or ensure the widget renders for the scanner.

### Featured book section is present — 1 point

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Confirm that one current book is intentionally presented with its cover, text title, hook, and purchase path in the public page content. If these elements are split across sliders, tabs, or interaction-dependent components, expose a complete default view and rerun the scan.

## 3. Reader Engagement — 15 points

### Newsletter signup is present — 5 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Submit the newsletter form manually with a test address and verify validation, consent, confirmation, and list delivery. Ensure the form or subscription link is available in the public rendered page and not blocked by an inaccessible iframe, popup trigger, or bot challenge.

### Newsletter is visible on the homepage — 3 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Open the homepage at desktop and mobile widths and confirm that a newsletter form or clearly labeled subscription link is visible without navigating elsewhere. If it appears only after a popup delay or interaction, add a persistent inline signup path and rescan.

### Reader magnet is present — 4 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Verify that the page clearly offers a reader incentive and explains what is delivered after signup. Make the offer and delivery path available as readable page content rather than relying only on a popup, image, or email-platform script that the scanner cannot render.

### Subscriber benefit is clear — 3 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Read the copy immediately surrounding the signup control and confirm that it states what subscribers receive and, where appropriate, how often. If the benefit is supplied only through placeholder text, an image, or delayed script, add persistent HTML copy and rerun the scan.

## 4. Search Visibility — 18 points

### Title tag is present — 2 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Inspect the final rendered document head or browser tab and confirm that the homepage contains one meaningful `<title>` element. If metadata is added only client-side or omitted from the initial response, configure the framework or SEO system to render it consistently and rescan.

### Title supports the author brand — 3 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Confirm that the homepage title begins with or clearly includes the published author name and useful author or genre context. Review the final rendered `<title>` rather than only the CMS field, because plugins or templates may overwrite it.

### Meta description is present — 3 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Inspect the homepage source and rendered head for one distinct non-empty `<meta name="description">`. If it is missing from the server response, duplicated, or overwritten client-side, correct the metadata template and rerun the scan.

### Page has one main heading — 2 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Inspect the rendered heading structure and confirm that the page has exactly one primary H1. If the H1 is missing, duplicated by the theme, or inserted only after interaction, correct the template or page-builder hierarchy and rescan.

### Main heading gives author clarity — 3 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Read the visible H1 without relying on images or nearby copy and confirm that it identifies the author, books, genre, or reader promise. If the scanner cannot see it because it is rendered as artwork, pseudo-content, or delayed JavaScript, replace or supplement it with semantic HTML text.

### Page appears indexable — 3 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Check robots.txt, page-level meta robots, X-Robots-Tag response headers, authentication, and canonical routing for the inspected URL. Remove accidental access barriers or expose the final public URL to the crawler, then verify it with a search-engine inspection tool and rerun the scan.

### Useful internal links are present — 2 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Follow the homepage's important links and inspect the rendered HTML for standard anchors to Books, About, Contact, newsletter, and other priority pages. Replace script-only navigation or blocked redirect links with crawlable final URLs before rescanning.

## 5. Mobile Performance — 10 points

### Mobile performance meets target — 4 points

**Status:** Needs Review

**Details:** The required PageSpeed result was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Run PageSpeed Insights directly against the same public homepage URL and record whether a mobile result is returned. If the audit is blocked, remove authentication or challenge pages for legitimate testing, adjust WAF or consent behavior, and retry before rerunning the analyzer.

### Mobile accessibility meets target — 1 point

**Status:** Needs Review

**Details:** The required PageSpeed result was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Run a current mobile Lighthouse or PageSpeed accessibility audit and review the individual findings, not only the score. Ensure the public page can load without authentication, bot challenges, or an overlay that prevents Lighthouse from reaching the content.

### Mobile text meets baseline contrast — 1 point

**Status:** Needs Review

**Details:** The required rendered-page or viewport evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Measure representative mobile text, links, and controls against their actual rendered backgrounds with a contrast-testing tool. If the required viewport cannot render cleanly because of overlays, animation, or blocked assets, correct those rendering conditions and rescan.

### Mobile search audit meets target — 1 point

**Status:** Needs Review

**Details:** The required PageSpeed result was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Run the mobile Lighthouse SEO audit on the exact public URL and inspect crawlability, metadata, status-code, and link findings. Resolve any access or rendering condition that prevents PageSpeed from returning a complete result, then rerun the analyzer.

### Images include alt text — 1 point

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Inspect meaningful images in the rendered DOM and verify that each has an appropriate `alt` attribute while decorative images use `alt=""`. If images are supplied as CSS backgrounds or generated by a widget, add accessible equivalents or configure the component to expose alternative text.

### Homepage loads with a main heading — 1 point

**Status:** Needs Review

**Details:** The required rendered-page or viewport evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Load the homepage in a signed-out mobile browser and confirm that it returns successfully with one visible text H1 in the initial rendered content. Remove or reconfigure login gates, persistent overlays, or client-side failures that prevent the heading from being rendered, then rescan.

### Mobile page fits the viewport — 1 point

**Status:** Needs Review

**Details:** The required rendered-page or viewport evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Test the page at common phone widths and check whether the document itself scrolls horizontally or clips essential controls. If rendering evidence was incomplete, disable blocking overlays and inspect oversized fixed-width elements, transforms, tables, embeds, and sliders before rescanning.

## 6. Technical Health — 10 points

### Desktop performance meets target — 2 points

**Status:** Needs Review

**Details:** The required PageSpeed result was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Run PageSpeed Insights directly against the exact public URL in desktop mode and confirm that a complete performance result is returned. If the request is blocked by authentication, WAF rules, consent interstitials, or server errors, correct that access condition and retry the analyzer.

### Mobile best practices meet target — 2 points

**Status:** Needs Review

**Details:** The required PageSpeed result was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Run the mobile Lighthouse best-practices audit and inspect console, security, image, and browser-API findings. Ensure the page and its required resources are available to Lighthouse without a bot challenge or persistent overlay, then rerun the analyzer.

### Desktop best practices meet target — 1 point

**Status:** Needs Review

**Details:** The required PageSpeed result was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Run the desktop Lighthouse best-practices audit on the public URL and review every incomplete or failed audit. Resolve access restrictions, resource failures, or rendering errors that prevent a complete result before rescanning.

### Desktop accessibility meets target — 1 point

**Status:** Needs Review

**Details:** The required PageSpeed result was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Run a current desktop accessibility audit and manually test keyboard focus, form labels, link names, and dialog behavior. If PageSpeed cannot inspect the page, remove the authentication, challenge, or blocking layer responsible and rerun the analyzer.

### Homepage uses HTTPS — 1 point

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Open the homepage and key public URLs and inspect the certificate chain, browser security indicator, redirects, and mixed-content console warnings. Correct expired certificates, hostname mismatches, HTTP endpoints, or inaccessible final URLs before rescanning.

### Scanned pages load successfully — 1 point

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Open every URL recorded by the scan and capture its final HTTP status, redirect chain, and rendered page. Restore inaccessible pages, correct server errors, or point the scanner and internal links to the final public URL, then rerun the crawl.

### Search engine access is available — 1 point

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Inspect robots.txt, meta robots tags, X-Robots-Tag headers, authentication, and response status for the homepage and priority pages. Remove unintended crawler restrictions or provide the scanner with the correct final public URL before rescanning.

### Canonical or structured data is present — 1 point

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Inspect the rendered `<head>` for a valid canonical link and the page source for parsable Person or Organization JSON-LD. If markup is inserted only after unsupported interaction or is malformed, correct the output and validate it before rerunning the analyzer.

## 7. Author Trust — 10 points

### Author bio is present — 2 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Open the public About page or biography section and confirm that substantive author information is present as readable HTML. If the bio is hidden behind a tab, image, login, or client-side failure, expose a default accessible version and rescan.

### Author photo is present — 2 points

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Confirm that a recognizable author portrait is visible on the public homepage or About page and represented by an accessible image element with useful alt text. If the image is lazy-loaded only after interaction or rendered as an inaccessible background, correct the component and rerun the scan.

### Contact path is present — 2 points

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Follow the Contact link, confirm a direct successful page response, and test the form or email path through completion. Correct broken routes, inaccessible embedded forms, bot challenges, or script failures that prevent the scanner from reaching the contact destination.

### Social profile links are present — 1 point

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Open each visible social link and confirm that it is a standard anchor leading to the author's active official profile. Replace icon-only controls without accessible names, JavaScript-only navigation, or blocked redirectors, then rescan.

### Media kit is present — 1 point

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Open the media or press path and confirm that biographies, book information, downloadable assets, and contact details are publicly reachable. Repair broken file permissions, inaccessible cloud links, or unlinked pages before rerunning the scan.

### Privacy policy is present — 1 point

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Open the Privacy link from the footer and relevant forms and confirm that the policy returns a successful public page with current text. Fix broken routes, authentication, empty policy templates, or inaccessible embedded documents before rescanning.

### Trust proof is present — 1 point

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Inspect visible reviews, praise, awards, and ratings and confirm that each includes a credible source or enough supporting context. If proof is loaded only through a blocked widget or hidden interaction, add a readable attributed version to the page and rescan.

## 8. Site Usability — 5 points

### Primary navigation works across viewports — 1 point

**Status:** Needs Review

**Details:** The required rendered-page or viewport evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Operate the primary navigation at desktop, tablet, and mobile widths using both pointer and keyboard input. Correct missing menu controls, focus traps, hidden links, viewport-specific rendering failures, or overlays that prevent the scanner from capturing a usable menu.

### Scanned pages load successfully — 1 point

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Open each reader-facing path recorded for the usability scan and verify a direct successful response without unnecessary redirects. Repair unavailable routes or update internal links to the final public destinations before rerunning the scan.

### Privacy policy is present — 1 point

**Status:** Needs Review

**Details:** The required crawl or page-response evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Use the public footer and forms to confirm that visitors can reach the Privacy page through a standard link. Restore a missing link, correct the destination, or expose the policy without login or script-only navigation, then rescan.

### Canonical or structured data is present — 1 point

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Inspect the final rendered canonical URL and Person or Organization markup and compare their name, hostname, protocol, and page identity. Correct malformed, conflicting, or client-only markup and validate the live page before rerunning the analyzer.

### Site content appears current — 1 point

**Status:** Needs Review

**Details:** The required website content or markup evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.


**Recommendation:** Review visible dates, book availability, event listings, biography details, contact information, and external links rather than relying only on the footer year. If current content is hidden from the scanner by interaction-dependent components, expose the relevant text in the default rendered page and rescan.
