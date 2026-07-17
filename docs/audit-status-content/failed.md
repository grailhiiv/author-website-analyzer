# Failed Status Content — Author Website Analyzer

These are fallback Details statements and the canonical technical recommendations for each deterministic check. During a completed scan, Details are generated from the actual inspected evidence, page, observation, and threshold.

## 1. Brand Clarity — 15 points

### Author name is clear — 4 points

**Status:** Failed

**Details:** The scan did not find a clear author name in the page title, main heading, or structured data.

**Recommendation:** Add the published author name near the top of the homepage so visitors can immediately identify the author behind the website. Present it as selectable HTML text in the header, hero, or primary H1, use the same canonical name in the `<title>` and Person schema, and verify its visibility on desktop and mobile.

### Writing category is clear — 3 points

**Status:** Failed

**Details:** The scan did not find clear genre, topic, or writing category language.

**Recommendation:** Add a plain-language genre, subject, or writing-category statement near the author name or homepage introduction so readers immediately understand what the author writes. Use wording such as “historical romance author” or “writer of practical leadership books,” repeat the terminology naturally in relevant metadata, and avoid excessive or unrelated keywords.

### Homepage headline gives brand clarity — 4 points

**Status:** Failed

**Details:** The homepage did not provide a clear headline that quickly orients readers.

**Recommendation:** Replace vague or generic homepage messaging with one clear headline that tells visitors who the author is, what they write, or what readers can expect. Render the message as the primary visible H1 near the top of the page, keep supporting promotions at lower heading levels, and test the hierarchy across desktop and mobile.

### About path is present — 3 points

**Status:** Failed

**Details:** The scan did not find an About page, author bio path, or clear About section.

**Recommendation:** Create a public About page or substantive author-biography section so readers, media contacts, and event organizers can learn more about the author. Link to it with a descriptive HTML anchor from the primary navigation and homepage, ensure the destination returns a direct successful response, and verify that it remains accessible without login.

### Homepage has useful introductory content — 1 point

**Status:** Failed

**Details:** The homepage scan found limited readable content to explain the author brand.

**Recommendation:** Add a short, reader-focused introduction to the homepage so visitors receive useful context before navigating deeper into the site. Explain the author, books, genre or subject, intended readership, and next useful action in visible HTML text, and place the content within the main page rather than an image or popup.

## 2. Book Visibility — 20 points

### Book cover is visible — 4 points

**Status:** Failed

**Details:** The scan did not find an image that looked like a book cover.

**Recommendation:** Add a visible cover for the current priority book so readers can immediately recognize the title being promoted. Use a responsive `<img>` with valid `src` or `srcset`, intrinsic dimensions, descriptive alt text, and a link to the matching book page, then check that the artwork remains sharp, uncropped, and readable on mobile.

### Book title is visible — 3 points

**Status:** Failed

**Details:** The scan did not find a clear book title in headings or book structured data.

**Recommendation:** Add the complete book title as visible text beside or below its cover so readers and assistive technology can identify the promoted book. Use a semantic heading, group it with the matching description and purchase controls, and verify that the title remains visible and correctly associated at desktop and mobile widths.

### Book description is present — 4 points

**Status:** Failed

**Details:** The scan did not find a book description, blurb, synopsis, or similar book copy.

**Recommendation:** Add a concise book hook or two-to-three-sentence synopsis so readers can understand the story, subject, conflict, or benefit before purchasing. Place the copy as visible HTML near the matching cover and title, position it before the primary purchase action, and confirm that it is not hidden behind an unnecessary interaction.

### Book purchase links are present — 4 points

**Status:** Failed

**Details:** The scan did not find clear buy, order, preorder, or purchase links.

**Recommendation:** Add a clearly labeled purchase, order, or preorder action for each promoted book so readers can move directly from discovery to acquisition. Use a standard link or accessible button with a valid final destination, associate it with the correct edition and format, and test redirects, regional routing, and mobile activation before publishing.

### Purchase options match book availability — 2 points

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for purchase options match book availability.

**Recommendation:** Correct the purchase options so they accurately represent where the featured book is currently available. Add missing valid retailer or direct-store destinations, remove unavailable or incorrect listings, clearly state legitimate exclusivity when relevant, and test that every link reaches the correct title, edition, format, and regional storefront.

### Reader proof is present — 2 points

**Status:** Failed

**Details:** The scan did not find reviews, praise, endorsements, awards, or reader proof.

**Recommendation:** Add two or three credible reviews, endorsements, ratings, awards, or praise statements near the relevant book to strengthen reader confidence. Attribute each item to a recognizable source, use exact supported wording, provide a source link where appropriate, and avoid anonymous, unverifiable, outdated, or misleading claims.

### Featured book section is present — 1 point

**Status:** Failed

**Details:** The scan did not find a clear featured book, latest release, or available-now section.

**Recommendation:** Create one complete featured-book section so readers can identify, understand, and purchase the current priority title without searching across the site. Group a responsive cover, visible text title, concise description, and primary purchase action in the same homepage component, then test the full section on desktop and mobile.

## 3. Email Growth — 15 points

### Newsletter signup is present — 5 points

**Status:** Failed

**Details:** The scan did not find a newsletter, subscribe form, or email signup field.

**Recommendation:** Add an accessible newsletter signup path so interested readers can join the author’s owned audience. Use a visible email field or clearly labeled subscription destination, request only necessary information, configure validation, consent, success messaging, confirmation, and subscriber routing, and test the complete flow with a controlled address before launch.

### Newsletter is visible on the homepage — 3 points

**Status:** Failed

**Details:** The scan did not find the newsletter signup on the homepage.

**Recommendation:** Place a visible newsletter form or clearly labeled subscription link on the homepage so interested readers can join without searching through the site. Use an inline section or persistent call to action rather than relying only on a timed popup, and verify that the control remains readable and usable on mobile.

### Reader magnet is present — 4 points

**Status:** Failed

**Details:** The scan did not find a reader magnet such as a free chapter, bonus scene, free book, or sample download.

**Recommendation:** Create a relevant reader incentive such as a sample chapter, bonus scene, short story, free book, or reading guide to strengthen the signup offer. Explain exactly what subscribers receive, connect the form to an automated delivery email or secure download, and test the complete submission and fulfillment process before promotion.

### Subscriber benefit is clear — 3 points

**Status:** Failed

**Details:** The scan did not find clear wording that explains why readers should subscribe.

**Recommendation:** Add a specific benefit statement beside the signup control so readers know what they will receive after subscribing. Describe the newsletter content, immediate incentive, or realistic frequency in visible HTML text, avoid generic wording such as “Join my newsletter,” and ensure assistive technology can read the explanation before submission.

## 4. Search Visibility — 15 points

### Title tag is present — 1 point

**Status:** Failed

**Details:** The scan did not find a page title tag, which helps browsers and search engines understand the page.

**Recommendation:** Add one meaningful homepage `<title>` so browsers and search engines can identify the page. Generate it in the initial rendered document head through the site’s CMS, framework, or SEO configuration, avoid duplicate or empty title elements, and verify the final result in the page source and browser tab.

### Title supports the author brand — 2 points

**Status:** Failed

**Details:** The homepage title did not clearly include the author name, author role, books, or writing category.

**Recommendation:** Rewrite the homepage title so it clearly identifies the published author or established pen name and provides useful genre, book, or author-role context. Place the identifying terms near the beginning, remove vague slogans that do not explain the site, and verify the final rendered title rather than only the CMS field.

### Meta description is present — 2 points

**Status:** Failed

**Details:** The scan did not find a meta description for the scanned pages.

**Recommendation:** Add one concise homepage meta description that explains the author, books or genre, and a useful next action for readers. Generate it consistently through the CMS or application metadata layer, prevent duplicate or empty tags, and verify the final rendered source rather than relying only on an administrative preview field.

### Primary heading structure is clear — 2 points

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for primary heading structure is clear.

**Recommendation:** Create a clear page-level heading structure so visitors and assistive technology can identify the homepage’s main topic. Add one meaningful primary H1, convert decorative or competing headings to appropriate lower levels or non-heading markup, and verify that the rendered H2–H6 hierarchy follows the content logically.

### Main heading gives author clarity — 3 points

**Status:** Failed

**Details:** The main heading did not clearly connect the page to the author, books, or genre.

**Recommendation:** Rewrite the homepage’s primary heading so a new visitor can understand the author, books, genre, audience, or reader promise without relying on surrounding artwork. Keep the wording concise and specific, render it as semantic HTML text, and verify that the complete message remains visible across desktop and mobile layouts.

### Page appears indexable — 3 points

**Status:** Failed

**Details:** The scan found a noindex or similar signal that may keep the page out of search results.

**Recommendation:** Remove unintended page-level indexing restrictions from important public content so search engines can consider it for results. Correct `noindex` meta directives, conflicting canonical targets, or template-level metadata errors, verify that the live preferred URL returns the intended settings, and request reinspection after deployment.

### Useful internal links are present — 2 points

**Status:** Failed

**Details:** The scan did not find enough internal links to key author website pages.

**Recommendation:** Add descriptive internal links that help readers and search engines reach the website’s priority content. Connect the homepage and navigation directly to Books, About, Contact, newsletter, series, and other important destinations using standard HTML anchors, then repair broken links, remove unnecessary redirects, and verify each final URL.

## 5. Mobile Experience — 10 points

### Mobile performance meets target — 4 points

**Status:** Failed

**Details:** PageSpeed measured a mobile performance score below the target of 70.

**Recommendation:** Improve mobile loading performance by addressing the largest diagnostics reported for the tested page, prioritizing oversized images, render-blocking CSS or JavaScript, excessive third-party code, weak caching, and heavy main-thread work. Deploy the highest-impact fixes first, then rerun PageSpeed on the same public URL and compare the measured score.

### Mobile accessibility meets target — 1 point

**Status:** Failed

**Details:** PageSpeed measured a mobile accessibility score below the target of 90.

**Recommendation:** Resolve the specific mobile accessibility audits reported for the page, prioritizing missing labels, inaccessible names, low contrast, incorrect alternative text, focus problems, and undersized or overlapping controls. Rerun the automated audit after deployment and manually test key navigation, forms, and dialogs because the score alone does not confirm accessibility.

### Mobile text meets baseline contrast — 1 point

**Status:** Failed

**Details:** The rendered mobile homepage contains measured text that falls below the baseline contrast threshold.

**Recommendation:** Adjust the foreground, background, overlay, or transparency values of each flagged mobile element until the rendered combination meets the applicable contrast requirement. Test normal, hover, focus, active, and disabled states where relevant, including text over images, and verify the corrected values at common mobile breakpoints.

### Mobile interactive controls meet usability baseline — 1 point

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for mobile interactive controls meet usability baseline.

**Recommendation:** Correct undersized, overlapping, hidden, or difficult-to-operate mobile controls so readers can navigate and complete important actions reliably. Increase tap-target dimensions and spacing, provide clear labels and accessible states, remove obstructing overlays, and manually test menus, forms, book links, and dialogs at common phone widths.

### Images include appropriate alt text — 1 point

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for images include appropriate alt text.

**Recommendation:** Add an appropriate `alt` attribute to every meaningful image so screen-reader users receive equivalent information. Identify book covers by title and author portraits by name when that context is not already adjacent, use `alt=""` for decorative assets, and review CSS background images that may require a separate accessible text equivalent.

### Homepage loads with a main heading — 1 point

**Status:** Failed

**Details:** The homepage loaded, but the scan did not find a visible, readable main heading in the initial page content.

**Recommendation:** Add one visible text H1 to the initial mobile homepage content so readers and assistive technology can identify the page’s main topic immediately. Correct rendering errors, hidden styles, or persistent overlays that obscure the heading, then verify the result in a signed-out mobile browser before rescanning.

### Mobile page fits the viewport — 1 point

**Status:** Failed

**Details:** The rendered mobile homepage contains page-level horizontal overflow that can cause sideways scrolling or clipped content.

**Recommendation:** Identify and correct the element causing page-level horizontal overflow or clipped content on mobile. Replace rigid widths, oversized media, nonwrapping text, transforms, tables, embeds, or absolutely positioned controls with responsive constraints, then verify that the document width no longer exceeds the viewport at common phone sizes.

## 6. Technical Health — 10 points

### Desktop performance meets target — 2 points

**Status:** Failed

**Details:** PageSpeed measured a desktop performance score below the target of 70.

**Recommendation:** Improve desktop performance by addressing the largest audit findings for the exact public page, prioritizing oversized images, unused code, excessive JavaScript execution, render-blocking resources, and ineffective caching. Deploy the highest-impact corrections first, then rerun the desktop PageSpeed test and compare the resulting score and diagnostics.

### Browser best practices meet target — 2 points

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for browser best practices meet target.

**Recommendation:** Resolve the browser best-practice audits reported across mobile and desktop, prioritizing console errors, insecure resource requests, deprecated APIs, unsafe browser behavior, outdated libraries, and problematic embeds. Test the deployed page in the browser console, rerun both Lighthouse modes, and confirm that the specific failed audits have cleared.

### Desktop accessibility meets target — 1 point

**Status:** Failed

**Details:** PageSpeed measured a desktop accessibility score below the target of 90.

**Recommendation:** Fix the specific desktop accessibility findings reported for the page, prioritizing heading structure, form labels, accessible names, contrast, focus visibility, and keyboard operation. Rerun the automated audit after deployment and manually complete key reader journeys to confirm that navigation, forms, dialogs, and purchase controls remain usable.

### Homepage uses HTTPS — 1 point

**Status:** Failed

**Details:** The scanned homepage did not use a secure HTTPS address.

**Recommendation:** Move the homepage and all public assets to HTTPS so readers receive a secure connection and browsers do not display trust warnings. Install or renew a valid certificate, configure permanent HTTP-to-HTTPS redirects, update insecure internal links and resources, and verify the certificate chain, hostname coverage, and mixed-content console.

### Critical scanned pages load successfully — 1 point

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for critical scanned pages load successfully.

**Recommendation:** Repair each confirmed critical reader-facing URL that returns a 4xx, 5xx, incorrect destination, or avoidable redirect chain. Restore the required page or configure an appropriate permanent redirect, update internal links to the final URL, and rerun the crawl to verify the complete reader path.

### Search-engine access is available — 1 point

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for search-engine access is available.

**Recommendation:** Remove confirmed technical barriers that prevent search engines from accessing important public content. Correct blocking robots.txt rules, X-Robots-Tag headers, authentication gates, server restrictions, or unsuccessful responses, then verify the live preferred URL with an appropriate search-engine inspection tool after deployment.

### Canonical URL is valid — 1 point

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for canonical url is valid.

**Recommendation:** Add or correct the canonical URL so the page identifies its preferred public version consistently. Use one valid `<link rel="canonical">` that matches the final HTTPS hostname and intended path, remove duplicate or conflicting canonicals, and verify the rendered head after redirects and template processing.

### Author or site structured data is valid — 1 point

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for author or site structured data is valid.

**Recommendation:** Add valid Person or Organization structured data so search systems can interpret the author or site identity consistently. Publish parsable JSON-LD containing the canonical author name, preferred URL, and verified official profiles, remove conflicting entities, and validate the live rendered markup after deployment.

## 7. Author Trust — 10 points

### Author bio is present — 2 points

**Status:** Failed

**Details:** The scan did not find a clear author bio or biography page.

**Recommendation:** Publish a substantive author biography so readers, media contacts, booksellers, and event organizers can understand the author’s background and work. Add readable HTML to a public About page, include genre, notable books, and relevant credentials, link it from the navigation or homepage, and keep the information current.

### Author photo is present — 2 points

**Status:** Failed

**Details:** The scan did not find an author photo, portrait, or headshot signal.

**Recommendation:** Add a current professional author portrait to the homepage or About page so readers can connect the name with a recognizable person. Use a responsive image with appropriate dimensions, compression, crop, and alt text, place it near the biography, and verify its quality across desktop and mobile layouts.

### Contact path is present — 2 points

**Status:** Failed

**Details:** The scan did not find a contact form or contact email.

**Recommendation:** Create a clearly labeled public Contact page so readers, press contacts, event organizers, and business partners can reach the appropriate destination. Provide an accessible form or purpose-specific email address, configure validation, spam protection, success messaging, and inbox routing, and submit a controlled test before publishing.

### Social profile links are present — 1 point

**Status:** Failed

**Details:** The scan did not find links to author social profiles.

**Recommendation:** Add links to the author’s active official social profiles so readers can continue engaging on the platforms the author currently maintains. Use final profile URLs, provide accessible names for icon-only controls, place the links consistently in the footer, header, or Contact area, and remove inactive or unrelated accounts.

### Media kit is present — 1 point

**Status:** Failed

**Details:** The scan did not find a media kit, press kit, or press page.

**Recommendation:** Create a public media or press page so journalists, bloggers, event organizers, and booksellers can access approved author materials efficiently. Include short and long biographies, high-resolution portraits, cover files, book information, usage notes, and press contact details, then verify that every asset is downloadable through a stable public URL.

### Privacy policy is present — 1 point

**Status:** Failed

**Details:** The scan did not find a privacy-policy link, creating a maintenance and trust concern for forms and newsletter collection.

**Recommendation:** Publish a privacy policy that accurately describes the website’s forms, email provider, analytics, cookies, embeds, data uses, retention practices, and user choices. Link it persistently from the footer and near relevant data-collection forms, ensure the page loads publicly, and obtain appropriate legal review for the jurisdictions served.

### Trust proof is present — 1 point

**Status:** Failed

**Details:** The scan did not find reviews, praise, ratings, or similar trust proof.

**Recommendation:** Add credible author-level proof to strengthen confidence in the author’s professional identity. Present attributable awards, media coverage, publisher credentials, speaking appearances, professional endorsements, or recognized achievements near the biography, include supporting context or source links, and avoid vague, anonymous, unverifiable, or outdated claims.

## 8. Site Usability — 5 points

### Primary navigation works across viewports — 1 point

**Status:** Failed

**Details:** The rendered homepage did not provide usable primary navigation in every tested viewport.

**Recommendation:** Implement usable primary navigation across desktop, tablet, and mobile so readers can reliably reach important pages. Provide a semantic navigation region, visible desktop links, an accessible mobile menu button with expanded-state communication, and working Books, About, newsletter, and Contact destinations, then test with keyboard and pointer input.

### Priority reader paths are easy to reach — 1 point

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for priority reader paths are easy to reach.

**Recommendation:** Make the website’s priority reader destinations easy to reach from the homepage. Add clear links to Books, About, newsletter, Contact, and the featured purchase path within one or two actions, use descriptive labels, remove unnecessary navigation depth, and test every route on desktop and mobile.

### Calls to action are clear and descriptive — 1 point

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for calls to action are clear and descriptive.

**Recommendation:** Replace vague or ambiguous calls to action with labels that clearly describe the next step and destination. Use wording such as “Buy the Book,” “Read a Sample,” “View All Books,” or “Join the Newsletter,” associate each label with the correct content, and verify clarity on desktop and mobile.

### Forms and interactive controls are usable — 1 point

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for forms and interactive controls are usable.

**Recommendation:** Correct unusable forms and interactive controls so readers can complete important actions without confusion or obstruction. Add visible labels and accessible names, repair validation and focus behavior, prevent clipping or overlap, and manually test newsletter forms, Contact forms, menus, dialogs, and purchase controls across common viewports.

### Content is not blocked or visually broken — 1 point

**Status:** Failed

**Details:** The inspected evidence did not meet the configured requirement for content is not blocked or visually broken.

**Recommendation:** Remove or reconfigure overlays, broken components, missing assets, or layout errors that obscure important author, book, navigation, signup, or purchase content. Ensure banners and dialogs can be dismissed, repair collapsed or unreadable sections, and verify the complete page at common desktop and mobile viewport sizes.
