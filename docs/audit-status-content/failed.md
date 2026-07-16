# Failed Status Content — Author Website Analyzer

Use this content only when the analyzer collected sufficient reliable evidence and confirmed that the check did not meet its requirement.

> **Status routing rule:** If the scanner could not collect enough evidence to confirm the result, assign **Needs Review** instead of **Failed**. Do not use phrases such as “could not confirm” inside a Failed result.

Each check contains exactly one **Details** statement and one technical **Recommendation**.

## 1. Brand Clarity — 15 points

### Author name is clear — 4 points

**Status:** Failed

**Details:** The scan did not find a clear author name in the page title, main heading, or structured data.


**Recommendation:** Add the published author name as selectable text in the homepage H1 or hero and include the same canonical name in the `<title>` and Person schema. Keep spelling and pen-name formatting consistent, and verify that the name remains visible in the mobile header or initial viewport.

### Writing category is clear — 3 points

**Status:** Failed

**Details:** The scan did not find clear genre, topic, or writing category language.


**Recommendation:** Add a plain-language genre or writing-category phrase near the author name or homepage introduction, such as “historical romance author.” Use the same primary category consistently in relevant headings and metadata without keyword stuffing.

### Homepage headline gives brand clarity — 4 points

**Status:** Failed

**Details:** The homepage did not provide a clear headline that quickly orients readers.


**Recommendation:** Replace vague or competing hero slogans with one primary H1 that identifies the author, the type of books, or a specific reader promise. Render it as visible HTML text above the fold and keep secondary promotional messages at lower heading levels.

### About path is present — 3 points

**Status:** Failed

**Details:** The scan did not find an About page, author bio path, or clear About section.


**Recommendation:** Create a public About page with a concise biography and link to it using standard anchors from the primary navigation, homepage, and footer. Ensure the URL returns a direct successful HTML response and is not blocked from crawling.

### Homepage has useful introductory content — 1 point

**Status:** Failed

**Details:** The homepage scan found limited readable content to explain the author brand.


**Recommendation:** Add a concise homepage introduction in readable HTML that explains who the author is, what they write, who the books are for, and the next useful reader step. Place it in the default page content rather than relying on an image, carousel, or popup.

## 2. Book Visibility — 20 points

### Book cover is visible — 4 points

**Status:** Failed

**Details:** The scan did not find an image that looked like a book cover.


**Recommendation:** Display a current priority-book cover as a responsive `<img>` with correct intrinsic dimensions, `srcset` or equivalent responsive delivery, and descriptive alt text. Link it to the matching book page and verify that it is sharp, uncropped, and legible on mobile.

### Book title is visible — 3 points

**Status:** Failed

**Details:** The scan did not find a clear book title in headings or book structured data.


**Recommendation:** Add the complete book title as real text in a semantic heading beside or below the cover. Keep the title, description, and purchase controls grouped in the same book component across desktop and mobile layouts.

### Book description is present — 4 points

**Status:** Failed

**Details:** The scan did not find a book description, blurb, synopsis, or similar book copy.


**Recommendation:** Add a concise hook or two-to-three-sentence synopsis as visible HTML near each featured book. Explain the central conflict, promise, or reader appeal and position the copy before the primary purchase control.

### Book purchase links are present — 4 points

**Status:** Failed

**Details:** The scan did not find clear buy, order, preorder, or purchase links.


**Recommendation:** Add a clearly labeled purchase link or button for each featured book using a valid final URL for the correct edition and format. Test desktop and mobile activation, redirect behavior, regional storefront routing, and accessible link naming.

### Multiple retailer options are present — 2 points

**Status:** Failed

**Details:** The scan did not find links to more than one common book retailer.


**Recommendation:** Add direct links to every retailer where the same edition is genuinely available and group them beneath the correct book. Do not create unavailable destinations; when a title is intentionally exclusive, document that state or adjust the audit rule rather than presenting false choices.

### Reader proof is present — 2 points

**Status:** Failed

**Details:** The scan did not find reviews, praise, endorsements, awards, or reader proof.


**Recommendation:** Add two or three credible review excerpts, endorsements, ratings, or awards near the relevant book and identify each source clearly. Use exact supported wording, link to evidence where appropriate, and avoid unattributed or unverifiable claims.

### Featured book section is present — 1 point

**Status:** Failed

**Details:** The scan did not find a clear featured book, latest release, or available-now section.


**Recommendation:** Create one prominent featured-book section containing the cover, text title, concise hook, and primary purchase path. Render the complete section in the default homepage content and update it when the current release or campaign priority changes.

## 3. Reader Engagement — 15 points

### Newsletter signup is present — 5 points

**Status:** Failed

**Details:** The scan did not find a newsletter, subscribe form, or email signup field.


**Recommendation:** Add an accessible email signup form connected to the intended mailing-list audience and request only necessary subscriber data. Configure validation, consent text, success messaging, confirmation or double opt-in, and automation delivery, then test the full subscriber flow.

### Newsletter is visible on the homepage — 3 points

**Status:** Failed

**Details:** The scan did not find the newsletter signup on the homepage.


**Recommendation:** Place a persistent newsletter form or clearly labeled subscription link in the homepage content, with an additional compact opportunity near the footer if appropriate. Do not rely solely on a timed popup, and verify that the form is usable on mobile.

### Reader magnet is present — 4 points

**Status:** Failed

**Details:** The scan did not find a reader magnet such as a free chapter, bonus scene, free book, or sample download.


**Recommendation:** Create a relevant reader magnet such as a sample chapter, bonus scene, short story, or reading guide and describe exactly what subscribers receive. Connect the form to an automated delivery email or secure download, then test permissions, expiry, and delivery.

### Subscriber benefit is clear — 3 points

**Status:** Failed

**Details:** The scan did not find clear wording that explains why readers should subscribe.


**Recommendation:** Add one specific sentence beside the signup control explaining the newsletter content, immediate incentive, and realistic frequency where useful. Keep this copy visible outside placeholders so readers and assistive technology can understand the value before submitting.

## 4. Search Visibility — 18 points

### Title tag is present — 2 points

**Status:** Failed

**Details:** The scan did not find a page title tag, which helps browsers and search engines understand the page.


**Recommendation:** Generate one unique homepage `<title>` in the rendered document head, beginning with the published author name and adding concise genre or role context. Configure the CMS or framework so the title is present in the initial response and not overwritten by duplicate templates.

### Title supports the author brand — 3 points

**Status:** Failed

**Details:** The homepage title did not clearly include the author name, author role, books, or writing category.


**Recommendation:** Rewrite the homepage title to clearly identify the published author and primary genre or author role, for example `Author Name | Historical Romance Author`. Put the identifying terms near the beginning and remove slogans that do not explain the site.

### Meta description is present — 3 points

**Status:** Failed

**Details:** The scan did not find a meta description for the scanned pages.


**Recommendation:** Add one distinct `<meta name="description">` to the homepage head that summarizes the author, books or genre, and a useful reader action. Render it consistently through the CMS or application metadata layer and avoid duplicate or empty description tags.

### Page has one main heading — 2 points

**Status:** Failed

**Details:** The scan either did not find an H1 or found multiple H1 headings on a page.


**Recommendation:** Set one page-specific H1 for the homepage's primary topic and change decorative, logo, or repeated H1 elements to appropriate lower levels or non-heading markup. Verify the final rendered hierarchy so H2–H6 sections follow a logical structure.

### Main heading gives author clarity — 3 points

**Status:** Failed

**Details:** The main heading did not clearly connect the page to the author, books, or genre.


**Recommendation:** Rewrite the homepage H1 so a new visitor can identify the author, genre, books, or reader promise without relying on surrounding images. Keep it concise, specific, and rendered as semantic text rather than artwork or pseudo-content.

### Page appears indexable — 3 points

**Status:** Failed

**Details:** The scan found a noindex or similar signal that may keep the page out of search results.


**Recommendation:** Remove unintended `noindex` directives, X-Robots-Tag restrictions, robots.txt blocks, authentication, or environment settings from important public pages. Verify the deployed canonical URL with a search-engine inspection tool and request indexing after the fix.

### Useful internal links are present — 2 points

**Status:** Failed

**Details:** The scan did not find enough internal links to key author website pages.


**Recommendation:** Add descriptive internal anchors from the main navigation and relevant homepage sections to Books, About, Contact, newsletter, and other priority reader pages. Link directly to final canonical URLs and eliminate broken links or avoidable redirect chains.

## 5. Mobile Performance — 10 points

### Mobile performance meets target — 4 points

**Status:** Failed

**Details:** PageSpeed measured a mobile performance score below the target of 70.


**Recommendation:** Improve the mobile score to at least the configured target by resizing and compressing images, serving modern formats, reducing render-blocking CSS and JavaScript, deferring nonessential third-party code, and enabling effective caching. Use the individual PageSpeed diagnostics to prioritize the largest LCP, INP, CLS, and transfer-size contributors, then retest.

### Mobile accessibility meets target — 1 point

**Status:** Failed

**Details:** PageSpeed measured a mobile accessibility score below the target of 90.


**Recommendation:** Resolve the failed mobile accessibility audits, prioritizing low contrast, missing accessible names, unlabeled form fields, incorrect alternative text, focus problems, and undersized or overlapping targets. Rerun Lighthouse and manually test keyboard and screen-reader behavior because the score alone does not confirm accessibility.

### Mobile text meets baseline contrast — 1 point

**Status:** Failed

**Details:** The rendered mobile homepage contains measured text that falls below the baseline contrast threshold.


**Recommendation:** Adjust text, overlay, and background colors until each flagged mobile element meets the applicable WCAG contrast ratio in its normal and interactive states. Test the actual rendered combinations at mobile breakpoints, including text over images, transparent layers, links, and buttons.

### Mobile search audit meets target — 1 point

**Status:** Failed

**Details:** PageSpeed measured a mobile search audit score below the target of 90.


**Recommendation:** Open the failed Lighthouse SEO audits and correct each reported crawlability, metadata, status-code, or link issue. Confirm that the public URL returns complete rendered metadata and crawlable anchors, then rerun the mobile audit.

### Images include alt text — 1 point

**Status:** Failed

**Details:** The scan found images without alt text.


**Recommendation:** Add an `alt` attribute to every meaningful `<img>`, describing the image's purpose or content; identify covers by title and portraits by author name when that information is not already adjacent. Use `alt=""` for decorative images so screen readers can ignore them.

### Homepage loads with a main heading — 1 point

**Status:** Failed

**Details:** The homepage loaded, but the scan did not find a visible, readable main heading in the initial page content.


**Recommendation:** Ensure the homepage returns a successful public response and includes one visible text H1 in the initial rendered DOM. Remove persistent overlays or rendering errors that hide the heading, and verify the result in a signed-out mobile browser before rescanning.

### Mobile page fits the viewport — 1 point

**Status:** Failed

**Details:** The rendered mobile homepage contains page-level horizontal overflow that can cause sideways scrolling or clipped content.


**Recommendation:** Identify the element increasing the document width—commonly a fixed-width image, slider, form, iframe, table, transform, or absolutely positioned control—and replace rigid sizing with responsive constraints or wrapping. Confirm that `document.documentElement.scrollWidth` no longer exceeds the viewport at common phone widths.

## 6. Technical Health — 10 points

### Desktop performance meets target — 2 points

**Status:** Failed

**Details:** PageSpeed measured a desktop performance score below the target of 70.


**Recommendation:** Improve the desktop score to at least the configured target by serving appropriately sized modern images, removing unused CSS and JavaScript, reducing main-thread work, and configuring server, browser, or CDN caching. Use PageSpeed diagnostics to address the largest LCP, INP, CLS, and transfer-size contributors, then retest.

### Mobile best practices meet target — 2 points

**Status:** Failed

**Details:** PageSpeed measured a mobile best-practices score below the target of 90.


**Recommendation:** Resolve every failed mobile best-practices audit, including console errors, insecure resource requests, deprecated APIs, image-delivery problems, and outdated libraries or embeds. Test the deployed page in the browser console and rerun Lighthouse after the fixes.

### Desktop best practices meet target — 1 point

**Status:** Failed

**Details:** PageSpeed measured a desktop best-practices score below the target of 90.


**Recommendation:** Correct all failed desktop best-practices findings, prioritizing console errors, mixed content, deprecated APIs, unsafe browser behavior, and outdated third-party integrations. Deploy the fixes and verify the exact public URL with a fresh Lighthouse audit.

### Desktop accessibility meets target — 1 point

**Status:** Failed

**Details:** PageSpeed measured a desktop accessibility score below the target of 90.


**Recommendation:** Fix the highest-impact desktop accessibility findings, including contrast, form labels, accessible names, heading order, focus visibility, and keyboard operation. Rerun automated checks and complete a manual keyboard pass to confirm that interactive content remains usable.

### Homepage uses HTTPS — 1 point

**Status:** Failed

**Details:** The scanned homepage did not use a secure HTTPS address.


**Recommendation:** Install or renew a valid TLS certificate for every public hostname, configure permanent HTTP-to-HTTPS redirects, and update internal links and assets to secure URLs. Check the browser console for mixed content and verify the certificate chain and hostname coverage.

### Scanned pages load successfully — 1 point

**Status:** Failed

**Details:** The scan confirmed that at least one inspected URL returned a non-success response or an avoidable redirect chain.


**Recommendation:** Repair every inspected URL returning a 4xx or 5xx response and replace unnecessary redirect chains with direct links to the final page. Restore required content or configure appropriate permanent redirects, then run a fresh crawl to confirm successful responses.

### Search engine access is available — 1 point

**Status:** Failed

**Details:** The scan found a robots rule, response directive, or page-level noindex signal that blocks important public content from search engines.


**Recommendation:** Remove confirmed robots.txt blocks, meta robots directives, X-Robots-Tag headers, authentication, or environment restrictions from public pages intended for search. Verify the live URL with a search-engine inspection tool and confirm that the canonical destination is crawlable.

### Canonical or structured data is present — 1 point

**Status:** Failed

**Details:** The scan did not find a canonical URL or basic author/site structured data.


**Recommendation:** Add a self-referencing canonical link to each important indexable page and publish valid Person or Organization JSON-LD with a consistent author name, URL, and official profiles. Validate the live rendered markup and remove duplicate, malformed, or conflicting identity data.

## 7. Author Trust — 10 points

### Author bio is present — 2 points

**Status:** Failed

**Details:** The scan did not find a clear author bio or biography page.


**Recommendation:** Publish a substantive author biography as readable HTML on a public About page and add a concise homepage summary. Include genre, notable work, and relevant credentials, and keep the text current for readers, press, and event organizers.

### Author photo is present — 2 points

**Status:** Failed

**Details:** The scan did not find an author photo, portrait, or headshot signal.


**Recommendation:** Add a current high-resolution author portrait to the About page or homepage trust section using a responsive image element. Supply appropriate dimensions, compression, and alt text identifying the author, and verify the crop at desktop and mobile widths.

### Contact path is present — 2 points

**Status:** Failed

**Details:** The scan did not find a contact form or contact email.


**Recommendation:** Create a clearly labeled Contact page with a working accessible form or purpose-specific email address. Configure validation, spam protection, success messaging, and inbox delivery, then submit a test message to verify the complete path.

### Social profile links are present — 1 point

**Status:** Failed

**Details:** The scan did not find links to author social profiles.


**Recommendation:** Add standard links to the author's active official social profiles in a consistent header, footer, or contact area. Give icon-only links accessible names, use final profile URLs, and remove abandoned or unrelated accounts.

### Media kit is present — 1 point

**Status:** Failed

**Details:** The scan did not find a media kit, press kit, or press page.


**Recommendation:** Create a public media page containing approved short and long biographies, high-resolution headshots, cover files, book information, usage notes, and press contact details. Use stable downloadable URLs with correct permissions and link the page from About or Contact.

### Privacy policy is present — 1 point

**Status:** Failed

**Details:** The scan did not find a visible privacy-policy link.


**Recommendation:** Publish a privacy policy that accurately reflects the site's forms, newsletter provider, analytics, cookies, embeds, data uses, retention, and user choices. Link it persistently from the footer and near relevant data-collection forms, and have the wording reviewed for the jurisdictions served.

### Trust proof is present — 1 point

**Status:** Failed

**Details:** The scan did not find reviews, praise, ratings, or similar trust proof.


**Recommendation:** Add credible, attributable reviews, awards, ratings, endorsements, or reader testimonials near the author bio or featured book. Include enough source context to support each claim and link to evidence when useful.

## 8. Site Usability — 5 points

### Primary navigation works across viewports — 1 point

**Status:** Failed

**Details:** The rendered homepage did not provide usable primary navigation in every tested viewport.


**Recommendation:** Implement a semantic primary navigation with a visible desktop menu and an accessible mobile menu button that communicates its expanded state. Ensure Books, About, Newsletter, and Contact remain reachable by keyboard and pointer at desktop, tablet, and mobile widths.

### Scanned pages load successfully — 1 point

**Status:** Failed

**Details:** At least one scanned page did not return a successful response.


**Recommendation:** Repair each unsuccessful reader-facing URL and update menus, homepage calls to action, and content links to point directly to working final destinations. Remove avoidable redirect chains and verify the full reader path with a fresh crawl.

### Privacy policy is present — 1 point

**Status:** Failed

**Details:** The scan did not find a privacy-policy link, creating a maintenance and trust concern for forms and newsletter collection.


**Recommendation:** Publish or update a privacy policy that matches the site's current forms, analytics, cookies, embeds, and email tools, then add a persistent footer link and appropriate form disclosures. Confirm that the policy URL is public, stable, and returns a successful response.

### Canonical or structured data is present — 1 point

**Status:** Failed

**Details:** The scan did not find a canonical URL or basic site/author structured data.


**Recommendation:** Add self-referencing canonical tags and accurate Person or Organization structured data to the homepage and other important public pages. Keep protocol, hostname, URL, author name, and official-profile references consistent, then validate the live markup.

### Site content appears current — 1 point

**Status:** Failed

**Details:** The scan found a footer copyright year that appears several years out of date.


**Recommendation:** Update stale copyright, book-availability, event, biography, contact, and external-link information based on the actual content state. Add a scheduled editorial review process; an automatically changing footer year should not substitute for reviewing substantive content.
