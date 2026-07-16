# Author Website Analyzer — Design Specification

## 1. Product Overview

**Author Website Analyzer** is a web app that reviews an author's existing website and generates an actionable scorecard. Users enter a website URL, the app analyzes key author-marketing elements, then returns a score out of 100 with critiques, strengths, weaknesses, and prioritized recommendations.

The design should feel professional, editorial, trustworthy, and modern. The app should communicate that it is both analytical and author-friendly: technical enough to be credible, but simple enough for non-technical authors to understand.

---

## 2. Design Goals

1. **Make analysis feel simple**  
   Authors should understand what to do immediately: paste a website URL and start the analysis.

2. **Make results feel credible**  
   Scores, categories, recommendations, and evidence should be organized clearly so users trust the output.

3. **Make improvements actionable**  
   Every critique should lead to a practical next step, not vague advice.

4. **Support both public users and internal/admin users**  
   The frontend should focus on authors and clients. The backend/admin should focus on reviewing analyses, managing scoring rules, users, reports, and system activity.

5. **Prepare for SaaS expansion**  
   The design should be flexible enough to support accounts, saved reports, paid plans, white-label reports, and agency/client workflows later.

---

## 3. Brand Direction

### Brand Personality

- Professional
- Helpful
- Clear
- Editorial
- Strategic
- Author-focused
- Slightly premium, but not intimidating

### Visual Feel

The interface should resemble a clean SaaS analytics dashboard combined with an editorial publishing tool. Avoid overly playful visuals. The app should look credible enough for authors, publishers, marketers, and consultants.

### Suggested Tagline

> Turn your author website into a stronger book marketing asset.

---

## 4. Color System

Use a restrained color palette with strong contrast and clear semantic states.

### Primary Colors

| Token | Color | Usage |
|---|---:|---|
| `--color-primary` | `#3B2F80` | Primary buttons, active states, key accents |
| `--color-primary-hover` | `#2F2666` | Button hover states |
| `--color-primary-soft` | `#EEEAFB` | Soft backgrounds, badges, panels |

### Neutral Colors

| Token | Color | Usage |
|---|---:|---|
| `--color-bg` | `#F8F7F4` | Main page background |
| `--color-surface` | `#FFFFFF` | Cards, panels, modals |
| `--color-border` | `#E5E1DA` | Borders and dividers |
| `--color-text` | `#1F2933` | Primary text |
| `--color-muted` | `#667085` | Secondary text |
| `--color-subtle` | `#F1EFEA` | Secondary sections |

### Semantic Colors

| Token | Color | Usage |
|---|---:|---|
| `--color-success` | `#16803C` | Strong score, completed state |
| `--color-warning` | `#B7791F` | Moderate issue, warning state |
| `--color-danger` | `#C2410C` | Critical issue, low score |
| `--color-info` | `#2563EB` | Informational notes |

### Score Color Guidance

| Score Range | Status | Visual Treatment |
|---:|---|---|
| 90–100 | Excellent | Green badge, celebratory but restrained |
| 75–89 | Strong | Green/blue badge |
| 60–74 | Needs improvement | Amber badge |
| 40–59 | Weak | Orange badge |
| 0–39 | Critical | Red badge |

---

## 5. Typography

### Font Recommendation

Use a clean sans-serif typeface for the application UI.

Recommended options:

- **Lazzer VF** — primary variable font for the public and admin interfaces
- **Source Sans 3** — good editorial feel
- **Manrope** — modern and friendly

### Type Scale

| Style | Size | Weight | Usage |
|---|---:|---:|---|
| Display | 48px | 700 | Homepage hero headline |
| H1 | 36px | 700 | Page titles |
| H2 | 28px | 700 | Section headings |
| H3 | 22px | 600 | Card titles, report sections |
| Body Large | 18px | 400 | Hero copy, intro text |
| Body | 16px | 400 | Main UI text |
| Small | 14px | 400 | Helper text, metadata |
| Tiny | 12px | 500 | Labels, badges, table metadata |

### Typography Rules

- Keep line length around 60–75 characters for content-heavy sections.
- Use bold text sparingly to emphasize results, not entire paragraphs.
- Use short, direct labels for buttons and navigation.
- Avoid technical SEO jargon unless accompanied by plain-language explanations.

---

## 6. Layout System

### Grid

- Use a 12-column desktop grid.
- Use a maximum content width of `1200px`.
- Use `24px` gutters on desktop.
- Use `16px` gutters on mobile.

### Spacing Scale

| Token | Value |
|---|---:|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |
| `--space-7` | 48px |
| `--space-8` | 64px |
| `--space-9` | 96px |

### Card Styling

Cards should be the primary container pattern throughout the app.

Recommended card style:

```css
.card {
  background: #ffffff;
  border: 1px solid #e5e1da;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(31, 41, 51, 0.06);
  padding: 24px;
}
```

---

## 7. Frontend Site Structure

The public-facing frontend should prioritize clarity, trust, and conversion.

### Main Navigation

Recommended nav items:

- Home
- How It Works
- Sample Report
- Pricing
- Login
- Start Analysis

Primary CTA: **Analyze My Website**

---

## 8. Homepage Design

### Hero Section

Purpose: Make the core value immediately obvious.

Recommended content structure:

```text
Headline:
Analyze your author website in minutes.

Subheadline:
Get a clear score, expert-style critique, and practical recommendations to improve your brand clarity, book visibility, and reader engagement.

Primary CTA:
Analyze My Website

Secondary CTA:
View Sample Report
```

### Hero UI Elements

Include:

- URL input field
- Primary button
- Short trust text below the form
- Right-side preview card showing a sample score

Example trust text:

> No technical setup required. Enter your website URL and receive a structured author marketing report.

### Hero Preview Card

The preview card should show:

- Overall score
- Category scores
- Top recommendation
- Small visual chart or score ring

Example:

```text
Overall Website Score
82 / 100

Brand Clarity: 13/15
Book Visibility: 17/20
Reader Engagement: 11/15
Search Visibility: 12/15
Mobile Performance: 8/10
Technical Health: 8/10
Author Trust: 9/10
Site Usability: 4/5
```

---

## 9. Homepage Sections

### Section 1: How It Works

Use a 3-step layout.

1. **Enter your website URL**  
   Paste the homepage or author website link.

2. **Get a structured analysis**  
   The app checks branding, messaging, book visibility, conversion paths, SEO basics, and trust signals.

3. **Improve with clear recommendations**  
   Receive practical suggestions ranked by priority.

### Section 2: What the App Reviews

Use a grid of feature cards.

Recommended modules:

- Brand Clarity
- Book Visibility
- Reader Engagement
- Search Visibility
- Mobile Performance
- Technical Health
- Author Trust
- Site Usability

### Section 3: Sample Report Preview

Show a partial sample report with:

- Overall score
- Category breakdown
- Priority recommendations
- Example critique

### Section 4: Why Authors Need This

Explain common author website problems:

- The homepage does not clearly say what the author writes.
- Books are difficult to find.
- There is no strong call to action.
- The email signup is weak or missing.
- The site looks outdated or untrustworthy.
- The website does not support book sales or reader growth.

### Section 5: CTA Banner

Use a bold but clean banner.

```text
Ready to improve your author website?
Get your website score and recommendations today.

[Analyze My Website]
```

---

## 10. URL Submission Page

### Purpose

This page is where users start an analysis.

### Layout

Use a focused, distraction-free layout.

Recommended fields:

- Website URL
- Author name, optional
- Primary book genre, optional
- Email address, optional if guest reports are allowed

### Validation Rules

- URL must include a valid domain.
- Automatically normalize missing protocols, such as converting `example.com` to `https://example.com`.
- Show clear error messages for invalid or unreachable URLs.

### CTA Button

Primary button label:

> Start Website Analysis

Loading state:

> Analyzing Website...

### Loading Experience

During analysis, show a staged progress experience:

1. Fetching website content
2. Reviewing homepage clarity
3. Checking book visibility
4. Evaluating conversion paths
5. Scoring report categories
6. Preparing recommendations

Avoid a blank loading spinner. Use progress messages to increase user confidence.

---

## 11. Analysis Results Page

The results page is the most important screen in the app.

### Recommended Layout

Use a two-column desktop layout:

- Left/main column: full analysis report
- Right/sidebar column: score summary, category navigation, export CTA

On mobile, stack the sidebar above the report.

### Results Page Sections

1. Overall Score
2. Executive Summary
3. Category Score Breakdown
4. Strengths
5. Priority Issues
6. Detailed Module Analysis
7. Recommended Improvements
8. Suggested Next Steps
9. Export or Save Report

---

## 12. Overall Score Component

### Visual Design

Use a large score card at the top of the report.

Suggested layout:

```text
Author Website Score
82 / 100
Strong

Your website has a solid foundation, but it needs clearer reader engagement paths and stronger book visibility above the fold.
```

### Component Requirements

- Large numeric score
- Score status label
- One-paragraph summary
- Date analyzed
- Website URL
- Button to re-run analysis

---

## 13. Category Score Breakdown

Use cards or horizontal bars for each category.

Recommended categories and weights:

| Category | Weight |
|---|---:|
| Brand Clarity | 15 |
| Book Visibility | 20 |
| Reader Engagement | 15 |
| Search Visibility | 15 |
| Mobile Performance | 10 |
| Technical Health | 10 |
| Author Trust | 10 |
| Site Usability | 5 |
| **Total** | **100** |

### Category Card Structure

Each category card should include:

- Category name
- Score
- Status label
- Short explanation
- Link to detailed section

Example:

```text
Book Visibility
14 / 20
Needs improvement

Your books are present, but the homepage does not strongly guide visitors toward learning about or buying them.
```

---

## 14. Detailed Analysis Module Design

Each module should use a consistent structure.

### Module Template

```text
Module Name
Score: 14 / 20
Status: Needs improvement

What we checked:
A short explanation of what this module evaluates.

What we found:
Specific critique based on the website analysis.

Why it matters:
Plain-language explanation of how this affects author branding, reader trust, or book sales.

Recommended fixes:
1. Clear action item
2. Clear action item
3. Clear action item
```

### Priority Labels

Use clear priority labels:

- Critical
- High
- Medium
- Low

### Recommendation Card Style

Each recommendation should show:

- Priority
- Effort level
- Expected impact
- Action description

Example:

```text
High Priority
Medium Effort
High Impact

Rewrite the homepage headline so it clearly states your genre, audience, and reader promise.
```

---

## 15. Recommendations Section

The prioritized recommendations should be one of the most useful parts of the report.

### Recommended Structure

Group recommendations by timeline.

#### Fix This Week

- Improve homepage headline
- Add a primary book CTA above the fold
- Add email signup section to homepage

#### Fix This Month

- Improve book pages
- Add reader testimonials or reviews
- Improve internal linking

#### Long-Term Improvements

- Create a lead magnet
- Publish regular author updates or blog content
- Improve technical SEO and schema markup

---

## 16. Report Export Design

Users should be able to save or export their report.

### Export Options

- Download PDF
- Email report
- Save to dashboard
- Copy recommendations

### PDF Report Layout

The PDF should include:

1. Cover page
2. Overall score
3. Executive summary
4. Category breakdown
5. Detailed analysis
6. Priority recommendations
7. Final recommendations

Keep the PDF clean and client-ready.

---

## 17. User Dashboard

### Purpose

The dashboard lets users access previous analyses and track improvements over time.

### Dashboard Sections

- Recent analyses
- Saved websites
- Score trends
- Reports waiting for review
- Account status

### Dashboard Card Example

```text
janeaustenexample.com
Last analyzed: July 9, 2026
Score: 74 / 100
Status: Needs improvement

[View Report] [Re-analyze]
```

### Empty State

```text
No website analyses yet.
Start by analyzing your author website and receive a complete scorecard.

[Analyze My Website]
```

---

## 18. Backend/Admin Design

The admin area should be functional, structured, and data-focused. It does not need to be flashy, but it must be clean and efficient.

### Admin Navigation

Recommended admin sidebar items:

- Dashboard
- Analyses
- Users
- Reports
- Scoring Rules
- Recommendations Library
- Feedback
- Settings
- Logs

---

## 19. Admin Dashboard

### Metrics to Show

- Total analyses run
- Analyses today
- Average website score
- Failed analyses
- New users
- Reports exported
- Most common issues

### Admin Dashboard Layout

Use KPI cards at the top, followed by charts and recent activity.

Example KPI cards:

```text
Total Analyses
1,248

Average Score
68 / 100

Failed Crawls
23

PDF Exports
416
```

---

## 20. Admin Analyses Page

### Purpose

Allows the admin to review, search, filter, and manage submitted website analyses.

### Table Columns

- Website URL
- Author name
- User email
- Score
- Status
- Date analyzed
- Report type
- Actions

### Filters

- Score range
- Date range
- Status
- User type
- Report exported or not
- Failed analyses

### Row Actions

- View report
- Re-run analysis
- Delete analysis
- Export PDF
- Mark for review

---

## 21. Admin Report Review Page

### Purpose

Allows internal review and manual adjustment before a report is finalized, especially if premium human-reviewed reports are added later.

### Sections

- Website snapshot
- Raw extracted content
- AI-generated analysis
- Category scores
- Recommendation editor
- Admin notes
- Approval status

### Useful Controls

- Edit score
- Edit recommendation
- Add internal note
- Approve report
- Regenerate section
- Export final report

---

## 22. Scoring Rules Admin Page

### Purpose

Allows scoring logic to be managed without changing code every time.

### Table Columns

- Rule name
- Category
- Weight
- Condition checked
- Active/inactive
- Last updated

### Example Rules

```text
Strong Homepage Headline
Category: Brand Clarity
Weight: 5 points
Condition: Homepage contains a clear author positioning statement above the fold.

Visible Book CTA
Category: Book Visibility
Weight: 5 points
Condition: Homepage includes a prominent CTA to view, buy, or learn about books.
```

---

## 23. Recommendations Library

### Purpose

Stores reusable recommendations that can be mapped to scoring issues.

### Recommendation Fields

- Title
- Category
- Trigger condition
- Priority
- Effort level
- Expected impact
- Recommendation body
- Example fix

### Example Recommendation

```text
Title: Rewrite the homepage headline
Category: Brand Clarity
Priority: High
Effort: Medium
Impact: High

Recommendation:
Rewrite the homepage headline so visitors immediately understand who the author is, what genre they write, and why the reader should care.
```

---

## 24. Component Library

### Ecme Is the Source of Truth

The existing Ecme template is the primary design and implementation source for every new, updated, or redesigned public and admin interface. Preserve one coherent product system across frontend and backend by reusing Ecme's visual tokens, layout patterns, responsive behavior, accessibility, component states, and interactions.

Before designing or implementing a custom component, layout, hook, or utility:

1. Review `/guide/` for the template's documented patterns and conventions.
2. Review `/concepts/` for an existing complete page, workflow, layout, or feature pattern that can be adapted.
3. Review the matching `/ui-components/*` documentation and TypeScript example.
4. Check `/guide/shared-component-doc/` for an existing composed shared component.
5. Check `/guide/utils-doc/` for an existing hook, helper, or utility.
6. Inspect the implementation in `src/components/ui`, `src/components/shared`, or `src/utils` (including `src/utils/hooks`) and reuse or compose it when suitable.

Public pages may use a more editorial presentation and admin pages may use denser data layouts, but they should share the same typography, color tokens, controls, feedback states, spacing logic, and interaction conventions. Create feature-specific custom code only when Ecme does not provide the required behavior, and document intentional departures from an established pattern.

### Core Components

The app should use Ecme's reusable component system rather than adding a competing general-purpose UI library.

#### Buttons

Button types:

- Primary
- Secondary
- Ghost
- Danger
- Icon button

Button states:

- Default
- Hover
- Active
- Loading
- Disabled

#### Form Inputs

Input types:

- Text input
- URL input
- Email input
- Select dropdown
- Textarea
- Checkbox
- Toggle

Each input should include:

- Label
- Helper text
- Error text
- Focus state

#### Cards

Card types:

- Score card
- Category card
- Recommendation card
- Report section card
- KPI card
- Empty state card

#### Badges

Badge types:

- Score status
- Priority
- Category
- Report status
- User type

#### Tables

Table requirements:

- Search
- Sort
- Filter
- Pagination
- Row actions
- Empty state
- Loading skeleton

#### Modals

Modal use cases:

- Confirm delete
- Export report
- Edit score
- Regenerate section
- Upgrade prompt

---

## 25. Data Visualization

### Score Ring

Use for overall score.

Requirements:

- Large number in center
- Ring color based on score range
- Label below score

### Horizontal Score Bars

Use for category scores.

Requirements:

- Category name
- Numeric score
- Colored progress bar
- Status label

### Trend Chart

Use in dashboard when repeat analyses exist.

Requirements:

- X-axis: analysis date
- Y-axis: score
- Show score improvement over time

---

## 26. UX Writing Guidelines

### Tone

- Clear
- Helpful
- Specific
- Professional
- Encouraging but honest

### Good UX Copy Examples

Instead of:

> Your website is bad.

Use:

> Your website needs a clearer homepage message so new visitors immediately understand what you write and why they should keep reading.

Instead of:

> SEO is poor.

Use:

> Your site is missing several basic SEO signals, which may make it harder for readers to discover your books through search.

Instead of:

> Conversion failed.

Use:

> Visitors are not given a strong next step, such as joining your email list, viewing your books, or downloading a sample chapter.

---

## 27. Accessibility Requirements

The interface should follow WCAG-friendly principles.

### Requirements

- Maintain strong color contrast.
- Do not rely on color alone to communicate score status.
- Use visible focus states for keyboard navigation.
- Add labels to all form fields.
- Use semantic heading order.
- Provide descriptive button labels.
- Ensure modals can be closed by keyboard.
- Ensure charts include text equivalents.

### Minimum Contrast Targets

- Normal text: 4.5:1
- Large text: 3:1
- UI components: 3:1

---

## 28. Responsive Design

### Breakpoints

| Breakpoint | Width |
|---|---:|
| Mobile | 0–639px |
| Tablet | 640–1023px |
| Desktop | 1024–1279px |
| Large Desktop | 1280px+ |

### Mobile Rules

- Stack columns vertically.
- Keep the URL input and CTA highly visible.
- Use full-width buttons.
- Collapse sidebar navigation into a menu.
- Make score cards easy to scan.
- Avoid wide tables; use responsive cards or horizontal scrolling for admin tables.

### Desktop Rules

- Use two-column report layouts.
- Keep key score summary sticky where useful.
- Use side navigation for report sections.
- Use tables for admin workflows.

---

## 29. Loading, Empty, and Error States

### Loading States

Use skeleton loaders for dashboards and reports.

For analysis processing, use progress messaging:

```text
Reviewing your homepage message...
Checking book visibility...
Evaluating reader engagement paths...
Preparing your recommendations...
```

### Empty States

Empty states should explain what is missing and what to do next.

Example:

```text
No saved reports yet.
Analyze your first author website to create a report.

[Start Analysis]
```

### Error States

Error messages should be specific and recovery-focused.

Examples:

```text
We could not reach this website. Check the URL and try again.
```

```text
The website loaded, but we could not extract enough content for a complete analysis.
Try submitting the homepage URL instead.
```

---

## 30. Suggested Page List

### Public Pages

- `/` — Homepage
- `/analyze` — URL submission page
- `/sample-report` — Sample report
- `/pricing` — Pricing page
- `/login` — Login page
- `/signup` — Signup page

### Authenticated User Pages

- `/dashboard` — User dashboard
- `/reports` — Saved reports
- `/reports/[id]` — Individual report
- `/settings` — Account settings

### Admin Pages

- `/admin` — Admin dashboard
- `/admin/analyses` — Analysis list
- `/admin/analyses/[id]` — Analysis detail/review
- `/admin/users` — User management
- `/admin/scoring-rules` — Scoring rule management
- `/admin/recommendations` — Recommendation library
- `/admin/logs` — System logs
- `/admin/settings` — System settings

---

## 31. Recommended Frontend Stack

This design works well with:

- Next.js App Router
- TypeScript and React
- Tailwind CSS
- Ecme UI components, shared components, hooks, and utilities
- Icon sets already installed and used by the Ecme template
- Recharts or Tremor for charts
- Framer Motion for subtle transitions

Use component-driven development. Start with the closest existing Ecme page pattern, component, shared component, hook, or utility before creating app-specific composition. Do not add shadcn, `analyzer-ui`, or another competing component system when Ecme provides an appropriate pattern.

---

## 32. Tailwind Design Token Suggestions

Suggested Tailwind theme extension:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B2F80',
          hover: '#2F2666',
          soft: '#EEEAFB',
        },
        background: '#F8F7F4',
        surface: '#FFFFFF',
        border: '#E5E1DA',
        text: '#1F2933',
        muted: '#667085',
        success: '#16803C',
        warning: '#B7791F',
        danger: '#C2410C',
        info: '#2563EB',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        card: '0 8px 24px rgba(31, 41, 51, 0.06)',
      },
    },
  },
};
```

---

## 33. Suggested Component File Structure

```text
/components
  /layout
    Header.tsx
    Footer.tsx
    Sidebar.tsx
    AdminSidebar.tsx
    PageShell.tsx
  /ui
    Button.tsx
    Input.tsx
    Card.tsx
    Badge.tsx
    Modal.tsx
    Table.tsx
    Tabs.tsx
    Toast.tsx
  /analysis
    UrlAnalyzerForm.tsx
    AnalysisProgress.tsx
    OverallScoreCard.tsx
    CategoryScoreCard.tsx
    ScoreRing.tsx
    ScoreBar.tsx
    RecommendationCard.tsx
    ReportSection.tsx
    ActionPlan.tsx
  /dashboard
    KpiCard.tsx
    RecentReportsTable.tsx
    ScoreTrendChart.tsx
  /admin
    AdminKpiGrid.tsx
    AnalysisTable.tsx
    ScoringRuleEditor.tsx
    RecommendationEditor.tsx
```

---

## 34. Motion and Interaction Guidelines

Use motion sparingly.

Recommended animations:

- Button hover lift or color transition
- Card hover shadow increase
- Smooth progress transitions in score bars
- Fade-in sections after analysis completes
- Toast notifications for saved/exported actions

Avoid:

- Distracting animations
- Long loading animations
- Overly playful effects
- Motion that slows down admin workflows

---

## 35. Author Trust Elements

The app should include trust-building details throughout the experience.

Recommended trust signals:

- Explain what is being checked
- Show scoring categories clearly
- Provide evidence-based recommendations
- Include sample reports
- Show exportable reports
- Add privacy note near URL submission
- Avoid overclaiming guaranteed sales or rankings

Example privacy note:

> We only analyze publicly available website content. Private dashboards, unpublished pages, and password-protected content are not accessed.

---

## 36. Future Design Considerations

Prepare the UI for these possible future features:

- Paid plans
- Human expert review
- Agency dashboard
- Client report sharing
- White-label PDF reports
- Competitor comparison
- Before-and-after score tracking
- AI rewrite suggestions for homepage copy
- Integration with Google Search Console
- Integration with WordPress or Squarespace

---

## 37. MVP Design Priority

For the first version, prioritize these screens:

1. Homepage
2. URL submission page
3. Loading/progress state
4. Results report page
5. Basic user dashboard
6. Admin analysis list
7. Admin analysis detail page

Do not overbuild the first version. The most important MVP experience is:

```text
User enters URL → App analyzes site → User receives score and recommendations → User can save or export report
```

---

## 38. Design Acceptance Criteria

The design is ready when:

- Users can immediately understand what the app does.
- The URL submission flow is obvious and frictionless.
- The analysis report is easy to scan.
- The score breakdown feels transparent and credible.
- Recommendations are specific and actionable.
- The admin area can review and manage analyses efficiently.
- The layout works well on mobile and desktop.
- UI components are reusable and consistent.
- Empty, loading, and error states are designed.
- The visual identity feels professional and author-focused.

---

## 39. Codex Implementation Prompt

Use this prompt when asking Codex to implement the UI design:

```text
Create the UI for the Author Website Analyzer app based on design.md.

Use a professional SaaS-style design with an editorial author-marketing feel. Build reusable components for buttons, cards, badges, forms, score displays, recommendation cards, report sections, dashboards, and admin tables.

Prioritize these screens:
1. Homepage
2. Analyze URL page
3. Analysis loading/progress screen
4. Results report page
5. User dashboard
6. Admin dashboard
7. Admin analyses list
8. Admin analysis review page

Use responsive layouts, accessible components, clear empty states, and polished loading/error states. Keep the interface clean, trustworthy, and easy for non-technical authors to understand.
```

---

## 40. Final Direction

The design should make the app feel like a practical author marketing consultant, not just an automated scanner. The user should leave the report knowing exactly what is working, what is weak, and what to improve first.
