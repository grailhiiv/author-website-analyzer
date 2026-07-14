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

Organize the report's `Design & reader experience` review under Site Structure, Visual Design, and Conversion Design. Only the registered objective checks `usability.primary_navigation`, `mobile.viewport_fit`, and `mobile.text_contrast` affect existing Site Usability or Mobile Performance points. All other rendered observations are advisory. Keep subjective judgments such as genre fit, professionalism, emotional tone, and visual taste in a guided manual checklist. Do not add a ninth score category or change category maxima, applicability, or `not_applicable` behavior without an explicit approved product decision.

## Ecme template priority

When creating, updating, or redesigning any application interface, use the existing Ecme template as the primary implementation and design source. This applies to both public/frontend pages and protected admin/backend pages so the entire product retains one consistent visual language and interaction model.

Before creating a custom component, layout, hook, or utility:

1. Review `/guide/` for the template's documented patterns and conventions.
2. Review `/concepts/` for an existing complete page, workflow, layout, or feature pattern that can be adapted.
3. Check the relevant Ecme UI component route, such as `/ui-components/button`, `/ui-components/grid`, `/ui-components/card`, or `/ui-components/form-control`, and review its TypeScript example.
4. Review `/guide/shared-component-doc/` for an existing composed or application-level shared component.
5. Review `/guide/utils-doc/` for an existing hook, helper, or utility.
6. Inspect the corresponding implementation under `src/components/ui`, `src/components/shared`, or `src/utils` (including `src/utils/hooks`) before writing a replacement.
7. Reuse or compose the Ecme implementation whenever it meets the requirement, preserving its tokens, responsive behavior, accessibility, states, and interaction patterns.

Use the Ecme template's existing layouts, navigation patterns, form controls, data displays, feedback states, and utilities consistently across public and admin surfaces. A public page may have a more editorial presentation and an admin page may be denser, but both must remain recognizable as the same product system.

Create app-specific custom code only when the Ecme template does not provide the required behavior. Keep feature-specific composition components close to their feature rather than introducing another general-purpose UI layer. Document the reason when departing from an established Ecme pattern.

Do not add shadcn, `analyzer-ui`, or another competing component system when an appropriate Ecme component or pattern already exists.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

## Model and subagent routing

Automatically decide whether delegation is useful. Keep simple tasks on the
main agent, and do not delegate merely because a custom agent is available. Do
not ask the user to choose a model unless the required model is unavailable.

Use `fast_scan` for substantial read-only exploration that would otherwise
produce noisy context.

Use `quick_worker` for tiny, obvious edits such as exact wording changes,
simple CSS adjustments, formatting, and other bounded one-file fixes. Keep its
scope narrow and escalate to `routine_worker` when broader implementation or
verification is needed.

Use `routine_worker` for normal, bounded implementation. This is the default
subagent for everyday Author Website Analyzer development.

Use `deep_worker` when work crosses multiple systems, involves ambiguous
behavior, or requires substantial debugging and verification.

Use `critical_worker` only for consequential architecture, security,
deterministic scoring, report authorization, production reliability, or
release-readiness work.

Use no more than one subagent by default. Use multiple subagents only when the
tasks are genuinely independent. Numeric analyzer scores must always remain
deterministic; AI may explain findings but must not determine scores.
