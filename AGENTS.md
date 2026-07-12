We are building an Author Website Analyzer app for GrailHiiv.

Before planning or implementing product changes, read `docs/product-plan.md`. It is the durable source for confirmed product decisions and explicitly identifies unresolved decisions. Do not implement an unresolved recommendation as though it were approved.

The app allows an author or admin to enter an existing author website URL. The app scans the site and generates an author-specific critique focused on brand clarity, book visibility, reader engagement, search visibility, mobile performance, technical health, author trust, and site usability.

Do not build the entire app at once. First review this product plan, propose the implementation structure, and create the initial project architecture.

Core user flow:
1. User enters website URL.
2. App checks whether the site is reachable, inspectable, and reasonably identifiable as an author website.
3. App scans the website.
4. App generates an Author Website Scorecard using deterministic scoring.
5. Author sees a partial report with the overall score, all category scores, one top problem, and one quick win.
6. Author enters an email address to unlock the full report immediately and receive a secure return link.
7. Admin can view reports and leads.

Do not collect author type or website goal. Score the observable website rather than stated intentions.

Primary categories:
- Brand Clarity
- Book Visibility
- Reader Engagement
- Search Visibility
- Mobile Performance
- Technical Health
- Author Trust
- Site Usability

Tech stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Ecme UI components
- PostgreSQL
- Prisma
- Better Auth for admin login
- Playwright for screenshots and page inspection
- PageSpeed Insights API for performance data
- AI SDK/OpenAI for report explanation
- Vercel deployment

Important rule:
Use deterministic scoring for numeric scores. Use AI only to explain findings in clear author-friendly language.

## Ecme UI component priority

When building, redesigning, or extending the application UI, use the existing Ecme components in `src/components/ui` as the primary component system.

Before creating a custom component:

1. Check the relevant Ecme documentation route, such as `/ui-components/button`, `/ui-components/grid`, `/ui-components/card`, or `/ui-components/form-control`.
2. Review the TypeScript example in the documentation.
3. Inspect the corresponding implementation under `src/components/ui`.
4. Reuse or compose the Ecme component whenever it meets the requirement.

Create a custom component only when Ecme does not provide the required behavior. Keep app-specific composition components close to their feature rather than introducing another general-purpose UI layer.

Do not add shadcn, `analyzer-ui`, or another competing component system when an appropriate Ecme component already exists.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->
