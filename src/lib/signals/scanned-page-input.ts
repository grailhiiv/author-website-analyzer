import type { ExtractedPageData } from "@/lib/crawler/extract";
import type { ScannedPageSignalInput } from "@/lib/signals/author-website-signals";

export function extractedPageToScannedPageSignalInput(
  extracted: ExtractedPageData,
  statusCode: number | null,
): ScannedPageSignalInput {
  return {
    url: extracted.url,
    pageType: extracted.pageType,
    statusCode,
    title: extracted.title,
    metaDescription: extracted.metaDescription,
    h1: extracted.h1,
    headingsJson: {
      h1Count: extracted.h1Count,
      h2: extracted.headings.h2,
      h3: extracted.headings.h3,
      bodyText: extracted.bodyText,
      jsonLd: extracted.jsonLd,
      canonicalUrl: extracted.seo.canonicalUrl,
      robots: extracted.seo.robots,
    },
    linksJson: extracted.links,
    imagesJson: extracted.images,
    formsJson: extracted.forms,
    wordCount: extracted.wordCount,
  };
}
