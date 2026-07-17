# Recommendations for Website Analyzer Checks

## 1. Brand Clarity — 15 points

### 1.1 Author name is clear — 4 points

**Passed**

Keep the published author name prominently visible so readers can immediately identify whose website they are visiting. Maintain the same spelling and pen-name format in the homepage header or hero, `<title>`, primary H1, and Person structured data, and recheck these identity signals after theme, branding, or SEO configuration changes.

**Failed**

Add the published author name near the top of the homepage so visitors can immediately identify the author behind the website. Present it as selectable HTML text in the header, hero, or primary H1, use the same canonical name in the `<title>` and Person schema, and verify its visibility on desktop and mobile.

**Needs Review**

Verify that the published author name appears as visible text in the homepage header, hero, primary H1, document title, or Person structured data. When the name exists only inside a logo, image, slider, or interaction-dependent component, add a readable HTML equivalent and rerun the scan after confirming the public page renders completely.

---

### 1.2 Writing category is clear — 3 points

**Passed**

Keep the author’s primary genre, subject area, or writing category visible near the homepage introduction so readers can quickly determine whether the books match their interests. Use consistent, natural terminology in relevant headings and metadata, and review the wording whenever the author’s genre focus, readership, or positioning changes.

**Failed**

Add a plain-language genre, subject, or writing-category statement near the author name or homepage introduction so readers immediately understand what the author writes. Use wording such as “historical romance author” or “writer of practical leadership books,” repeat the terminology naturally in relevant metadata, and avoid excessive or unrelated keywords.

**Needs Review**

Inspect the rendered homepage introduction, hero, and headings to confirm that a clear genre, subject, or writing-category phrase is visible to readers. When this information appears only in artwork, rotating slides, hidden tabs, or script-loaded content, expose it as persistent HTML text and rescan the public homepage.

---

### 1.3 Homepage headline gives brand clarity — 4 points

**Passed**

Preserve one dominant homepage headline that clearly communicates the author, books, genre, readership, or reader promise. Keep it as visible HTML text in the primary hero area, retain its role as the page’s main heading, and verify that promotional banners, sliders, or campaign messages do not compete with or replace it.

**Failed**

Replace vague or generic homepage messaging with one clear headline that tells visitors who the author is, what they write, or what readers can expect. Render the message as the primary visible H1 near the top of the page, keep supporting promotions at lower heading levels, and test the hierarchy across desktop and mobile.

**Needs Review**

Open the homepage in a signed-out desktop and mobile browser and confirm that one prominent headline clearly identifies the author, books, genre, audience, or reader promise. When the headline is hidden by a carousel, popup, consent layer, artwork, or delayed rendering, expose a default HTML version and rerun the scan.

---

### 1.4 About path is present — 3 points

**Passed**

Keep the author biography easy to reach through a standard About link in the primary navigation, homepage, or footer. Maintain a direct crawlable URL that returns a successful public HTML response, and recheck the destination after permalink, menu, routing, page-builder, or site-structure changes.

**Failed**

Create a public About page or substantive author-biography section so readers, media contacts, and event organizers can learn more about the author. Link to it with a descriptive HTML anchor from the primary navigation and homepage, ensure the destination returns a direct successful response, and verify that it remains accessible without login.

**Needs Review**

Follow the likely About links from the homepage, navigation, footer, and sitemap and confirm that a public biography destination loads successfully. When the page is unlinked, blocked, excessively redirected, protected by login, or unavailable to the scanner, correct the access path and rerun the crawl before assigning a confirmed result.

---

### 1.5 Homepage has useful introductory content — 1 point

**Passed**

Maintain a concise homepage introduction that explains who the author is, what they write, who the books are for, and what readers should explore next. Keep the copy as readable HTML in the default page content, and avoid moving the only useful introduction into an image, popup, carousel, or hidden interaction.

**Failed**

Add a short, reader-focused introduction to the homepage so visitors receive useful context before navigating deeper into the site. Explain the author, books, genre or subject, intended readership, and next useful action in visible HTML text, and place the content within the main page rather than an image or popup.

**Needs Review**

Inspect the initial rendered homepage for readable introductory text that explains the author or books and provides a useful next step. When the only context appears inside artwork, sliders, delayed scripts, tabs, or blocked components, add a persistent HTML introduction and rerun the scan after confirming complete rendering.

---

## 2. Book Visibility — 20 points

### 2.1 Book cover is visible — 4 points

**Passed**

Continue displaying at least one current priority-book cover in a prominent reader-facing section. Serve it as a responsive `<img>` with correct intrinsic dimensions, optimized image delivery, and descriptive alt text, associate it with the matching title or book page, and verify sharpness, crop, and legibility at common mobile widths.

**Failed**

Add a visible cover for the current priority book so readers can immediately recognize the title being promoted. Use a responsive `<img>` with valid `src` or `srcset`, intrinsic dimensions, descriptive alt text, and a link to the matching book page, then check that the artwork remains sharp, uncropped, and readable on mobile.

**Needs Review**

Verify that a current book cover appears visibly in the inspected homepage or book content and is not loaded only after a carousel click, popup, hover, or unsupported script action. Prefer an accessible `<img>` with a valid source, dimensions, and descriptive alt text, then rescan the fully rendered public page.

---

### 2.2 Book title is visible — 3 points

**Passed**

Keep every featured book title as visible HTML text near its corresponding cover, description, and purchase controls. Use a semantic heading or clearly identified title element, preserve the complete edition name where relevant, and avoid relying on the title printed inside the cover image as the only readable or machine-detectable version.

**Failed**

Add the complete book title as visible text beside or below its cover so readers and assistive technology can identify the promoted book. Use a semantic heading, group it with the matching description and purchase controls, and verify that the title remains visible and correctly associated at desktop and mobile widths.

**Needs Review**

Inspect each featured-book presentation and confirm that the full title appears as visible HTML text near the correct cover and actions. When the title exists only inside cover artwork, a hidden tab, rotating slide, or delayed component, add a semantic text heading and rerun the scan after the default view renders.

---

### 2.3 Book description is present — 4 points

**Passed**

Maintain a concise hook, blurb, or synopsis near each featured book so readers can understand its central promise before choosing an action. Keep the copy as visible HTML associated with the correct cover and title, and update it when editions, positioning, availability, or promotional priorities change.

**Failed**

Add a concise book hook or two-to-three-sentence synopsis so readers can understand the story, subject, conflict, or benefit before purchasing. Place the copy as visible HTML near the matching cover and title, position it before the primary purchase action, and confirm that it is not hidden behind an unnecessary interaction.

**Needs Review**

Review the public book presentation for visible descriptive copy associated with at least one featured title. When the hook or synopsis appears only in artwork, an inaccessible accordion, a blocked widget, or script-dependent content, expose a readable HTML version and rerun the scan after the relevant section loads completely.

---

### 2.4 Book purchase links are present — 4 points

**Passed**

Keep each purchase control clearly labeled and connected to the correct title, edition, format, or retailer destination. Test final URLs, redirects, regional storefront routing, affiliate links, direct-store actions, accessible naming, and mobile activation regularly, especially after changing retailers, editions, link-management tools, or promotional campaigns.

**Failed**

Add a clearly labeled purchase, order, or preorder action for each promoted book so readers can move directly from discovery to acquisition. Use a standard link or accessible button with a valid final destination, associate it with the correct edition and format, and test redirects, regional routing, and mobile activation before publishing.

**Needs Review**

Test every visible purchase control and confirm that it functions as a standard link or accessible button leading to the intended book or retailer destination. When the action depends on JavaScript-only handlers, blocked redirectors, third-party widgets, or inaccessible regional routing, provide a crawlable final URL and rerun the scan.

---

### 2.5 Purchase options match book availability — 2 points

**Passed**

Keep the displayed purchase options aligned with the book’s actual distribution model, whether the title is widely distributed, retailer-exclusive, or sold directly. Show only valid destinations, clearly identify exclusivity where applicable, group options beneath the correct book, and periodically verify edition, format, regional availability, and final URLs.

**Failed**

Correct the purchase options so they accurately represent where the featured book is currently available. Add missing valid retailer or direct-store destinations, remove unavailable or incorrect listings, clearly state legitimate exclusivity when relevant, and test that every link reaches the correct title, edition, format, and regional storefront.

**Needs Review**

Confirm whether the featured book is widely distributed, retailer-exclusive, or direct-only, then compare that model with the purchase options shown on the site. When availability cannot be reliably determined from the inspected pages or external destinations, verify it manually, update the links or exclusivity wording as needed, and rescan.

---

### 2.6 Reader proof is present — 2 points

**Passed**

Maintain credible book-level proof such as reviews, ratings, endorsements, awards, or praise near the relevant title. Keep every claim accurately attributed, preserve enough source context for readers to evaluate it, link to supporting evidence where useful, and update or remove statements when ratings, permissions, or source pages change.

**Failed**

Add two or three credible reviews, endorsements, ratings, awards, or praise statements near the relevant book to strengthen reader confidence. Attribute each item to a recognizable source, use exact supported wording, provide a source link where appropriate, and avoid anonymous, unverifiable, outdated, or misleading claims.

**Needs Review**

Inspect visible review excerpts, ratings, awards, and endorsements and confirm that they relate to the featured book and include recognizable attribution. When proof is supplied only through a blocked third-party widget, hidden carousel, inaccessible embed, or ambiguous copy, add a readable attributed HTML version and rerun the scan.

---

### 2.7 Featured book section is present — 1 point

**Passed**

Maintain one clearly grouped featured-book section that helps readers understand and act on the current promotional priority. Keep the cover, text title, concise hook, and primary purchase path together in the default page content, and update the complete section whenever the featured release, campaign, or availability changes.

**Failed**

Create one complete featured-book section so readers can identify, understand, and purchase the current priority title without searching across the site. Group a responsive cover, visible text title, concise description, and primary purchase action in the same homepage component, then test the full section on desktop and mobile.

**Needs Review**

Confirm that one current title is intentionally presented as a complete default section containing its cover, text title, useful description, and purchase path. When these elements are separated across tabs, sliders, popups, or interaction-dependent components, expose a complete initial presentation and rerun the fully rendered page scan.

---

## 3. Email Growth — 15 points

### 3.1 Newsletter signup is present — 5 points

**Passed**

Keep the newsletter form or signup path connected to the correct mailing-list audience and request only the information required for subscription. Regularly test field validation, consent wording, success messaging, confirmation or double opt-in, subscriber routing, and delivery automation after changing the form, website platform, or email provider.

**Failed**

Add an accessible newsletter signup path so interested readers can join the author’s owned audience. Use a visible email field or clearly labeled subscription destination, request only necessary information, configure validation, consent, success messaging, confirmation, and subscriber routing, and test the complete flow with a controlled address before launch.

**Needs Review**

Locate and manually test the newsletter form or subscription destination to confirm that it is publicly accessible and accepts an email address. When the signup is blocked by an iframe, bot challenge, popup trigger, delayed script, or inaccessible provider page, expose a persistent usable path and rerun the scan.

---

### 3.2 Newsletter is visible on the homepage — 3 points

**Passed**

Keep a visible newsletter form or descriptive subscription link in the homepage content so readers can join without first locating another page. Maintain an additional compact opportunity near the footer where appropriate, and verify that popups, redesigns, form-builder changes, and mobile layouts do not hide or replace the persistent signup path.

**Failed**

Place a visible newsletter form or clearly labeled subscription link on the homepage so interested readers can join without searching through the site. Use an inline section or persistent call to action rather than relying only on a timed popup, and verify that the control remains readable and usable on mobile.

**Needs Review**

Open the homepage at desktop and mobile widths and confirm that a newsletter form or clearly labeled signup link is visible without waiting for a popup or performing an unsupported interaction. When only a delayed or blocked subscription prompt exists, add a persistent inline path and rerun the scan.

---

### 3.3 Reader magnet is present — 4 points

**Passed**

Keep the reader-magnet offer specific, current, and directly relevant to the author’s audience. Clearly state what subscribers receive, maintain the correct delivery file or landing page, and periodically test form submission, automation triggers, confirmation messages, email delivery, download permissions, expired links, and mobile access.

**Failed**

Create a relevant reader incentive such as a sample chapter, bonus scene, short story, free book, or reading guide to strengthen the signup offer. Explain exactly what subscribers receive, connect the form to an automated delivery email or secure download, and test the complete submission and fulfillment process before promotion.

**Needs Review**

Verify that the site clearly offers a reader incentive and that the offer explains what is delivered after signup. When the magnet appears only in a popup, image, inaccessible iframe, or email-platform script the scanner cannot inspect, expose the offer as readable page content and test delivery before rescanning.

---

### 3.4 Subscriber benefit is clear — 3 points

**Passed**

Keep the newsletter value proposition immediately beside the signup control so readers understand why they should subscribe. State the content, immediate incentive, or realistic communication frequency in specific language, keep the explanation outside placeholders, and update it whenever the newsletter cadence, content mix, offer, or privacy terms change.

**Failed**

Add a specific benefit statement beside the signup control so readers know what they will receive after subscribing. Describe the newsletter content, immediate incentive, or realistic frequency in visible HTML text, avoid generic wording such as “Join my newsletter,” and ensure assistive technology can read the explanation before submission.

**Needs Review**

Read the copy immediately surrounding the newsletter form or subscription link and confirm that it clearly explains what subscribers receive. When the benefit appears only in placeholder text, an image, delayed script, popup, or blocked embed, add persistent HTML copy and rerun the scan after the form renders fully.

---

## 4. Search Visibility — 15 points

### 4.1 Title tag is present — 1 point

**Passed**

Keep one unique, meaningful homepage `<title>` in the initial document head so browsers and search engines receive a stable page identity. Review the final rendered value after SEO-plugin, framework, routing, theme, or homepage-setting changes to prevent empty titles, fallback text, duplicate elements, or client-side overwrites.

**Failed**

Add one meaningful homepage `<title>` so browsers and search engines can identify the page. Generate it in the initial rendered document head through the site’s CMS, framework, or SEO configuration, avoid duplicate or empty title elements, and verify the final result in the page source and browser tab.

**Needs Review**

Inspect both the initial page source and final rendered document head to confirm that one meaningful homepage `<title>` is present. When metadata is added only client-side, overwritten by a plugin, duplicated, or unavailable because rendering failed, correct the metadata configuration and rerun the scan.

---

### 4.2 Title supports the author brand — 2 points

**Passed**

Keep the published author name or established author brand near the beginning of the homepage title, adding concise genre or author-role context where it improves clarity. Review the final rendered title after branding, pen-name, SEO, campaign, or template changes and ensure slogans do not replace essential identity wording.

**Failed**

Rewrite the homepage title so it clearly identifies the published author or established pen name and provides useful genre, book, or author-role context. Place the identifying terms near the beginning, remove vague slogans that do not explain the site, and verify the final rendered title rather than only the CMS field.

**Needs Review**

Check the final rendered homepage title and confirm that it contains the published author name, recognized pen name, or another clear author-brand identifier. When plugins, templates, or client-side scripts overwrite the expected value, correct the metadata output and rerun the scan against the live public URL.

---

### 4.3 Meta description is present — 2 points

**Passed**

Maintain one distinct, non-empty homepage meta description that accurately summarizes the author, books or writing category, and a useful reader action. Recheck the final rendered `<head>` after SEO-plugin, campaign, featured-book, template, or routing changes to prevent stale, duplicate, conflicting, or empty description tags.

**Failed**

Add one concise homepage meta description that explains the author, books or genre, and a useful next action for readers. Generate it consistently through the CMS or application metadata layer, prevent duplicate or empty tags, and verify the final rendered source rather than relying only on an administrative preview field.

**Needs Review**

Inspect the initial source and final rendered head for one distinct, non-empty `<meta name="description">`. When the description is missing from the server response, duplicated, overwritten client-side, or unavailable because rendering failed, correct the metadata template and rerun the scan on the public homepage.

---

### 4.4 Primary heading structure is clear — 2 points

**Passed**

Preserve one clearly identifiable page-level heading for the homepage’s main topic and use lower heading levels for supporting sections. After theme, page-builder, hero, logo, or promotional changes, inspect the rendered hierarchy to ensure decorative elements do not introduce missing, duplicated, or competing primary headings.

**Failed**

Create a clear page-level heading structure so visitors and assistive technology can identify the homepage’s main topic. Add one meaningful primary H1, convert decorative or competing headings to appropriate lower levels or non-heading markup, and verify that the rendered H2–H6 hierarchy follows the content logically.

**Needs Review**

Inspect the final rendered heading hierarchy and determine whether one clear page-level H1 identifies the homepage’s primary topic. When headings are inserted only after interaction, duplicated by the theme, hidden behind overlays, or unavailable because rendering failed, correct the template or component and rerun the scan.

---

### 4.5 Main heading gives author clarity — 3 points

**Passed**

Keep the homepage’s primary heading understandable without relying on nearby images and ensure it communicates the author, books, genre, audience, or reader promise. Reevaluate the wording whenever the hero, positioning, pen name, featured release, or promotional strategy changes, and retain the heading as visible semantic HTML.

**Failed**

Rewrite the homepage’s primary heading so a new visitor can understand the author, books, genre, audience, or reader promise without relying on surrounding artwork. Keep the wording concise and specific, render it as semantic HTML text, and verify that the complete message remains visible across desktop and mobile layouts.

**Needs Review**

Read the visible primary heading independently from nearby imagery and confirm that it identifies the author, books, genre, audience, or reader promise. When the heading is artwork, pseudo-content, delayed JavaScript, or hidden by an overlay, replace or supplement it with semantic HTML and rerun the scan.

---

### 4.6 Page appears indexable — 3 points

**Passed**

Keep important public pages free from unintended page-level `noindex`, conflicting canonical signals, or other metadata that discourages indexing. After migrations, staging deployments, SEO configuration changes, or domain updates, inspect the live rendered page and verify the preferred URL with an appropriate search-engine inspection tool.

**Failed**

Remove unintended page-level indexing restrictions from important public content so search engines can consider it for results. Correct `noindex` meta directives, conflicting canonical targets, or template-level metadata errors, verify that the live preferred URL returns the intended settings, and request reinspection after deployment.

**Needs Review**

Inspect the live page’s meta robots directives, canonical destination, authentication state, and rendered metadata to determine whether the page is intended to be indexable. When headers, redirects, page access, or rendering are incomplete, correct the access condition and rerun the scan before treating the page as blocked.

---

### 4.7 Useful internal links are present — 2 points

**Passed**

Maintain descriptive, crawlable internal links from the homepage and primary navigation to Books, About, Contact, newsletter, series, and other priority reader destinations. Link directly to final canonical URLs, and run a focused crawl after permalink, navigation, content-removal, or site-structure changes to catch broken links and redirect chains.

**Failed**

Add descriptive internal links that help readers and search engines reach the website’s priority content. Connect the homepage and navigation directly to Books, About, Contact, newsletter, series, and other important destinations using standard HTML anchors, then repair broken links, remove unnecessary redirects, and verify each final URL.

**Needs Review**

Inspect the rendered homepage and navigation for standard crawlable anchors to important reader pages, then follow each destination to confirm it loads correctly. When navigation depends on JavaScript-only controls, blocked redirects, incomplete rendering, or uncrawled pages, expose direct final URLs and rerun the crawl.

---

## 5. Mobile Experience — 10 points

### 5.1 Mobile performance meets target — 4 points

**Passed**

Protect the current mobile performance result by serving responsive compressed images, limiting render-blocking resources, deferring nonessential third-party code, reducing main-thread work, and preserving effective caching. Rerun PageSpeed after adding fonts, plugins, analytics, embeds, advertising, or large media, and prioritize only diagnostics actually reported for the tested URL.

**Failed**

Improve mobile loading performance by addressing the largest diagnostics reported for the tested page, prioritizing oversized images, render-blocking CSS or JavaScript, excessive third-party code, weak caching, and heavy main-thread work. Deploy the highest-impact fixes first, then rerun PageSpeed on the same public URL and compare the measured score.

**Needs Review**

Run a current mobile PageSpeed or Lighthouse audit against the exact public homepage and confirm that a complete result is returned. When authentication, bot protection, consent interstitials, server errors, or blocked resources prevent testing, correct the access condition and rerun the analyzer before evaluating performance.

---

### 5.2 Mobile accessibility meets target — 1 point

**Passed**

Preserve accessible mobile behavior by maintaining sufficient contrast, meaningful alternative text, programmatic labels, logical focus order, visible focus states, and adequately sized controls. Repeat automated audits and manual keyboard or screen-reader checks after changing navigation, forms, dialogs, page builders, interactive widgets, or brand styling.

**Failed**

Resolve the specific mobile accessibility audits reported for the page, prioritizing missing labels, inaccessible names, low contrast, incorrect alternative text, focus problems, and undersized or overlapping controls. Rerun the automated audit after deployment and manually test key navigation, forms, and dialogs because the score alone does not confirm accessibility.

**Needs Review**

Run a complete mobile accessibility audit and manually inspect the page’s navigation, forms, controls, focus behavior, and readable content. When a login gate, bot challenge, persistent overlay, rendering error, or blocked asset prevents reliable testing, remove the obstruction and rerun the analyzer before assigning a confirmed result.

---

### 5.3 Mobile text meets baseline contrast — 1 point

**Passed**

Keep text, links, buttons, and form controls above the required contrast ratio against their actual rendered backgrounds, including image overlays and interactive states. Recalculate contrast whenever brand colors, transparency, background imagery, button styles, themes, or mobile breakpoints change, and verify representative samples in the live rendered page.

**Failed**

Adjust the foreground, background, overlay, or transparency values of each flagged mobile element until the rendered combination meets the applicable contrast requirement. Test normal, hover, focus, active, and disabled states where relevant, including text over images, and verify the corrected values at common mobile breakpoints.

**Needs Review**

Measure representative mobile text, links, buttons, and controls against their actual rendered backgrounds using a contrast-testing method. When overlays, missing assets, animation, blocked content, or incomplete viewport capture prevents reliable measurement, correct the rendering condition and rerun the scan before confirming compliance or failure.

---

### 5.4 Mobile interactive controls meet usability baseline — 1 point

**Passed**

Maintain usable mobile controls by preserving adequately sized tap targets, sufficient spacing, visible labels, operable menu buttons, and unobstructed form actions. Retest navigation, dialogs, sliders, accordions, purchase buttons, and signup forms after layout or plugin changes to ensure fixed banners, chat widgets, and overlays do not interfere.

**Failed**

Correct undersized, overlapping, hidden, or difficult-to-operate mobile controls so readers can navigate and complete important actions reliably. Increase tap-target dimensions and spacing, provide clear labels and accessible states, remove obstructing overlays, and manually test menus, forms, book links, and dialogs at common phone widths.

**Needs Review**

Operate the homepage’s mobile menu, forms, purchase controls, dialogs, and other interactive components using touch and keyboard input where applicable. When rendering errors, overlays, blocked scripts, or incomplete interaction testing prevent a reliable conclusion, correct those conditions and rerun the mobile scan.

---

### 5.5 Images include appropriate alt text — 1 point

**Passed**

Continue providing accurate `alt` attributes for meaningful images and empty `alt=""` values for decorative images. Review newly uploaded book covers, author portraits, banners, linked graphics, and promotional assets so their alternative text communicates purpose without unnecessarily duplicating nearby visible text.

**Failed**

Add an appropriate `alt` attribute to every meaningful image so screen-reader users receive equivalent information. Identify book covers by title and author portraits by name when that context is not already adjacent, use `alt=""` for decorative assets, and review CSS background images that may require a separate accessible text equivalent.

**Needs Review**

Inspect meaningful images in the rendered mobile DOM and confirm that each has useful alternative text while decorative images use `alt=""`. When images are generated by inaccessible widgets, supplied only as CSS backgrounds, lazy-loaded after interaction, or unavailable to the scanner, add accessible equivalents and rescan.

---

### 5.6 Homepage loads with a main heading — 1 point

**Passed**

Keep the public homepage returning a successful response and expose one visible, readable text H1 in the initial mobile content. Retest the page in a signed-out session after changing cookie tools, popups, client-side rendering, hero components, routing, or page builders to ensure the heading remains available without interaction.

**Failed**

Add one visible text H1 to the initial mobile homepage content so readers and assistive technology can identify the page’s main topic immediately. Correct rendering errors, hidden styles, or persistent overlays that obscure the heading, then verify the result in a signed-out mobile browser before rescanning.

**Needs Review**

Load the homepage in a signed-out mobile browser and confirm that it returns successfully with one visible, readable text H1 in the initial rendered content. When authentication, overlays, delayed scripts, or client-side failures prevent inspection, correct the rendering condition and rerun the scan.

---

### 5.7 Mobile page fits the viewport — 1 point

**Passed**

Preserve responsive sizing with fluid containers, wrapping text, scalable media, and constrained embeds so the document remains within the mobile viewport. Test common phone widths after adding sliders, tables, forms, iframes, badges, fixed-position controls, or promotional widgets, and correct any element that increases page-level width.

**Failed**

Identify and correct the element causing page-level horizontal overflow or clipped content on mobile. Replace rigid widths, oversized media, nonwrapping text, transforms, tables, embeds, or absolutely positioned controls with responsive constraints, then verify that the document width no longer exceeds the viewport at common phone sizes.

**Needs Review**

Test the rendered page at common mobile widths and determine whether the document itself scrolls horizontally or clips essential content. When overlays, missing assets, blocked scripts, or incomplete capture prevent reliable measurement, correct those conditions, inspect oversized elements, and rerun the viewport scan.

---

## 6. Technical Health — 10 points

### 6.1 Desktop performance meets target — 2 points

**Passed**

Protect the current desktop performance result by maintaining optimized image delivery, limiting unused CSS and JavaScript, reducing main-thread work, and preserving effective server, browser, and CDN caching. Rerun the desktop audit after major template, font, analytics, plugin, embed, or media changes and prioritize diagnostics returned for the tested page.

**Failed**

Improve desktop performance by addressing the largest audit findings for the exact public page, prioritizing oversized images, unused code, excessive JavaScript execution, render-blocking resources, and ineffective caching. Deploy the highest-impact corrections first, then rerun the desktop PageSpeed test and compare the resulting score and diagnostics.

**Needs Review**

Run a complete desktop PageSpeed or Lighthouse performance audit against the exact public URL. When authentication, WAF rules, consent interstitials, bot challenges, server errors, or unavailable assets prevent a valid result, correct the access or rendering condition and rerun the analyzer before assigning a confirmed status.

---

### 6.2 Browser best practices meet target — 2 points

**Passed**

Maintain secure and modern browser behavior across mobile and desktop by keeping dependencies current, removing console errors, avoiding mixed content, and using supported APIs and embeds. Review both Lighthouse result sets after changing third-party scripts, plugins, analytics, advertising, media players, or frontend libraries.

**Failed**

Resolve the browser best-practice audits reported across mobile and desktop, prioritizing console errors, insecure resource requests, deprecated APIs, unsafe browser behavior, outdated libraries, and problematic embeds. Test the deployed page in the browser console, rerun both Lighthouse modes, and confirm that the specific failed audits have cleared.

**Needs Review**

Run complete mobile and desktop browser best-practice audits and inspect console, security, image-delivery, API, and dependency findings. When either result is blocked or incomplete because of access restrictions, persistent overlays, resource failures, or rendering errors, correct the underlying condition and rerun both audits.

---

### 6.3 Desktop accessibility meets target — 1 point

**Passed**

Preserve accessible desktop behavior by maintaining semantic headings, descriptive control names, form labels, sufficient contrast, visible focus indicators, and full keyboard operation. Pair automated audits with manual keyboard checks after changes to navigation, templates, forms, dialogs, page builders, or interactive content.

**Failed**

Fix the specific desktop accessibility findings reported for the page, prioritizing heading structure, form labels, accessible names, contrast, focus visibility, and keyboard operation. Rerun the automated audit after deployment and manually complete key reader journeys to confirm that navigation, forms, dialogs, and purchase controls remain usable.

**Needs Review**

Run a current desktop accessibility audit and manually inspect keyboard focus, navigation, form labels, link names, dialogs, and interactive controls. When authentication, a bot challenge, persistent overlay, blocked resource, or rendering failure prevents complete inspection, correct the access condition and rerun the analyzer.

---

### 6.4 Homepage uses HTTPS — 1 point

**Passed**

Keep a valid TLS certificate active for every public hostname, maintain permanent HTTP-to-HTTPS redirects, and load all page assets through secure URLs. Monitor certificate renewal, redirect behavior, hostname coverage, and browser mixed-content warnings after hosting, domain, CDN, proxy, or platform changes.

**Failed**

Move the homepage and all public assets to HTTPS so readers receive a secure connection and browsers do not display trust warnings. Install or renew a valid certificate, configure permanent HTTP-to-HTTPS redirects, update insecure internal links and resources, and verify the certificate chain, hostname coverage, and mixed-content console.

**Needs Review**

Open the homepage and priority public URLs and inspect the certificate, browser security state, redirect chain, hostname coverage, and mixed-content warnings. When the final destination is unavailable, blocked, or inconsistently redirected, correct the access path and rerun the scan before confirming whether HTTPS is properly implemented.

---

### 6.5 Critical scanned pages load successfully — 1 point

**Passed**

Keep the homepage, Books, About, Contact, newsletter, and featured-book destinations returning their intended successful responses and link directly to final canonical URLs. Run a focused crawl after permalink, navigation, hosting, content-removal, or migration changes to identify new errors and avoid unnecessary redirect chains.

**Failed**

Repair each confirmed critical reader-facing URL that returns a 4xx, 5xx, incorrect destination, or avoidable redirect chain. Restore the required page or configure an appropriate permanent redirect, update internal links to the final URL, and rerun the crawl to verify the complete reader path.

**Needs Review**

Open every critical URL recorded by the scan and capture its final response status, redirect chain, and rendered destination. When the crawler could not complete the request because of timeouts, access restrictions, bot challenges, or server instability, correct the condition and rerun the crawl before confirming failure.

---

### 6.6 Search-engine access is available — 1 point

**Passed**

Preserve crawler access to important public pages by keeping robots.txt, X-Robots-Tag headers, authentication settings, and server responses aligned with the site’s indexing intent. Recheck the production environment after deployments, staging migrations, security changes, CDN updates, or SEO configuration changes.

**Failed**

Remove confirmed technical barriers that prevent search engines from accessing important public content. Correct blocking robots.txt rules, X-Robots-Tag headers, authentication gates, server restrictions, or unsuccessful responses, then verify the live preferred URL with an appropriate search-engine inspection tool after deployment.

**Needs Review**

Inspect robots.txt, X-Robots-Tag response headers, authentication, server status, and final routing for the homepage and priority pages. When the crawler cannot retrieve complete technical evidence because of access restrictions, redirects, bot protection, or response failures, correct the condition and rerun the scan.

---

### 6.7 Canonical URL is valid — 1 point

**Passed**

Keep a single self-referencing canonical URL on each important indexable page and ensure it matches the preferred protocol, hostname, path, and final public destination. Validate the rendered output after domain, permalink, routing, SEO-plugin, migration, or template changes to prevent conflicting or obsolete canonical signals.

**Failed**

Add or correct the canonical URL so the page identifies its preferred public version consistently. Use one valid `<link rel="canonical">` that matches the final HTTPS hostname and intended path, remove duplicate or conflicting canonicals, and verify the rendered head after redirects and template processing.

**Needs Review**

Inspect the initial source and rendered document head for a valid canonical URL, then compare it with the final response URL, protocol, hostname, and page identity. When source and rendered values conflict or the page cannot be fully retrieved, correct the output and rerun the scan.

---

### 6.8 Author or site structured data is valid — 1 point

**Passed**

Maintain valid Person or Organization JSON-LD with a consistent author name, preferred URL, official profiles, and relevant identity fields. Validate the live rendered markup after changing the domain, pen name, social accounts, theme, SEO plugin, or application templates, and remove malformed, duplicate, or conflicting entities.

**Failed**

Add valid Person or Organization structured data so search systems can interpret the author or site identity consistently. Publish parsable JSON-LD containing the canonical author name, preferred URL, and verified official profiles, remove conflicting entities, and validate the live rendered markup after deployment.

**Needs Review**

Inspect the rendered page source for parsable Person or Organization JSON-LD and compare its name, URL, and profiles with the visible author brand. When markup is malformed, inserted only after unsupported interaction, duplicated, conflicting, or unavailable because rendering failed, correct and validate it before rescanning.

---

## 7. Author Trust — 10 points

### 7.1 Author bio is present — 2 points

**Passed**

Keep the author biography current, specific, and available as readable HTML on a public About page, with a concise homepage summary where useful. Update publications, genre positioning, credentials, awards, representation, contact references, and biographical details whenever they change, and verify that the page remains linked and accessible.

**Failed**

Publish a substantive author biography so readers, media contacts, booksellers, and event organizers can understand the author’s background and work. Add readable HTML to a public About page, include genre, notable books, and relevant credentials, link it from the navigation or homepage, and keep the information current.

**Needs Review**

Open the public About page or biography section and confirm that substantive author information appears as readable HTML. When the biography is hidden behind a tab, image, login, blocked page, or client-side failure, expose a default accessible version and rerun the scan after the page loads completely.

---

### 7.2 Author photo is present — 2 points

**Passed**

Continue serving a current author portrait as a responsive image with appropriate dimensions, compression, crop, and focal positioning. Provide useful alt text identifying the author when the image conveys identity, associate the portrait with biography content, and review its presentation whenever the image or layout changes.

**Failed**

Add a current professional author portrait to the homepage or About page so readers can connect the name with a recognizable person. Use a responsive image with appropriate dimensions, compression, crop, and alt text, place it near the biography, and verify its quality across desktop and mobile layouts.

**Needs Review**

Confirm that a recognizable author portrait is visible near biography or identity content and represented by an accessible image element. When the image is lazy-loaded only after interaction, used as an inaccessible background, ambiguously classified, or unavailable because rendering failed, correct the component and rerun the scan.

---

### 7.3 Contact path is present — 2 points

**Passed**

Keep the Contact page linked through a direct crawlable URL and ensure its form or email destination reaches a monitored inbox. Regularly test required fields, validation, spam protection, confirmation messaging, accessibility, and basic delivery after changing the form builder, hosting, email routing, or security configuration.

**Failed**

Create a clearly labeled public Contact page so readers, press contacts, event organizers, and business partners can reach the appropriate destination. Provide an accessible form or purpose-specific email address, configure validation, spam protection, success messaging, and inbox routing, and submit a controlled test before publishing.

**Needs Review**

Follow the Contact link, confirm that the destination returns a successful public page, and manually test the form or email path. When broken routes, embedded-form restrictions, bot challenges, authentication, or script failures prevent inspection, correct the access condition and rerun the scan before confirming the result.

---

### 7.4 Social profile links are present — 1 point

**Passed**

Keep only active official social profiles and expose them as descriptive links with correct destinations and accessible names. Test each profile after username, platform, icon-library, footer, or branding changes, remove abandoned or unrelated accounts, and avoid generic platform links or share buttons that do not represent the author.

**Failed**

Add links to the author’s active official social profiles so readers can continue engaging on the platforms the author currently maintains. Use final profile URLs, provide accessible names for icon-only controls, place the links consistently in the footer, header, or Contact area, and remove inactive or unrelated accounts.

**Needs Review**

Open each visible social control and confirm that it is a standard link leading to an active official author profile rather than a share action or generic platform homepage. When icon-only controls lack accessible names, redirects are blocked, or destinations cannot be verified, correct the links and rescan.

---

### 7.5 Media kit is present — 1 point

**Passed**

Keep the media kit publicly reachable from the About or Contact area and maintain current short and long biographies, headshots, cover files, book information, usage notes, and press contact details. Verify file permissions, download behavior, file sizes, stable URLs, and content accuracy after each release or branding update.

**Failed**

Create a public media or press page so journalists, bloggers, event organizers, and booksellers can access approved author materials efficiently. Include short and long biographies, high-resolution portraits, cover files, book information, usage notes, and press contact details, then verify that every asset is downloadable through a stable public URL.

**Needs Review**

Open the likely media or press destination and confirm that biographies, book information, downloadable images, and contact details are publicly accessible. When the page is unlinked, blocked, protected, or dependent on inaccessible cloud files, correct the permissions and navigation path and rerun the scan.

---

### 7.6 Privacy policy is present — 1 point

**Passed**

Keep the privacy policy publicly accessible and aligned with the site’s actual forms, newsletter provider, analytics, cookies, embeds, and data-handling practices. Maintain a persistent footer link and appropriate form disclosures, and review the content whenever marketing, tracking, hosting, or data-collection tools change.

**Failed**

Publish a privacy policy that accurately describes the website’s forms, email provider, analytics, cookies, embeds, data uses, retention practices, and user choices. Link it persistently from the footer and near relevant data-collection forms, ensure the page loads publicly, and obtain appropriate legal review for the jurisdictions served.

**Needs Review**

Open the privacy-policy link from the footer and relevant forms and confirm that it returns a successful public page with substantive content. When the destination is broken, protected, empty, script-only, or unavailable to the scanner, correct the route or access settings and rerun the scan.

---

### 7.7 Trust proof is present — 1 point

**Passed**

Maintain credible author-level proof such as awards, media coverage, professional endorsements, notable appearances, publisher credentials, or recognized achievements. Clearly attribute each claim, retain enough context for visitors to understand its source, link to supporting evidence where useful, and remove unsupported or outdated statements.

**Failed**

Add credible author-level proof to strengthen confidence in the author’s professional identity. Present attributable awards, media coverage, publisher credentials, speaking appearances, professional endorsements, or recognized achievements near the biography, include supporting context or source links, and avoid vague, anonymous, unverifiable, or outdated claims.

**Needs Review**

Inspect visible awards, media mentions, credentials, endorsements, and professional claims and confirm that they relate to the author and include credible attribution. When proof is supplied through a blocked widget, hidden component, ambiguous statement, or inaccessible source, add a readable supported version and rerun the scan.

---

## 8. Site Usability — 5 points

### 8.1 Primary navigation works across viewports — 1 point

**Passed**

Preserve a semantic, keyboard-accessible primary navigation with a visible desktop menu and an operable mobile menu button that communicates its expanded state. Retest focus order, opening and closing behavior, escape handling, link targets, and viewport transitions after theme, menu, plugin, or layout changes.

**Failed**

Implement usable primary navigation across desktop, tablet, and mobile so readers can reliably reach important pages. Provide a semantic navigation region, visible desktop links, an accessible mobile menu button with expanded-state communication, and working Books, About, newsletter, and Contact destinations, then test with keyboard and pointer input.

**Needs Review**

Operate the primary navigation at desktop, tablet, and mobile widths using both pointer and keyboard input. When missing controls, hidden links, focus traps, overlays, viewport-specific rendering failures, or blocked scripts prevent complete testing, correct those conditions and rerun the usability scan.

---

### 8.2 Priority reader paths are easy to reach — 1 point

**Passed**

Keep Books, About, newsletter, Contact, and featured-book purchase paths reachable from the homepage within one or two clear actions. Review the complete reader journey after navigation, permalink, campaign, or layout changes, and avoid hiding priority destinations inside ambiguous menus, sliders, or deeply nested page structures.

**Failed**

Make the website’s priority reader destinations easy to reach from the homepage. Add clear links to Books, About, newsletter, Contact, and the featured purchase path within one or two actions, use descriptive labels, remove unnecessary navigation depth, and test every route on desktop and mobile.

**Needs Review**

Follow the homepage’s main reader journeys and determine whether Books, About, newsletter, Contact, and featured purchase destinations can be reached within one or two clear actions. When pages were not crawled or navigation depends on blocked interactions, correct the access condition and rerun the usability test.

---

### 8.3 Calls to action are clear and descriptive — 1 point

**Passed**

Maintain concise, descriptive calls to action that tell readers what will happen next, such as “Buy the Book,” “Read a Sample,” or “Join the Newsletter.” Keep labels consistent with their destinations, provide sufficient surrounding context, and recheck wording whenever campaigns, buttons, links, or page layouts change.

**Failed**

Replace vague or ambiguous calls to action with labels that clearly describe the next step and destination. Use wording such as “Buy the Book,” “Read a Sample,” “View All Books,” or “Join the Newsletter,” associate each label with the correct content, and verify clarity on desktop and mobile.

**Needs Review**

Inspect prominent homepage buttons and links and confirm that each label clearly communicates the resulting action or destination. When controls rely on icons, surrounding images, hidden context, script-generated labels, or inaccessible components, add descriptive visible and accessible text and rerun the scan.

---

### 8.4 Forms and interactive controls are usable — 1 point

**Passed**

Preserve usable forms and interactive controls by maintaining visible labels, accessible names, logical focus behavior, readable validation, and controls that are not clipped or overlapping. Retest newsletter forms, Contact forms, menus, dialogs, accordions, sliders, and purchase actions after plugin, layout, or script changes.

**Failed**

Correct unusable forms and interactive controls so readers can complete important actions without confusion or obstruction. Add visible labels and accessible names, repair validation and focus behavior, prevent clipping or overlap, and manually test newsletter forms, Contact forms, menus, dialogs, and purchase controls across common viewports.

**Needs Review**

Operate the website’s visible forms, menus, dialogs, accordions, sliders, and primary action controls to confirm that they can be understood and used. When blocked scripts, overlays, third-party embeds, rendering errors, or incomplete interaction testing prevent verification, correct those conditions and rerun the usability scan.

---

### 8.5 Content is not blocked or visually broken — 1 point

**Passed**

Keep priority content visible and readable without obstruction from cookie notices, popups, chat tools, promotional overlays, missing images, collapsed sections, or layout failures. Test representative desktop and mobile widths after adding third-party widgets, campaigns, consent tools, banners, or responsive components.

**Failed**

Remove or reconfigure overlays, broken components, missing assets, or layout errors that obscure important author, book, navigation, signup, or purchase content. Ensure banners and dialogs can be dismissed, repair collapsed or unreadable sections, and verify the complete page at common desktop and mobile viewport sizes.

**Needs Review**

Inspect the rendered homepage at representative desktop and mobile widths and confirm that key content is not hidden by overlays, broken assets, collapsed components, or layout failures. When incomplete rendering or blocked resources prevent reliable inspection, correct the page condition and rerun the visual usability scan.
