We are building an Author Website Analyzer app for GrailHiiv.

The app allows an author or admin to enter an existing author website URL. The app scans the site and generates an author-specific critique focused on book promotion, reader conversion, newsletter growth, SEO, mobile experience, performance, trust, and maintenance risk.

Do not build the entire app at once. First review this product plan, propose the implementation structure, and create the initial project architecture.

Core user flow:
1. User enters website URL.
2. User selects author type.
3. User selects website goal.
4. App scans the website.
5. App generates an Author Website Scorecard.
6. App shows category scores, top problems, quick wins, and recommendations.
7. Admin can view reports and leads.

Primary categories:
- First Impression and Author Brand Clarity
- Book Promotion and Sales Readiness
- Reader Conversion and Newsletter Growth
- SEO Discoverability
- Mobile Experience and Accessibility
- Performance and Technical Health
- Trust and Credibility
- Maintenance and Website Risk

Tech stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma
- Better Auth for admin login
- Playwright for screenshots and page inspection
- PageSpeed Insights API for performance data
- AI SDK/OpenAI for report explanation
- Vercel deployment

Important rule:
Use deterministic scoring for numeric scores. Use AI only to explain findings in clear author-friendly language.