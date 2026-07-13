# Author Website Analyzer Product Plan

This document records confirmed product decisions for the GrailHiiv Author Website Analyzer. Read it before planning or implementing product changes.

## Product purpose

The app evaluates an existing author website and produces an author-specific scorecard focused on brand clarity, book visibility, reader engagement, search visibility, mobile performance, technical health, author trust, and site usability.

Numeric scores must be deterministic. AI may explain findings in clear, author-friendly language, but it must not determine numeric scores.

## User interface system

- The existing Ecme template is the application's primary design and implementation source for new, updated, and redesigned interfaces.
- Apply the same Ecme visual language, design tokens, responsive behavior, accessibility, states, and interaction patterns across public/frontend and protected admin/backend pages. The surfaces may differ in density and purpose, but they must remain one coherent product system.
- Before implementing UI or supporting frontend behavior, consult `/guide/`, `/concepts/` for complete page and workflow patterns, the matching `/ui-components/*` route and TypeScript example, `/guide/shared-component-doc/`, and `/guide/utils-doc/` as applicable.
- Inspect and reuse the corresponding implementations in `src/components/ui`, `src/components/shared`, and `src/utils` (including `src/utils/hooks`) before creating replacements.
- Create feature-specific custom components or utilities only when Ecme does not provide the required behavior. Keep them close to their feature, document intentional departures from established Ecme patterns, and do not introduce a competing general-purpose UI layer.

## Release model

- Development begins with an admin-operated workflow so GrailHiiv can review and calibrate results.
- The released product supports both admin-operated scans and author self-service scans.
- Author type and website goal are not collected anywhere in the scan flow. Scoring evaluates observable website content and behavior instead of stated intentions.

## Public author flow

1. The author submits only a website URL.
2. The app checks that the site is reachable, inspectable, and reasonably identifiable as an author website.
3. The app scans the site and produces deterministic findings and scores.
4. The author immediately sees a partial report containing:
   - The overall website score
   - All eight category scores
   - One top-priority problem
   - One quick win
   - Locked or obscured previews of the remaining findings and recommendations
5. The author enters their Full Name and a valid email address to unlock the full report. These are the only required contact fields.
6. The full report unlocks immediately in the browser.
7. The app emails the complete PDF report as an attachment together with a secure return link to the online report.

### Confirmed public page structure

- The homepage owns the website URL form. There is no separate `/analyze` page.
- After a scan begins, the homepage uses `/?domain=authorwebsite.com` and renders the saved or in-progress result directly below the existing hero. The hero itself does not change after a result appears.
- The first result section is a relatively compact `Overview for authorwebsite.com`. It is followed by eight distinctly titled audit modules matching the confirmed scorecard categories; do not compress the categories into one combined `Category Audit` or category-score block.
- The eight audit modules use a SEMrush-style report rhythm with a mix of full-width and paired two-column sections, while keeping the current homepage visual theme. A concise issue-and-recommendation preview, a two-column top-problem and quick-win row, and the email unlock prompt follow the modules.
- The canonical full-report address is `/report/authorwebsite.com`. The domain path identifies the latest saved report for that normalized domain; access control must not depend on the domain being secret or unguessable.
- Visiting the canonical report address without authorization shows only the partial report.
- Email submission creates a report access grant associated with that email address and the specific report that was unlocked.
- The secure emailed link contains an unguessable authorization token that reveals the full report. Unlocking a report does not make it public to everyone who visits the canonical domain route.
- The secure link is a bearer link: anyone who possesses it can view that specific full report, including a recipient to whom the author forwards it. Do not require an account, active session, or repeated email verification.
- Do not display the unlocking email address in the report. Allow an admin to revoke report access grants when necessary.
- Create an independent report access grant for each report and email-address pair. If the same email address requests the same report again, reuse or refresh its existing grant instead of creating a duplicate.
- Allow an admin to revoke one report access grant without affecting grants issued to other email addresses for the same report.
- A fresh scan produces a new report and requires a new report access grant; an access grant for an earlier report does not unlock the replacement report.
- Public and report-page icons must come from icon sets already installed and used by the template. Do not create one-off icon artwork.

Authors do not need an account in the initial release. The unlocked full report is available online and delivered as a PDF attachment by email.

## Full report

The unlocked report includes the complete set of detected problems, quick wins, explanations, and prioritized recommendations. Every failed deterministic scoring check provides one fixed primary recommendation plus several fixed practical actions. These actions are stored with the finding and remain available when AI generation fails.

AI failure must never prevent delivery of a usable report. Deterministic findings, priorities, primary recommendations, and practical actions provide the fallback. AI may clarify or personalize the supplied guidance and examples, but it must not invent unsupported fixes. Enhanced AI explanations may be regenerated later by an admin action or background process.

## Scan eligibility and failures

- Run a deterministic eligibility check before generating a scorecard.
- Do not produce a misleading numeric score for a site that is unreachable, blocks inspection, or lacks reasonable author or book signals.
- Show a helpful explanation and next steps when a report cannot be generated.
- Record failed attempts for admin visibility, but do not treat them as qualified leads.

## Crawl coverage policy

- Use a bounded, same-host HTML crawl rather than attempting to mirror an entire author website. Anchor the crawl to the homepage's validated final hostname; do not automatically trust sibling subdomains or a `www`/non-`www` variant that was not reached through a validated redirect.
- Discover candidates from server-returned homepage links, `/sitemap.xml`, and sitemap locations declared in `robots.txt`. Keep Cheerio as the default crawler because the audit primarily needs inspectable HTML; JavaScript-browser fallback is a separate future decision, not the default for every scan.
- Attempt at most 30 requests and save at most 10 successful, unique 2xx HTML pages. Redirects, failed requests, non-HTML responses, unsuccessful status pages, and duplicates do not consume the 10-page success budget.
- Preserve discovered path shape, including trailing slashes, while requests are queued. After redirects resolve, identify saved pages by the final URL, canonical URL, and extracted-content fingerprint.
- Prioritize the homepage, About/author page, book and series pages, newsletter signup, Contact, events, media/press, and blog/news before generic pages. Common root-level author slugs such as `about-the-author`, `the-example-saga`, and `the-example-trilogy` count as author-relevant candidates.
- Persist structured crawl diagnostics with each report, including discovery sources, candidate and attempt counts, saved URLs, final redirect URLs, skipped duplicates, unsuccessful responses, and request failures. A page limit is a maximum, not a guaranteed minimum; diagnostics must explain lower coverage.

## Repeat scans and cost controls

- Allow one fresh public scan per website within a 24-hour period.
- Reuse the recent result when the same website is submitted again during that period.
- Apply reasonable IP-based rate limits to public scanning.
- Allow admins to bypass the reuse window and force a fresh scan.
- A fresh scan becomes the current report for the normalized domain. Public report routes always show that latest scan; preserving an immutable public history is not required.
- Store homepage previews in a normalized-domain folder, such as `authorwebsite.com/homepage-desktop.png` and `authorwebsite.com/homepage-mobile.png`. A fresh scan overwrites those files so the preview always reflects the latest captured viewport.

## Email consent and lead capture

- Full Name and a valid email address are required to unlock and deliver the full report.
- The full-report CTA collects only Full Name, email address, and the separate optional marketing-consent checkbox. Do not collect author type or website goal.
- Report delivery does not constitute marketing consent.
- Offer a separate, optional marketing checkbox that is unchecked by default.
- Create an admin-visible lead after email submission whether or not the author opts into marketing.
- Send marketing only to authors who explicitly opt in.

## Admin workflow

Admins can view captured leads and their associated reports. The initial lead record includes:

- Full Name
- Email address
- Website URL
- Report and scan date
- Marketing-consent status
- Private admin notes
- Lead status

The initial lead stages are:

`New -> Contacted -> Qualified -> Converted`

A lead may instead be marked `Closed`.

Assignments, reminders, and automated follow-up are not currently part of the confirmed first-release workflow.

## Scorecard categories

1. Brand Clarity
2. Book Visibility
3. Reader Engagement
4. Search Visibility
5. Mobile Performance
6. Technical Health
7. Author Trust
8. Site Usability
