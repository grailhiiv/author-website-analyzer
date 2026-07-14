import { PageType } from "@/generated/prisma/client";

import * as cheerio from "cheerio";
import type { Element } from "domhandler";

export const CRAWLER_EXTRACTION_VERSION = "1.4.0";

const MAX_IMAGE_CANDIDATE_SOURCES = 12;

const AUTHOR_PAGE_PATTERNS: Array<{ pageType: PageType; patterns: RegExp[] }> =
  [
    {
      pageType: PageType.ABOUT,
      patterns: [
        /^\/about\/?$/,
        /^\/about-me\/?$/,
        /^\/author\/?$/,
        /^\/bio\/?$/,
        /^\/(?:[^/]+-)*(?:about|author|bio)(?:-[^/]+)*\/?$/,
      ],
    },
    {
      pageType: PageType.BOOKS,
      patterns: [
        /^\/(?:books?|my-books|novels?|series|works|bibliography|titles)(?:\/[^/]+)*\/?$/,
        /^\/(?:published-works|writing)\/?$/,
        /^\/(?:[^/]+-)*(?:series|saga|trilogy)\/?$/,
      ],
    },
    {
      pageType: PageType.CONTACT,
      patterns: [
        /^\/contact\/?$/,
        /^\/contact-me\/?$/,
        /^\/contact-us\/?$/,
        /^\/get-in-touch\/?$/,
      ],
    },
    {
      pageType: PageType.NEWSLETTER,
      patterns: [
        /^\/newsletter\/?$/,
        /^\/subscribe\/?$/,
        /^\/reader-list\/?$/,
        /^\/sign-up\/?$/,
      ],
    },
    {
      pageType: PageType.BLOG,
      patterns: [/^\/blog\/?$/, /^\/news\/?$/, /^\/articles\/?$/],
    },
    {
      pageType: PageType.MEDIA_KIT,
      patterns: [
        /^\/media\/?$/,
        /^\/press\/?$/,
        /^\/press-kit\/?$/,
        /^\/media-kit\/?$/,
      ],
    },
    {
      pageType: PageType.EVENTS,
      patterns: [/^\/events\/?$/, /^\/appearances\/?$/, /^\/speaking\/?$/],
    },
  ];

const CTA_TEXT_PATTERN =
  /\b(buy|order|pre-?order|subscribe|newsletter|join|sign up|get updates|download|contact|book me|read more|learn more|start|request|schedule)\b/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SOCIAL_HOST_PATTERNS = [
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "youtube.com",
  "youtu.be",
  "goodreads.com",
  "threads.net",
  "bsky.app",
  "pinterest.com",
];

const RETAILER_HOST_PATTERNS = [
  "amazon.",
  "bookshop.org",
  "barnesandnoble.com",
  "bn.com",
  "booksamillion.com",
  "apple.com",
  "books.apple.com",
  "kobo.com",
  "indiebound.org",
  "audible.com",
  "target.com",
  "walmart.com",
];

export type ExtractedLink = {
  href: string;
  text: string;
  rel: string | null;
};

export type ExtractedImage = {
  src: string;
  alt: string | null;
  width: string | null;
  height: string | null;
  sourceAttribute:
    | "src"
    | "srcset"
    | "data-src"
    | "data-srcset"
    | "data-lazy-src"
    | "data-lazy-srcset"
    | "data-original"
    | "picture-source";
  candidateSources: string[];
};

export type ExtractedFormField = {
  tag: string;
  type: string | null;
  name: string | null;
  label: string | null;
  placeholder: string | null;
  required: boolean;
};

export type ExtractedForm = {
  action: string | null;
  method: string;
  scope?: "main" | "navigation" | "footer";
  fields: ExtractedFormField[];
  buttons: string[];
};

export type ExtractedCta = {
  type: "link" | "button";
  text: string;
  href: string | null;
};

export type ExtractedPageData = {
  url: string;
  pageType: PageType;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h1Count: number;
  bodyText: string;
  headings: {
    h2: string[];
    h3: string[];
  };
  wordCount: number;
  links: {
    internal: ExtractedLink[];
    external: ExtractedLink[];
    socialProfiles: ExtractedLink[];
    retailerLinks: ExtractedLink[];
    ctas: ExtractedCta[];
    emails: string[];
  };
  images: ExtractedImage[];
  forms: ExtractedForm[];
  jsonLd: unknown[];
  semantics: {
    article: boolean;
  };
  seo: {
    canonicalUrl: string | null;
    robots: string | null;
  };
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function safeHttpUrl(value: string | undefined, baseUrl: string) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value, baseUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function getText($: cheerio.CheerioAPI, selector: string) {
  const text = normalizeWhitespace($(selector).first().text());
  return text.length > 0 ? text : null;
}

function getMetaDescription($: cheerio.CheerioAPI) {
  const description = normalizeWhitespace(
    $("meta[name='description' i]").first().attr("content") ?? "",
  );

  return description.length > 0 ? description : null;
}

function isSameSite(url: string, siteOrigin: string) {
  const current = new URL(url);
  const site = new URL(siteOrigin);

  return current.hostname.toLowerCase() === site.hostname.toLowerCase();
}

function isHostMatch(href: string, hostPatterns: string[]) {
  const hostname = new URL(href).hostname.toLowerCase();
  return hostPatterns.some((pattern) => hostname.includes(pattern));
}

function decodeCloudflareEmail(encoded: string | undefined) {
  const value = encoded?.trim() ?? "";

  if (value.length < 4 || value.length % 2 !== 0 || !/^[\da-f]+$/i.test(value)) {
    return null;
  }

  const key = Number.parseInt(value.slice(0, 2), 16);
  let decoded = "";

  for (let index = 2; index < value.length; index += 2) {
    decoded += String.fromCharCode(
      Number.parseInt(value.slice(index, index + 2), 16) ^ key,
    );
  }

  const email = decoded.trim().toLowerCase();
  return !/[\x00-\x1f\x7f]/.test(email) && EMAIL_PATTERN.test(email)
    ? email
    : null;
}

function extractLinks(
  $: cheerio.CheerioAPI,
  pageUrl: string,
  siteOrigin: string,
) {
  const internal = new Map<string, ExtractedLink>();
  const external = new Map<string, ExtractedLink>();
  const socialProfiles = new Map<string, ExtractedLink>();
  const retailerLinks = new Map<string, ExtractedLink>();
  const emails = new Set<string>();
  const ctas: ExtractedCta[] = [];

  $("[data-cfemail]")
    .filter((_, element) => $(element).closest("a[href]").length === 0)
    .each((_, element) => {
      const email = decodeCloudflareEmail($(element).attr("data-cfemail"));

      if (email) {
        emails.add(email);
      }
    });

  $("a[href]").each((_, element) => {
    const rawHref = $(element).attr("href") ?? "";
    const rawHrefLower = rawHref.toLowerCase();

    if (rawHrefLower.startsWith("mailto:")) {
      const email = rawHref
        .replace(/^mailto:/i, "")
        .split("?")[0]
        .trim()
        .toLowerCase();

      if (EMAIL_PATTERN.test(email)) {
        emails.add(email);
      }

      return;
    }

    const href = safeHttpUrl(rawHref, pageUrl);

    if (href) {
      const protectedEmailUrl = new URL(href);

      if (protectedEmailUrl.pathname === "/cdn-cgi/l/email-protection") {
        const encodedAttributes = [
          $(element).attr("data-cfemail"),
          ...$(element)
            .find("[data-cfemail]")
            .map((_, protectedElement) =>
              $(protectedElement).attr("data-cfemail"),
            )
            .get(),
        ];
        const attributeEmail = encodedAttributes
          .map(decodeCloudflareEmail)
          .find((email): email is string => email !== null);
        const fragmentEmail = decodeCloudflareEmail(
          new URL(rawHref, pageUrl).hash.slice(1),
        );
        const email = attributeEmail ?? fragmentEmail;

        if (email) {
          emails.add(email);
        }

        return;
      }
    }

    if (!href) {
      return;
    }

    const link: ExtractedLink = {
      href,
      text: normalizeWhitespace($(element).text()),
      rel: $(element).attr("rel") ?? null,
    };

    if (isSameSite(href, siteOrigin)) {
      internal.set(href, link);
    } else {
      external.set(href, link);
    }

    if (isHostMatch(href, SOCIAL_HOST_PATTERNS)) {
      socialProfiles.set(href, link);
    }

    if (isHostMatch(href, RETAILER_HOST_PATTERNS)) {
      retailerLinks.set(href, link);
    }

    const ctaText = normalizeWhitespace(
      [
        link.text,
        $(element).attr("aria-label") ?? "",
        $(element).attr("title") ?? "",
        $(element).attr("class") ?? "",
      ].join(" "),
    );

    if (CTA_TEXT_PATTERN.test(ctaText)) {
      ctas.push({
        type: "link",
        text:
          link.text || normalizeWhitespace($(element).attr("aria-label") ?? ""),
        href,
      });
    }
  });

  $("iframe[src]").each((_, element) => {
    const href = safeHttpUrl($(element).attr("src"), pageUrl);

    if (!href || isSameSite(href, siteOrigin)) {
      return;
    }

    external.set(href, {
      href,
      text: normalizeWhitespace(
        $(element).attr("title") ?? $(element).attr("aria-label") ?? "",
      ),
      rel: null,
    });
  });

  $("button, input[type='button'], input[type='submit']").each((_, element) => {
    const text = normalizeWhitespace(
      $(element).text() ||
        $(element).attr("value") ||
        $(element).attr("aria-label") ||
        "",
    );

    if (text && CTA_TEXT_PATTERN.test(text)) {
      ctas.push({
        type: "button",
        text,
        href: null,
      });
    }
  });

  return {
    internal: Array.from(internal.values()),
    external: Array.from(external.values()),
    socialProfiles: Array.from(socialProfiles.values()),
    retailerLinks: Array.from(retailerLinks.values()),
    ctas,
    emails: Array.from(emails),
  };
}

function extractImages($: cheerio.CheerioAPI, pageUrl: string) {
  const images: ExtractedImage[] = [];

  type ImageSource = {
    url: string;
    attribute: ExtractedImage["sourceAttribute"];
    rank: number;
  };

  const parseSrcset = (
    value: string | undefined,
    attribute: ExtractedImage["sourceAttribute"],
  ) =>
    (value ?? "")
      .split(",")
      .map((candidate, index): ImageSource | null => {
        const parts = candidate.trim().split(/\s+/);
        const url = safeHttpUrl(parts[0], pageUrl);

        if (!url) {
          return null;
        }

        const descriptor = parts[1] ?? "";
        const width = descriptor.match(/^(\d+(?:\.\d+)?)w$/i);
        const density = descriptor.match(/^(\d+(?:\.\d+)?)x$/i);
        const rank = width
          ? Number(width[1]) * 100
          : density
            ? Number(density[1]) * 1_000
            : index + 1;

        return { url, attribute, rank };
      })
      .filter((source): source is ImageSource => source !== null);

  const isPlaceholder = (value: string | undefined) =>
    !value ||
    /^(?:data:|about:blank)/i.test(value.trim()) ||
    /(?:transparent|spacer|blank)(?:[-_.]|$)/i.test(value);

  $("img").each((_, element) => {
    const image = $(element);
    const sources: ImageSource[] = [];

    sources.push(
      ...parseSrcset(image.attr("data-srcset"), "data-srcset"),
      ...parseSrcset(image.attr("data-lazy-srcset"), "data-lazy-srcset"),
      ...parseSrcset(image.attr("srcset"), "srcset"),
    );

    image
      .closest("picture")
      .find("source")
      .each((__, source) => {
        sources.push(
          ...parseSrcset(
            $(source).attr("data-srcset") ?? $(source).attr("srcset"),
            "picture-source",
          ),
        );
      });

    const directSources: Array<{
      attribute: ExtractedImage["sourceAttribute"];
      value: string | undefined;
    }> = [
      { attribute: "data-src", value: image.attr("data-src") },
      { attribute: "data-lazy-src", value: image.attr("data-lazy-src") },
      { attribute: "data-original", value: image.attr("data-original") },
      { attribute: "src", value: image.attr("src") },
    ];

    for (const source of directSources) {
      if (isPlaceholder(source.value)) {
        continue;
      }

      const url = safeHttpUrl(source.value, pageUrl);

      if (url) {
        sources.push({ url, attribute: source.attribute, rank: 0 });
      }
    }

    const uniqueSources = Array.from(
      new Map(sources.map((source) => [source.url, source])).values(),
    );
    const rankedSources = [...uniqueSources].sort((a, b) => b.rank - a.rank);
    const preferred = rankedSources[0];

    if (!preferred) {
      return;
    }

    images.push({
      src: preferred.url,
      alt: normalizeWhitespace(image.attr("alt") ?? "") || null,
      width: image.attr("width") ?? null,
      height: image.attr("height") ?? null,
      sourceAttribute: preferred.attribute,
      candidateSources: rankedSources
        .slice(0, MAX_IMAGE_CANDIDATE_SOURCES)
        .map((source) => source.url),
    });
  });

  return images;
}

function getFieldLabel($: cheerio.CheerioAPI, element: Element) {
  const id = $(element).attr("id");

  if (id) {
    const explicitLabel = normalizeWhitespace(
      $("label")
        .filter((_, label) => $(label).attr("for") === id)
        .first()
        .text(),
    );

    if (explicitLabel) {
      return explicitLabel;
    }
  }

  const wrappedLabel = normalizeWhitespace($(element).closest("label").text());
  return wrappedLabel || null;
}

function extractForms($: cheerio.CheerioAPI, pageUrl: string) {
  const forms: ExtractedForm[] = [];

  $("form").each((_, form) => {
    const fields: ExtractedFormField[] = [];

    $(form)
      .find("input, select, textarea")
      .each((_, field) => {
        fields.push({
          tag: field.tagName.toLowerCase(),
          type: $(field).attr("type") ?? null,
          name: $(field).attr("name") ?? null,
          label: getFieldLabel($, field),
          placeholder: $(field).attr("placeholder") ?? null,
          required: $(field).attr("required") !== undefined,
        });
      });

    forms.push({
      action: safeHttpUrl($(form).attr("action"), pageUrl),
      method: ($(form).attr("method") ?? "get").toLowerCase(),
      scope:
        $(form).closest("footer, [role='contentinfo']").length > 0
          ? "footer"
          : $(form).closest("header, nav, [role='navigation']").length > 0
            ? "navigation"
            : "main",
      fields,
      buttons: $(form)
        .find("button, input[type='button'], input[type='submit']")
        .map((_, button) =>
          normalizeWhitespace(
            $(button).text() ||
              $(button).attr("value") ||
              $(button).attr("aria-label") ||
              "",
          ),
        )
        .get()
        .filter(Boolean),
    });
  });

  return forms;
}

function extractJsonLd($: cheerio.CheerioAPI) {
  return $("script[type='application/ld+json']")
    .map((_, element) => {
      const raw = normalizeWhitespace($(element).contents().text());

      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw);
      } catch {
        return {
          parseError: true,
          raw: raw.slice(0, 1000),
        };
      }
    })
    .get()
    .filter(Boolean);
}

function extractBodyText($: cheerio.CheerioAPI) {
  const body = $("body").clone();
  body.find("script, style, noscript, svg").remove();

  return normalizeWhitespace(body.text()).slice(0, 8000);
}

function extractSeo($: cheerio.CheerioAPI, pageUrl: string) {
  const robots = normalizeWhitespace(
    $("meta[name='robots' i]").first().attr("content") ?? "",
  );

  return {
    canonicalUrl: safeHttpUrl(
      $("link[rel='canonical' i]").first().attr("href"),
      pageUrl,
    ),
    robots: robots || null,
  };
}

function countWords(text: string) {
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu);

  return words?.length ?? 0;
}

export function detectPageType(url: string) {
  const parsed = new URL(url);
  const path =
    parsed.pathname
      .toLowerCase()
      .replace(/\.html?$/i, "")
      .replace(/\/+$/, "") || "/";

  if (path === "/") {
    return PageType.HOME;
  }

  for (const { pageType, patterns } of AUTHOR_PAGE_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(path))) {
      return pageType;
    }
  }

  return PageType.UNKNOWN;
}

export function extractPageData(
  html: string,
  pageUrl: string,
  siteOrigin = new URL(pageUrl).origin,
): ExtractedPageData {
  const $ = cheerio.load(html);
  const title = normalizeWhitespace($("title").first().text());
  const bodyText = extractBodyText($);
  const semanticArticle = $("article")
    .toArray()
    .some((element) => {
      const className = $(element).attr("class") ?? "";
      return (
        /(?:^|\s)type-post(?:\s|$)/i.test(className) ||
        $(element).find("time[datetime]").length > 0
      );
    });

  return {
    url: pageUrl,
    pageType: detectPageType(pageUrl),
    title: title || null,
    metaDescription: getMetaDescription($),
    h1: getText($, "h1"),
    h1Count: $("h1").length,
    bodyText,
    headings: {
      h2: $("h2")
        .filter(
          (_, element) =>
            $(element).closest(
              "header, nav, footer, [role='navigation'], [role='contentinfo']",
            ).length === 0,
        )
        .map((_, element) => normalizeWhitespace($(element).text()))
        .get()
        .filter(Boolean),
      h3: $("h3")
        .filter(
          (_, element) =>
            $(element).closest(
              "header, nav, footer, [role='navigation'], [role='contentinfo']",
            ).length === 0,
        )
        .map((_, element) => normalizeWhitespace($(element).text()))
        .get()
        .filter(Boolean),
    },
    wordCount: countWords(bodyText),
    links: extractLinks($, pageUrl, siteOrigin),
    images: extractImages($, pageUrl),
    forms: extractForms($, pageUrl),
    jsonLd: extractJsonLd($),
    semantics: {
      article: semanticArticle,
    },
    seo: extractSeo($, pageUrl),
  };
}

export const crawlExtractionTestExports = {
  normalizeWhitespace,
  safeHttpUrl,
};
