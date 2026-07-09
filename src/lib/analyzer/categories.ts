export type ScoreCategoryId =
  | "brand_clarity"
  | "book_promotion"
  | "reader_conversion"
  | "seo_discoverability"
  | "mobile_accessibility"
  | "performance_health"
  | "trust_credibility"
  | "maintenance_risk";

export type ScoreCategory = {
  id: ScoreCategoryId;
  label: string;
  description: string;
  sampleScore: number;
};

export const scoreCategories: ScoreCategory[] = [
  {
    id: "brand_clarity",
    label: "First Impression and Author Brand Clarity",
    description:
      "Whether the homepage quickly communicates who the author is, what they write, and why readers should care.",
    sampleScore: 84,
  },
  {
    id: "book_promotion",
    label: "Book Promotion and Sales Readiness",
    description:
      "Whether books, series, buy links, and reader paths are easy to find and act on.",
    sampleScore: 72,
  },
  {
    id: "reader_conversion",
    label: "Reader Conversion and Newsletter Growth",
    description:
      "Whether the site gives readers a clear reason and simple way to subscribe or stay connected.",
    sampleScore: 68,
  },
  {
    id: "seo_discoverability",
    label: "SEO Discoverability",
    description:
      "Whether key pages have the basics that help search engines understand the author and books.",
    sampleScore: 80,
  },
  {
    id: "mobile_accessibility",
    label: "Mobile Experience and Accessibility",
    description:
      "Whether the site remains readable, usable, and accessible on smaller screens.",
    sampleScore: 82,
  },
  {
    id: "performance_health",
    label: "Performance and Technical Health",
    description:
      "Whether the site loads reliably and avoids technical issues that can hurt visitor experience.",
    sampleScore: 76,
  },
  {
    id: "trust_credibility",
    label: "Trust and Credibility",
    description:
      "Whether the site includes signals such as author bio, contact paths, press proof, and current content.",
    sampleScore: 74,
  },
  {
    id: "maintenance_risk",
    label: "Maintenance and Website Risk",
    description:
      "Whether the site shows avoidable risks like broken links, outdated platform signals, or missing essentials.",
    sampleScore: 88,
  },
];
