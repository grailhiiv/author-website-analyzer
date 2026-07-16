-- Replace the legacy four-state audit check enum with the approved three-state model.
CREATE TYPE "CheckResultState_new" AS ENUM (
    'PASSED',
    'NEEDS_REVIEW',
    'FAILED'
);

ALTER TABLE "ReportCheckResult"
ALTER COLUMN "state" TYPE "CheckResultState_new"
USING (
    CASE "state"::text
        WHEN 'PASS' THEN 'PASSED'
        WHEN 'FAIL' THEN 'FAILED'
        WHEN 'UNKNOWN' THEN 'NEEDS_REVIEW'
        WHEN 'NOT_APPLICABLE' THEN 'NEEDS_REVIEW'
    END
)::"CheckResultState_new";

DROP TYPE "CheckResultState";
ALTER TYPE "CheckResultState_new" RENAME TO "CheckResultState";

-- Existing saved check results use the new registry and check-content version.
UPDATE "ReportCheckResult"
SET
    "registryVersion" = 2,
    "checkVersion" = 2;

-- Existing deterministic findings are refreshed below from the canonical
-- Failed status content so saved reports and exports use the approved
-- recommendation-only wording.

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a clear author name in the page title, main heading, or structured data.',
    "recommendation" = 'Add the published author name as selectable text in the homepage H1 or hero and include the same canonical name in the `<title>` and Person schema. Keep spelling and pen-name formatting consistent, and verify that the name remains visible in the mobile header or initial viewport.'
WHERE "checkId" = 'brand.author_name'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find clear genre, topic, or writing category language.',
    "recommendation" = 'Add a plain-language genre or writing-category phrase near the author name or homepage introduction, such as “historical romance author.” Use the same primary category consistently in relevant headings and metadata without keyword stuffing.'
WHERE "checkId" = 'brand.genre_positioning'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The homepage did not provide a clear headline that quickly orients readers.',
    "recommendation" = 'Replace vague or competing hero slogans with one primary H1 that identifies the author, the type of books, or a specific reader promise. Render it as visible HTML text above the fold and keep secondary promotional messages at lower heading levels.'
WHERE "checkId" = 'brand.homepage_headline'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find an About page, author bio path, or clear About section.',
    "recommendation" = 'Create a public About page with a concise biography and link to it using standard anchors from the primary navigation, homepage, and footer. Ensure the URL returns a direct successful HTML response and is not blocked from crawling.'
WHERE "checkId" = 'brand.about_path'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The homepage scan found limited readable content to explain the author brand.',
    "recommendation" = 'Add a concise homepage introduction in readable HTML that explains who the author is, what they write, who the books are for, and the next useful reader step. Place it in the default page content rather than relying on an image, carousel, or popup.'
WHERE "checkId" = 'brand.homepage_content_depth'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find an image that looked like a book cover.',
    "recommendation" = 'Display a current priority-book cover as a responsive `<img>` with correct intrinsic dimensions, `srcset` or equivalent responsive delivery, and descriptive alt text. Link it to the matching book page and verify that it is sharp, uncropped, and legible on mobile.'
WHERE "checkId" = 'books.cover_visibility'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a clear book title in headings or book structured data.',
    "recommendation" = 'Add the complete book title as real text in a semantic heading beside or below the cover. Keep the title, description, and purchase controls grouped in the same book component across desktop and mobile layouts.'
WHERE "checkId" = 'books.title_visibility'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a book description, blurb, synopsis, or similar book copy.',
    "recommendation" = 'Add a concise hook or two-to-three-sentence synopsis as visible HTML near each featured book. Explain the central conflict, promise, or reader appeal and position the copy before the primary purchase control.'
WHERE "checkId" = 'books.description'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find clear buy, order, preorder, or purchase links.',
    "recommendation" = 'Add a clearly labeled purchase link or button for each featured book using a valid final URL for the correct edition and format. Test desktop and mobile activation, redirect behavior, regional storefront routing, and accessible link naming.'
WHERE "checkId" = 'books.purchase_links'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find links to more than one common book retailer.',
    "recommendation" = 'Add direct links to every retailer where the same edition is genuinely available and group them beneath the correct book. Do not create unavailable destinations; when a title is intentionally exclusive, document that state or adjust the audit rule rather than presenting false choices.'
WHERE "checkId" = 'books.retailer_options'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find reviews, praise, endorsements, awards, or reader proof.',
    "recommendation" = 'Add two or three credible review excerpts, endorsements, ratings, or awards near the relevant book and identify each source clearly. Use exact supported wording, link to evidence where appropriate, and avoid unattributed or unverifiable claims.'
WHERE "checkId" = 'books.reader_proof'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a clear featured book, latest release, or available-now section.',
    "recommendation" = 'Create one prominent featured-book section containing the cover, text title, concise hook, and primary purchase path. Render the complete section in the default homepage content and update it when the current release or campaign priority changes.'
WHERE "checkId" = 'books.featured_book'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a newsletter, subscribe form, or email signup field.',
    "recommendation" = 'Add an accessible email signup form connected to the intended mailing-list audience and request only necessary subscriber data. Configure validation, consent text, success messaging, confirmation or double opt-in, and automation delivery, then test the full subscriber flow.'
WHERE "checkId" = 'engagement.newsletter_signup'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find the newsletter signup on the homepage.',
    "recommendation" = 'Place a persistent newsletter form or clearly labeled subscription link in the homepage content, with an additional compact opportunity near the footer if appropriate. Do not rely solely on a timed popup, and verify that the form is usable on mobile.'
WHERE "checkId" = 'engagement.homepage_signup'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a reader magnet such as a free chapter, bonus scene, free book, or sample download.',
    "recommendation" = 'Create a relevant reader magnet such as a sample chapter, bonus scene, short story, or reading guide and describe exactly what subscribers receive. Connect the form to an automated delivery email or secure download, then test permissions, expiry, and delivery.'
WHERE "checkId" = 'engagement.reader_magnet'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find clear wording that explains why readers should subscribe.',
    "recommendation" = 'Add one specific sentence beside the signup control explaining the newsletter content, immediate incentive, and realistic frequency where useful. Keep this copy visible outside placeholders so readers and assistive technology can understand the value before submitting.'
WHERE "checkId" = 'engagement.subscriber_benefit'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a page title tag, which helps browsers and search engines understand the page.',
    "recommendation" = 'Generate one unique homepage `<title>` in the rendered document head, beginning with the published author name and adding concise genre or role context. Configure the CMS or framework so the title is present in the initial response and not overwritten by duplicate templates.'
WHERE "checkId" = 'search.title_tag'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The homepage title did not clearly include the author name, author role, books, or writing category.',
    "recommendation" = 'Rewrite the homepage title to clearly identify the published author and primary genre or author role, for example `Author Name | Historical Romance Author`. Put the identifying terms near the beginning and remove slogans that do not explain the site.'
WHERE "checkId" = 'search.author_title_format'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a meta description for the scanned pages.',
    "recommendation" = 'Add one distinct `<meta name="description">` to the homepage head that summarizes the author, books or genre, and a useful reader action. Render it consistently through the CMS or application metadata layer and avoid duplicate or empty description tags.'
WHERE "checkId" = 'search.meta_description'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan either did not find an H1 or found multiple H1 headings on a page.',
    "recommendation" = 'Set one page-specific H1 for the homepage''s primary topic and change decorative, logo, or repeated H1 elements to appropriate lower levels or non-heading markup. Verify the final rendered hierarchy so H2–H6 sections follow a logical structure.'
WHERE "checkId" = 'search.single_h1'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The main heading did not clearly connect the page to the author, books, or genre.',
    "recommendation" = 'Rewrite the homepage H1 so a new visitor can identify the author, genre, books, or reader promise without relying on surrounding images. Keep it concise, specific, and rendered as semantic text rather than artwork or pseudo-content.'
WHERE "checkId" = 'search.h1_clarity'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan found a noindex or similar signal that may keep the page out of search results.',
    "recommendation" = 'Remove unintended `noindex` directives, X-Robots-Tag restrictions, robots.txt blocks, authentication, or environment settings from important public pages. Verify the deployed canonical URL with a search-engine inspection tool and request indexing after the fix.'
WHERE "checkId" = 'search.indexability'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find enough internal links to key author website pages.',
    "recommendation" = 'Add descriptive internal anchors from the main navigation and relevant homepage sections to Books, About, Contact, newsletter, and other priority reader pages. Link directly to final canonical URLs and eliminate broken links or avoidable redirect chains.'
WHERE "checkId" = 'search.internal_links'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'PageSpeed measured a mobile performance score below the target of 70.',
    "recommendation" = 'Improve the mobile score to at least the configured target by resizing and compressing images, serving modern formats, reducing render-blocking CSS and JavaScript, deferring nonessential third-party code, and enabling effective caching. Use the individual PageSpeed diagnostics to prioritize the largest LCP, INP, CLS, and transfer-size contributors, then retest.'
WHERE "checkId" = 'mobile.pagespeed_performance'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'PageSpeed measured a mobile accessibility score below the target of 90.',
    "recommendation" = 'Resolve the failed mobile accessibility audits, prioritizing low contrast, missing accessible names, unlabeled form fields, incorrect alternative text, focus problems, and undersized or overlapping targets. Rerun Lighthouse and manually test keyboard and screen-reader behavior because the score alone does not confirm accessibility.'
WHERE "checkId" = 'mobile.pagespeed_accessibility'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The rendered mobile homepage contains measured text that falls below the baseline contrast threshold.',
    "recommendation" = 'Adjust text, overlay, and background colors until each flagged mobile element meets the applicable WCAG contrast ratio in its normal and interactive states. Test the actual rendered combinations at mobile breakpoints, including text over images, transparent layers, links, and buttons.'
WHERE "checkId" = 'mobile.text_contrast'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'PageSpeed measured a mobile search audit score below the target of 90.',
    "recommendation" = 'Open the failed Lighthouse SEO audits and correct each reported crawlability, metadata, status-code, or link issue. Confirm that the public URL returns complete rendered metadata and crawlable anchors, then rerun the mobile audit.'
WHERE "checkId" = 'mobile.pagespeed_seo'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan found images without alt text.',
    "recommendation" = 'Add an `alt` attribute to every meaningful `<img>`, describing the image''s purpose or content; identify covers by title and portraits by author name when that information is not already adjacent. Use `alt=""` for decorative images so screen readers can ignore them.'
WHERE "checkId" = 'mobile.image_alt_text'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The homepage loaded, but the scan did not find a visible, readable main heading in the initial page content.',
    "recommendation" = 'Ensure the homepage returns a successful public response and includes one visible text H1 in the initial rendered DOM. Remove persistent overlays or rendering errors that hide the heading, and verify the result in a signed-out mobile browser before rescanning.'
WHERE "checkId" = 'mobile.homepage_structure'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The rendered mobile homepage contains page-level horizontal overflow that can cause sideways scrolling or clipped content.',
    "recommendation" = 'Identify the element increasing the document width—commonly a fixed-width image, slider, form, iframe, table, transform, or absolutely positioned control—and replace rigid sizing with responsive constraints or wrapping. Confirm that `document.documentElement.scrollWidth` no longer exceeds the viewport at common phone widths.'
WHERE "checkId" = 'mobile.viewport_fit'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'PageSpeed measured a desktop performance score below the target of 70.',
    "recommendation" = 'Improve the desktop score to at least the configured target by serving appropriately sized modern images, removing unused CSS and JavaScript, reducing main-thread work, and configuring server, browser, or CDN caching. Use PageSpeed diagnostics to address the largest LCP, INP, CLS, and transfer-size contributors, then retest.'
WHERE "checkId" = 'technical.desktop_performance'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'PageSpeed measured a mobile best-practices score below the target of 90.',
    "recommendation" = 'Resolve every failed mobile best-practices audit, including console errors, insecure resource requests, deprecated APIs, image-delivery problems, and outdated libraries or embeds. Test the deployed page in the browser console and rerun Lighthouse after the fixes.'
WHERE "checkId" = 'technical.mobile_best_practices'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'PageSpeed measured a desktop best-practices score below the target of 90.',
    "recommendation" = 'Correct all failed desktop best-practices findings, prioritizing console errors, mixed content, deprecated APIs, unsafe browser behavior, and outdated third-party integrations. Deploy the fixes and verify the exact public URL with a fresh Lighthouse audit.'
WHERE "checkId" = 'technical.desktop_best_practices'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'PageSpeed measured a desktop accessibility score below the target of 90.',
    "recommendation" = 'Fix the highest-impact desktop accessibility findings, including contrast, form labels, accessible names, heading order, focus visibility, and keyboard operation. Rerun automated checks and complete a manual keyboard pass to confirm that interactive content remains usable.'
WHERE "checkId" = 'technical.desktop_accessibility'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scanned homepage did not use a secure HTTPS address.',
    "recommendation" = 'Install or renew a valid TLS certificate for every public hostname, configure permanent HTTP-to-HTTPS redirects, and update internal links and assets to secure URLs. Check the browser console for mixed content and verify the certificate chain and hostname coverage.'
WHERE "checkId" = 'technical.https'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan confirmed that at least one inspected URL returned a non-success response or an avoidable redirect chain.',
    "recommendation" = 'Repair every inspected URL returning a 4xx or 5xx response and replace unnecessary redirect chains with direct links to the final page. Restore required content or configure appropriate permanent redirects, then run a fresh crawl to confirm successful responses.'
WHERE "checkId" = 'technical.page_responses'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan found a robots rule, response directive, or page-level noindex signal that blocks important public content from search engines.',
    "recommendation" = 'Remove confirmed robots.txt blocks, meta robots directives, X-Robots-Tag headers, authentication, or environment restrictions from public pages intended for search. Verify the live URL with a search-engine inspection tool and confirm that the canonical destination is crawlable.'
WHERE "checkId" = 'technical.indexability'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a canonical URL or basic author/site structured data.',
    "recommendation" = 'Add a self-referencing canonical link to each important indexable page and publish valid Person or Organization JSON-LD with a consistent author name, URL, and official profiles. Validate the live rendered markup and remove duplicate, malformed, or conflicting identity data.'
WHERE "checkId" = 'technical.canonical_or_schema'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a clear author bio or biography page.',
    "recommendation" = 'Publish a substantive author biography as readable HTML on a public About page and add a concise homepage summary. Include genre, notable work, and relevant credentials, and keep the text current for readers, press, and event organizers.'
WHERE "checkId" = 'trust.author_bio'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find an author photo, portrait, or headshot signal.',
    "recommendation" = 'Add a current high-resolution author portrait to the About page or homepage trust section using a responsive image element. Supply appropriate dimensions, compression, and alt text identifying the author, and verify the crop at desktop and mobile widths.'
WHERE "checkId" = 'trust.author_photo'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a contact form or contact email.',
    "recommendation" = 'Create a clearly labeled Contact page with a working accessible form or purpose-specific email address. Configure validation, spam protection, success messaging, and inbox delivery, then submit a test message to verify the complete path.'
WHERE "checkId" = 'trust.contact_path'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find links to author social profiles.',
    "recommendation" = 'Add standard links to the author''s active official social profiles in a consistent header, footer, or contact area. Give icon-only links accessible names, use final profile URLs, and remove abandoned or unrelated accounts.'
WHERE "checkId" = 'trust.social_profiles'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a media kit, press kit, or press page.',
    "recommendation" = 'Create a public media page containing approved short and long biographies, high-resolution headshots, cover files, book information, usage notes, and press contact details. Use stable downloadable URLs with correct permissions and link the page from About or Contact.'
WHERE "checkId" = 'trust.media_kit'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a visible privacy-policy link.',
    "recommendation" = 'Publish a privacy policy that accurately reflects the site''s forms, newsletter provider, analytics, cookies, embeds, data uses, retention, and user choices. Link it persistently from the footer and near relevant data-collection forms, and have the wording reviewed for the jurisdictions served.'
WHERE "checkId" = 'trust.privacy_policy'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find reviews, praise, ratings, or similar trust proof.',
    "recommendation" = 'Add credible, attributable reviews, awards, ratings, endorsements, or reader testimonials near the author bio or featured book. Include enough source context to support each claim and link to evidence when useful.'
WHERE "checkId" = 'trust.reader_proof'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The rendered homepage did not provide usable primary navigation in every tested viewport.',
    "recommendation" = 'Implement a semantic primary navigation with a visible desktop menu and an accessible mobile menu button that communicates its expanded state. Ensure Books, About, Newsletter, and Contact remain reachable by keyboard and pointer at desktop, tablet, and mobile widths.'
WHERE "checkId" = 'usability.primary_navigation'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'At least one scanned page did not return a successful response.',
    "recommendation" = 'Repair each unsuccessful reader-facing URL and update menus, homepage calls to action, and content links to point directly to working final destinations. Remove avoidable redirect chains and verify the full reader path with a fresh crawl.'
WHERE "checkId" = 'usability.page_responses'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a privacy-policy link, creating a maintenance and trust concern for forms and newsletter collection.',
    "recommendation" = 'Publish or update a privacy policy that matches the site''s current forms, analytics, cookies, embeds, and email tools, then add a persistent footer link and appropriate form disclosures. Confirm that the policy URL is public, stable, and returns a successful response.'
WHERE "checkId" = 'usability.privacy_policy'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan did not find a canonical URL or basic site/author structured data.',
    "recommendation" = 'Add self-referencing canonical tags and accurate Person or Organization structured data to the homepage and other important public pages. Keep protocol, hostname, URL, author name, and official-profile references consistent, then validate the live markup.'
WHERE "checkId" = 'usability.canonical_or_schema'
  AND "origin" = 'DETERMINISTIC_SCORE';

UPDATE "ReportFinding"
SET "finding" = 'The scan found a footer copyright year that appears several years out of date.',
    "recommendation" = 'Update stale copyright, book-availability, event, biography, contact, and external-link information based on the actual content state. Add a scheduled editorial review process; an automatically changing footer year should not substitute for reviewing substantive content.'
WHERE "checkId" = 'usability.freshness'
  AND "origin" = 'DETERMINISTIC_SCORE';
