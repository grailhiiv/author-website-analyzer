import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  FindingSeverity,
  PageType,
  PrismaClient,
  ReportCategory,
  ReportStatus,
  SalesLeadStatus,
} from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.report.upsert({
    where: {
      id: "sample-author-report",
    },
    update: {},
    create: {
      id: "sample-author-report",
      url: "https://example-author.com",
      normalizedUrl: "https://example-author.com/",
      domain: "example-author.com",
      status: ReportStatus.COMPLETE,
      overallScore: 78,
      summary:
        "The site gives readers a professional first impression, but book discovery and newsletter signup paths should be clearer.",
      completedAt: new Date("2026-07-08T00:00:00.000Z"),
      lead: {
        create: {
          fullName: "Sample Author",
          email: "author@example.com",
          websiteUrl: "https://example-author.com",
          consent: true,
        },
      },
      pagesScanned: {
        create: [
          {
            url: "https://example-author.com/",
            pageType: PageType.HOME,
            statusCode: 200,
            title: "Sample Author | Fiction Writer",
            metaDescription:
              "Official website for Sample Author, fiction writer and newsletter host.",
            h1: "Stories for thoughtful readers",
            headingsJson: [
              "Stories for thoughtful readers",
              "Featured book",
              "Join the newsletter",
            ],
            linksJson: [
              { href: "/books", text: "Books" },
              { href: "/newsletter", text: "Newsletter" },
            ],
            imagesJson: [{ src: "/author-photo.jpg", alt: "Sample Author" }],
            formsJson: [{ type: "newsletter", fields: ["email"] }],
            wordCount: 620,
            screenshotUrl: null,
          },
          {
            url: "https://example-author.com/books",
            pageType: PageType.BOOKS,
            statusCode: 200,
            title: "Books | Sample Author",
            metaDescription: "Browse books by Sample Author.",
            h1: "Books",
            headingsJson: ["Books", "Series order"],
            linksJson: [{ href: "https://bookshop.example", text: "Buy" }],
            imagesJson: [{ src: "/book-cover.jpg", alt: "Book cover" }],
            formsJson: [],
            wordCount: 430,
            screenshotUrl: null,
          },
        ],
      },
      scores: {
        create: [
          {
            category: ReportCategory.BRAND_CLARITY,
            score: 84,
            maxScore: 100,
            summary:
              "The homepage introduces the author clearly and gives readers a quick sense of genre.",
          },
          {
            category: ReportCategory.BOOK_VISIBILITY,
            score: 72,
            maxScore: 100,
            summary:
              "Books are present, but the buying path could be more visible from the homepage.",
          },
          {
            category: ReportCategory.READER_ENGAGEMENT,
            score: 68,
            maxScore: 100,
            summary:
              "The newsletter form exists, but the value for readers needs stronger copy.",
          },
          {
            category: ReportCategory.SEARCH_VISIBILITY,
            score: 80,
            maxScore: 100,
            summary:
              "Core metadata is present on key pages and can be expanded later.",
          },
          {
            category: ReportCategory.MOBILE_PERFORMANCE,
            score: 82,
            maxScore: 100,
            summary:
              "The site appears usable on mobile with no major placeholder issues in this sample.",
          },
          {
            category: ReportCategory.TECHNICAL_HEALTH,
            score: 76,
            maxScore: 100,
            summary:
              "Performance is acceptable, with room to improve image handling.",
          },
          {
            category: ReportCategory.AUTHOR_TRUST,
            score: 74,
            maxScore: 100,
            summary:
              "Basic trust signals are present, but reviews and press proof should be easier to find.",
          },
          {
            category: ReportCategory.SITE_USABILITY,
            score: 88,
            maxScore: 100,
            summary:
              "The sample site shows good site usability based on available placeholder evidence.",
          },
        ],
      },
      findings: {
        create: [
          {
            category: ReportCategory.BOOK_VISIBILITY,
            severity: FindingSeverity.HIGH,
            title: "Featured book path is too quiet",
            finding:
              "The book page exists, but the homepage does not make the featured book path strong enough.",
            recommendation:
              "Add a clear featured book section above the fold with one primary buying path.",
            priority: 1,
          },
          {
            category: ReportCategory.READER_ENGAGEMENT,
            severity: FindingSeverity.HIGH,
            title: "Newsletter value needs clearer reader benefit",
            finding:
              "The newsletter form is present, but the signup copy does not explain what readers receive.",
            recommendation:
              "Add a short promise such as updates, bonus chapters, reading notes, or launch alerts.",
            priority: 2,
          },
          {
            category: ReportCategory.AUTHOR_TRUST,
            severity: FindingSeverity.MEDIUM,
            title: "Trust proof could be easier to find",
            finding:
              "The sample scan found an author bio, but not strong review, media, or event proof.",
            recommendation:
              "Add selected reviews, press mentions, awards, or event credentials near the bio and books.",
            priority: 3,
          },
        ],
      },
      technicalAudit: {
        create: {
          mobilePerformance: 76,
          desktopPerformance: 90,
          mobileAccessibility: 88,
          desktopAccessibility: 94,
          mobileSeo: 91,
          desktopSeo: 96,
          mobileBestPractices: 85,
          desktopBestPractices: 92,
          lighthouseJson: {
            source: "sample",
            note: "Placeholder data for UI development before PageSpeed integration.",
          },
        },
      },
      salesNote: {
        create: {
          manualNote:
            "Sample internal note: lead is a good fit for clearer newsletter and featured book positioning.",
          leadStatus: SalesLeadStatus.NEW,
          serviceFit: "Newsletter setup",
          priority: 3,
        },
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
