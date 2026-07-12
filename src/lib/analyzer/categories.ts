export type ScoreCategoryId =
  | "brand_clarity"
  | "book_visibility"
  | "reader_engagement"
  | "search_visibility"
  | "mobile_performance"
  | "technical_health"
  | "author_trust"
  | "site_usability";

export type ScoreCategory = {
  id: ScoreCategoryId;
  label: string;
  description: string;
  sampleScore: number;
};

export const scoreCategories: ScoreCategory[] = [
  {
    id: "brand_clarity",
    label: "Brand Clarity",
    description:
      "This section evaluates how quickly visitors understand your author identity, genre, homepage message, and overall brand positioning when they first land on your website.",
    sampleScore: 84,
  },
  {
    id: "book_visibility",
    label: "Book Visibility",
    description:
      "This section reviews how clearly your books are presented, including book pages, purchase links, cover visibility, descriptions, series order, and paths to buy or read.",
    sampleScore: 72,
  },
  {
    id: "reader_engagement",
    label: "Reader Engagement",
    description:
      "This section measures how well your website encourages reader action through newsletter signups, reader magnets, contact options, social links, and meaningful calls to action.",
    sampleScore: 68,
  },
  {
    id: "search_visibility",
    label: "Search Visibility",
    description:
      "This section evaluates basic SEO signals that help readers and search engines understand your site, including titles, descriptions, headings, metadata, content clarity, and indexing readiness.",
    sampleScore: 80,
  },
  {
    id: "mobile_performance",
    label: "Mobile Performance",
    description:
      "This section analyzes how your website performs on mobile devices, reviewing responsive layout, loading behavior, visual stability, button accessibility, and usability across smaller screens.",
    sampleScore: 82,
  },
  {
    id: "technical_health",
    label: "Technical Health",
    description:
      "This section inspects technical issues that may affect access, security, speed, and reliability, including HTTPS, crawlability, page errors, redirects, missing assets, and site structure.",
    sampleScore: 76,
  },
  {
    id: "author_trust",
    label: "Author Trust",
    description:
      "This section reviews trust signals that make your author platform feel credible, including professional presentation, biography depth, testimonials, press mentions, policies, and contact transparency.",
    sampleScore: 74,
  },
  {
    id: "site_usability",
    label: "Site Usability",
    description:
      "This section checks how easy your website is to browse, including menu structure, page organization, broken paths, readability, internal links, and overall visitor flow.",
    sampleScore: 88,
  },
];
