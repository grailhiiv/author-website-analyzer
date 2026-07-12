import type { ReportCategory } from "@/generated/prisma/client";

export const reportCategoryOrder = [
  "BRAND_CLARITY",
  "BOOK_VISIBILITY",
  "READER_ENGAGEMENT",
  "SITE_USABILITY",
  "MOBILE_PERFORMANCE",
  "AUTHOR_TRUST",
  "SEARCH_VISIBILITY",
  "TECHNICAL_HEALTH",
] as const satisfies readonly ReportCategory[];

export const reportCategoryDisplay: Record<
  ReportCategory,
  { title: string; description: string }
> = {
  BRAND_CLARITY: {
    title: "Brand Clarity",
    description:
      "This section evaluates how quickly visitors understand your author identity, genre, homepage message, and overall brand positioning when they first land on your website.",
  },
  BOOK_VISIBILITY: {
    title: "Book Visibility",
    description:
      "This section reviews how clearly your books are presented, including book pages, purchase links, cover visibility, descriptions, series order, and paths to buy or read.",
  },
  READER_ENGAGEMENT: {
    title: "Reader Engagement",
    description:
      "This section measures how well your website encourages reader action through newsletter signups, reader magnets, contact options, social links, and meaningful calls to action.",
  },
  MOBILE_PERFORMANCE: {
    title: "Mobile Performance",
    description:
      "This section analyzes how your website performs on mobile devices, reviewing responsive layout, loading behavior, visual stability, button accessibility, and usability across smaller screens.",
  },
  AUTHOR_TRUST: {
    title: "Author Trust",
    description:
      "This section reviews trust signals that make your author platform feel credible, including professional presentation, biography depth, testimonials, press mentions, policies, and contact transparency.",
  },
  SEARCH_VISIBILITY: {
    title: "Search Visibility",
    description:
      "This section evaluates basic SEO signals that help readers and search engines understand your site, including titles, descriptions, headings, metadata, content clarity, and indexing readiness.",
  },
  TECHNICAL_HEALTH: {
    title: "Technical Health",
    description:
      "This section inspects technical issues that may affect access, security, speed, and reliability, including HTTPS, crawlability, page errors, redirects, missing assets, and site structure.",
  },
  SITE_USABILITY: {
    title: "Site Usability",
    description:
      "This section checks how easy your website is to browse, including menu structure, page organization, broken paths, readability, internal links, and overall visitor flow.",
  },
};
