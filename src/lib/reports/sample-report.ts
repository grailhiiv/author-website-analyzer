import type { VariantProps } from "class-variance-authority";

import { badgeVariants } from "@/components/ui/badge";
import { scoreCategories, type ScoreCategoryId } from "@/lib/analyzer/categories";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const priorityByCategory: Record<
  ScoreCategoryId,
  { priority: string; priorityVariant: BadgeVariant; score: number }
> = {
  brand_clarity: {
    priority: "Medium",
    priorityVariant: "secondary",
    score: 84,
  },
  book_promotion: {
    priority: "High",
    priorityVariant: "destructive",
    score: 72,
  },
  reader_conversion: {
    priority: "High",
    priorityVariant: "destructive",
    score: 68,
  },
  seo_discoverability: {
    priority: "Medium",
    priorityVariant: "secondary",
    score: 80,
  },
  mobile_accessibility: {
    priority: "Medium",
    priorityVariant: "secondary",
    score: 82,
  },
  performance_health: {
    priority: "Medium",
    priorityVariant: "secondary",
    score: 76,
  },
  trust_credibility: {
    priority: "Medium",
    priorityVariant: "secondary",
    score: 74,
  },
  maintenance_risk: {
    priority: "Low",
    priorityVariant: "outline",
    score: 88,
  },
};

export const sampleReport = {
  status: "Sample",
  authorName: "Mara Ellison",
  authorType: "Fiction Author",
  websiteGoal: "Grow newsletter",
  websiteUrl: "https://maraellisonbooks.example",
  overallScore: 78,
  reportDate: "July 8, 2026",
  categories: scoreCategories.map((category) => ({
    ...category,
    ...priorityByCategory[category.id],
  })),
  executiveSummary:
    "Mara's website gives readers a clear sense of genre and has a solid professional foundation. The biggest opportunities are to make the featured book path stronger, explain the newsletter benefit before asking for an email, and bring trust signals closer to the homepage.",
  findings: [
    "The homepage needs a stronger path from author introduction to featured books.",
    "Newsletter signup should explain what readers receive before asking for an email.",
    "Trust signals such as media mentions, reviews, or a current author bio should be easier to find.",
  ],
  quickWins: [
    "Add a featured book section above the fold with one clear buying path.",
    "Place a newsletter signup near the homepage intro and book pages.",
    "Add a short, current author bio and contact path in the main navigation.",
  ],
  detailedFindings: [
    {
      category: "Book Promotion and Sales Readiness",
      severity: "High",
      title: "Featured book path could be clearer",
      finding:
        "The homepage mentions the latest novel, but the cover, description, and buying options are not grouped into one easy reader path.",
      recommendation:
        "Add a featured book block with the cover, a short hook, review proof, and one primary buy button that leads to a retailer or book landing page.",
    },
    {
      category: "Reader Conversion and Newsletter Growth",
      severity: "High",
      title: "Newsletter value is under-explained",
      finding:
        "The site includes an email signup, but it does not clearly explain what readers receive for joining.",
      recommendation:
        "Add a simple reader benefit, such as release updates, bonus scenes, or a free first chapter, near the signup form.",
    },
    {
      category: "Trust and Credibility",
      severity: "Medium",
      title: "Trust signals are present but scattered",
      finding:
        "The author bio and review quotes exist on separate pages, but they are not easy to notice from the homepage.",
      recommendation:
        "Bring one short bio line, one review quote, and a clear contact or media link into the main homepage journey.",
    },
  ],
  suggestedHomepageImprovement:
    "Open with the author name, genre promise, featured book, and a reader action. A stronger first screen could say what Mara writes, show the latest cover, and give readers one clear next step.",
  suggestedCTAImprovement:
    "Use a reader-focused CTA such as 'Get the free opening chapter' or 'Start with the latest mystery' instead of a generic 'Learn more' button.",
  suggestedSeoTitle:
    "Mara Ellison | Contemporary Mystery Author",
  suggestedMetaDescription:
    "Explore contemporary mystery novels by Mara Ellison, read about the latest book, and join the reader list for release news and bonus scenes.",
  finalRecommendation:
    "This site does not need to start over. It would benefit most from a clearer homepage reader journey, stronger book promotion blocks, and a more compelling newsletter signup path.",
  technicalSnapshot: {
    mobilePerformance: 76,
    desktopPerformance: 88,
    mobileAccessibility: 84,
    desktopAccessibility: 92,
    pagesScanned: 5,
    formsFound: 1,
    retailerLinksFound: 2,
  },
};
