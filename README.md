# Author Website Analyzer

Author Website Analyzer is a GrailHiiv web app for reviewing existing author websites. It produces an author-focused scorecard for brand clarity, book visibility, reader engagement, search visibility, mobile performance, technical health, author trust, and site usability.

Numeric scores should be calculated with deterministic rules. AI may be used later to explain supported findings in simple, author-friendly language, but it should not invent scores or unsupported claims.

## Stack

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

## Scripts

```bash
npm ci
npm run deps:check
npm run workspace:sync
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run benchmark:analyzer
npm run prisma:generate
npm run prisma:migrate -- --name your_migration_name
npm run prisma:deploy
npx prisma validate
```

- `npm ci`: Recreates local dependencies exactly from `package-lock.json`. Use it after pulling on another computer whenever the lockfile changed.
- `npm run deps:check`: Confirms every direct application dependency is installed at the locked version. This runs automatically before development and production builds.
- `npm run workspace:sync`: Verifies dependencies, regenerates Prisma Client, and applies every committed database migration. This runs automatically before `npm run dev`.
- `npm run build`: Runs the production Next.js build.
- `npm run benchmark:analyzer`: Runs the offline author-site detection corpus and reports signal precision/recall, page-role accuracy, diagnostics, crawl coverage, and browser-fallback regressions.
- `npm run vercel-build`: Generates Prisma Client, then runs the production build. Use this as the Vercel build command.
- `npm run prisma:migrate`: Creates and applies a local development migration.
- `npm run prisma:deploy`: Applies committed migrations to the database configured by `DATABASE_URL`. It is used by local workspace synchronization and by deployment workflows.

## Working between home and office

Git stores the dependency manifests, but it intentionally does not store `node_modules`, `.next`, generated Prisma Client files, or local `.env` secrets. Use this workflow whenever you move to the other computer:

First stop any running `npm run dev` process. Pulling while the development server is still running can leave Turbopack holding an older generated Prisma Client in memory, even after the database and files have been updated.

```bash
git pull --ff-only
npm ci
npx playwright install chromium
npm run dev
```

The tracked `.npmrc` makes `npm ci` use the peer-dependency policy required by the current Next.js canary and Better Auth versions. `npm ci` also regenerates Prisma Client through the existing `postinstall` script. Before Next.js starts, `npm run dev` regenerates Prisma Client again and applies committed migrations to the database configured by that computer's `DATABASE_URL`. This prevents pulled application code from running against an older local database schema.

Keep each computer's `.env` configured locally; it is deliberately excluded from Git. Run the Playwright install again only after a new computer setup or a Playwright version change.

Before leaving either computer, commit and push the tracked project changes. Never copy or commit `node_modules` or `.next`; recreate them with the commands above.

## Environment

Copy `.env.example` to `.env` and fill in real values locally. Never expose secrets to client components.

```bash
DATABASE_URL=
OPENAI_API_KEY=
PAGESPEED_API_KEY=
APP_URL=
ADMIN_EMAIL=
AUTH_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Environment variables are validated on the server in `src/lib/env/server.ts`.
Import the typed `env` object only from server-side code.

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `OPENAI_API_KEY`: Server-side OpenAI key for generating author-friendly explanations from scan findings.
- `PAGESPEED_API_KEY`: Google PageSpeed Insights key for performance, accessibility, best practices, and SEO data.
- `APP_URL`: Public base URL for the app, used for links, callbacks, and future auth configuration.
- `ADMIN_EMAIL`: Email address for the first admin or admin notifications.
- `AUTH_SECRET`: Long random secret for signing authentication data. Use at least 32 characters.
- `RESEND_API_KEY`: Server-side Resend API key used to deliver full reports.
- `RESEND_FROM_EMAIL`: Sender address on a domain verified in Resend, such as `reports@example.com`.

Keep `DATABASE_URL`, `OPENAI_API_KEY`, `PAGESPEED_API_KEY`, `ADMIN_EMAIL`, `AUTH_SECRET`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` server-only in Vercel. Do not prefix them with `NEXT_PUBLIC_`.

## Admin Authentication

Internal routes are protected with Better Auth email/password login at `/login`.
The analyzer dashboard is available at `/dashboard`, with reports at `/reports`
and leads at `/leads`. The complete Ecme demo route library remains available for
gradual reuse, including `/dashboards/*`, `/concepts/*`, `/ui-components/*`, and
`/guide/*`.
Set `ADMIN_EMAIL` to the only email address allowed to create or access the admin account.
The first successful login with that email creates the admin user using the submitted password.

Run Prisma generation and a database migration after schema changes:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name describe_the_change
```

Use a long random `AUTH_SECRET`, keep it server-only, and make `APP_URL` match the local or deployed app URL used for authentication callbacks and trusted origins.

## Production Notes

- Prisma Client is generated during `postinstall` and again in `npm run vercel-build` because `src/generated/prisma` is ignored.
- The initial migration lives in `prisma/migrations/20260709000000_init/migration.sql`. Commit future migration folders before deploying.
- Internal pages such as `/dashboard`, `/reports`, `/leads`, and the Ecme demo routes are protected by `src/proxy.ts` and by the protected layout's server-side session and `ADMIN_EMAIL` checks.
- URL scanning uses server-side validation to block unsafe protocols, localhost, private IP ranges, and excessive redirects before crawler or screenshot work starts.
- PageSpeed failures are non-fatal. The report stores null technical scores and adds a low-severity finding instead of failing the whole report.
- AI failures are non-fatal. The report generator falls back to deterministic, non-AI narrative copy based on saved scores and findings.
- Screenshot storage is local-only for development at `public/storage/screenshots`, which is intentionally ignored by Git. Vercel's filesystem is not persistent, so the default local screenshot storage is disabled there. Connect a `ScreenshotStorage` adapter backed by Vercel Blob, S3, or Supabase Storage before relying on production screenshot previews.

## Vercel Deployment Checklist

1. Create PostgreSQL database.
2. Add `DATABASE_URL`.
3. Add `AUTH_SECRET`.
4. Add `ADMIN_EMAIL`.
5. Add `OPENAI_API_KEY`.
6. Add `PAGESPEED_API_KEY`.
7. Run Prisma migration with `npm run prisma:deploy`.
8. Deploy to Vercel using `npm run vercel-build` as the build command.
9. Test `/analyze`.
10. Test `/report/[id]`.
11. Test `/login`, `/dashboard`, `/reports`, and `/leads`.
12. Test completed report.
13. Test failed report.
