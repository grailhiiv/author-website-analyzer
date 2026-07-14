import {
  classifyPageRole,
  pageSupportsRole,
  type EvidenceObservation,
  type PageRole,
  type PageRoleClassification,
} from "./page-role-classifier";

export type SignalDetection = {
  detected: boolean;
  evidence: string[];
};

export type IndexabilitySignal = SignalDetection & {
  indexable: boolean | null;
};

export type RetailerKey =
  | "amazon"
  | "kindle"
  | "kobo"
  | "appleBooks"
  | "barnesAndNoble"
  | "bookshop"
  | "googlePlayBooks"
  | "goodreads"
  | "publisherWebsites";

export type ScannedPageSignalInput = {
  url: string;
  pageType?: string | null;
  statusCode?: number | null;
  title?: string | null;
  metaDescription?: string | null;
  h1?: string | null;
  headingsJson?: unknown;
  linksJson?: unknown;
  imagesJson?: unknown;
  formsJson?: unknown;
  wordCount?: number | null;
  contentText?: string | null;
};

export type AuthorWebsiteSignals = {
  pagesAnalyzed: number;
  pageRoles?: PageRoleClassification[];
  observations?: EvidenceObservation[];
  authorBrand: {
    authorNameVisible: SignalDetection;
    genreOrCategoryMentioned: SignalDetection;
    clearHomepageHeadline: SignalDetection;
    aboutSectionOrPage: SignalDetection;
  };
  bookPromotion: {
    bookCoverImages: SignalDetection;
    bookTitles: SignalDetection;
    bookDescriptionOrBlurb: SignalDetection;
    buyLinks: SignalDetection;
    retailerLinks: SignalDetection;
    featuredBookSection: SignalDetection;
    seriesPage: SignalDetection;
    reviewsOrPraise: SignalDetection;
  };
  newsletter: {
    newsletterSignupForm: SignalDetection;
    subscribeForm: SignalDetection;
    emailInput: SignalDetection;
    readerMagnetPhrases: SignalDetection;
    freeChapter: SignalDetection;
    bonusScene: SignalDetection;
    freeBook: SignalDetection;
    updatesSignup: SignalDetection;
  };
  seo: {
    titleTagExists: SignalDetection;
    metaDescriptionExists: SignalDetection;
    h1Exists: SignalDetection;
    multipleH1Issue: SignalDetection;
    missingAltText: SignalDetection;
    indexabilitySignals: IndexabilitySignal;
    canonicalUrl: SignalDetection;
  };
  trust: {
    authorBio: SignalDetection;
    authorPhoto: SignalDetection;
    contactForm: SignalDetection;
    contactEmail: SignalDetection;
    socialLinks: SignalDetection;
    mediaKit: SignalDetection;
    privacyPolicy: SignalDetection;
  };
  retailers: Record<RetailerKey, SignalDetection>;
  schema: {
    person: SignalDetection;
    book: SignalDetection;
    organization: SignalDetection;
    review: SignalDetection;
    aggregateRating: SignalDetection;
    sameAs: SignalDetection;
  };
};

type LinkLike = {
  href: string;
  text: string;
  rel?: string | null;
};

type ImageLike = {
  src: string;
  alt: string | null;
  width: string | null;
  height: string | null;
};

type FormFieldLike = {
  tag?: string | null;
  type?: string | null;
  name?: string | null;
  label?: string | null;
  placeholder?: string | null;
};

type FormLike = {
  action?: string | null;
  method?: string | null;
  scope?: "main" | "navigation" | "footer";
  fields: FormFieldLike[];
  buttons: string[];
};

type NormalizedPage = {
  url: string;
  pageType: string;
  statusCode: number | null;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h1Count: number | null;
  h2: string[];
  h3: string[];
  links: LinkLike[];
  ctas: Array<{ text: string; href: string | null }>;
  emails: string[];
  images: ImageLike[];
  forms: FormLike[];
  jsonLd: unknown[];
  canonicalUrl: string | null;
  robots: string | null;
  bodyText: string;
  text: string;
  roleClassification: PageRoleClassification | null;
};

const AUTHOR_TERMS =
  /\b(author|writer|novelist|poet|memoirist|essayist|storyteller)\b/i;

const GENRE_TERMS =
  /\b(fantasy|romance|thriller|mystery|science fiction|sci-fi|horror|memoir|nonfiction|non-fiction|children'?s|middle grade|young adult|ya\b|literary fiction|historical fiction|poetry|self-help|business|leadership|christian|inspirational|suspense|cozy|paranormal|urban fantasy)\b/i;

const BOOK_COVER_TERMS = /\b(book cover|cover art|cover image|novel cover)\b/i;
const BOOK_BLURB_TERMS =
  /\b(book description|blurb|synopsis|about the book|back cover|readers will|this novel|this book)\b/i;
const BUY_TERMS = /\b(buy|order|pre-?order|purchase|get the book|shop now)\b/i;
const NON_BOOK_PURCHASE_TERMS =
  /\b(tickets?|events?|workshops?|courses?|classes|memberships?|merch(?:andise)?|donations?|donate|consultations?|services?)\b/i;
const FEATURED_BOOK_TERMS =
  /\b(featured book|latest book|new release|available now|coming soon|debut novel)\b/i;
const SERIES_TERMS = /\b(series|book one|book two|trilogy|saga)\b/i;
const PRAISE_TERMS =
  /\b(review|reviews|praise|testimonials|what readers are saying|star review|award|bestseller|endorsement)\b/i;
const NEWSLETTER_TERMS =
  /\b(newsletter|reader list|mailing list|subscribe|join my list|updates)\b/i;
const NEWSLETTER_SERVICE_TERMS =
  /\b(substack\.com|convertkit\.com|kit\.com|mailchi\.mp|list-manage\.com|mailerlite\.com|beehiiv\.com|buttondown\.email|flodesk\.com|campaignmonitor\.com)\b/i;
const NON_NEWSLETTER_SUBSCRIBE_DESTINATIONS =
  /\b(youtube\.com|youtu\.be|vimeo\.com|twitch\.tv|spotify\.com|podcasts\.apple\.com)\b/i;
const READER_MAGNET_TERMS =
  /\b(reader magnet|free chapter|bonus scene|free book|free novella|free short story|download a sample)\b/i;
const BIO_TERMS =
  /\b(author bio|biography|about the author|meet the author)\b/i;
const PHOTO_TERMS = /\b(author photo|author portrait|headshot|portrait)\b/i;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

function isBookPurchaseAction(value: string) {
  return BUY_TERMS.test(value) && !NON_BOOK_PURCHASE_TERMS.test(value);
}

function isNewsletterLink(link: LinkLike) {
  if (NEWSLETTER_SERVICE_TERMS.test(link.href)) {
    return true;
  }

  if (NON_NEWSLETTER_SUBSCRIBE_DESTINATIONS.test(link.href)) {
    return false;
  }

  return NEWSLETTER_TERMS.test(`${link.text} ${link.href}`);
}

const RETAILERS: Record<RetailerKey, { label: string; patterns: RegExp[] }> = {
  amazon: {
    label: "Amazon",
    patterns: [/\bamazon\./i, /\bamzn\.to\b/i],
  },
  kindle: {
    label: "Kindle",
    patterns: [/\bkindle\b/i, /amazon\..*kindle/i],
  },
  kobo: {
    label: "Kobo",
    patterns: [/\bkobo\.com\b/i],
  },
  appleBooks: {
    label: "Apple Books",
    patterns: [/\bbooks\.apple\.com\b/i, /\bapple books\b/i],
  },
  barnesAndNoble: {
    label: "Barnes & Noble",
    patterns: [
      /\bbarnesandnoble\.com\b/i,
      /\bbn\.com\b/i,
      /\bbarnes & noble\b/i,
    ],
  },
  bookshop: {
    label: "Bookshop",
    patterns: [/\bbookshop\.org\b/i],
  },
  googlePlayBooks: {
    label: "Google Play Books",
    patterns: [
      /\bplay\.google\.com\/store\/books\b/i,
      /\bgoogle play books\b/i,
    ],
  },
  goodreads: {
    label: "Goodreads",
    patterns: [/\bgoodreads\.com\b/i],
  },
  publisherWebsites: {
    label: "Publisher website",
    patterns: [
      /\bpublisher\b/i,
      /\bpenguinrandomhouse\.com\b/i,
      /\bharpercollins\.com\b/i,
      /\bsimonandschuster\.com\b/i,
      /\bhachettebookgroup\.com\b/i,
      /\bmacmillan\.com\b/i,
      /\bscholastic\.com\b/i,
      /\bsourcebooks\.com\b/i,
    ],
  },
};

function compact(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function detection(evidence: string[]): SignalDetection {
  return {
    detected: evidence.length > 0,
    evidence: evidence.slice(0, 5),
  };
}

function firstEvidence(items: string[], pattern: RegExp, label: string) {
  const match = items.find((item) => pattern.test(item));
  return match ? [`${label}: ${match}`] : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown) {
  return typeof value === "string" ? compact(value) : "";
}

function stringArray(value: unknown) {
  return asArray(value).map(asString).filter(Boolean);
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeLinks(value: unknown) {
  const links: LinkLike[] = [];
  const ctas: Array<{ text: string; href: string | null }> = [];
  const emails: string[] = [];
  const record = asRecord(value);

  const addLink = (candidate: unknown) => {
    if (typeof candidate === "string") {
      links.push({ href: candidate, text: "" });
      return;
    }

    const item = asRecord(candidate);

    if (!item) {
      return;
    }

    const href = asString(item.href);
    const text = asString(item.text);

    if (href || text) {
      links.push({
        href,
        text,
        rel: asString(item.rel) || null,
      });
    }
  };

  const addCta = (candidate: unknown) => {
    const item = asRecord(candidate);

    if (!item) {
      return;
    }

    const text = asString(item.text);
    const href = asString(item.href) || null;

    if (text || href) {
      ctas.push({ text, href });
    }
  };

  if (record) {
    for (const key of [
      "internal",
      "external",
      "socialProfiles",
      "retailerLinks",
    ]) {
      asArray(record[key]).forEach(addLink);
    }

    asArray(record.ctas).forEach(addCta);
    stringArray(record.emails).forEach((email) => emails.push(email));
  } else {
    asArray(value).forEach(addLink);
  }

  return { links, ctas, emails };
}

function normalizeImages(value: unknown) {
  return asArray(value)
    .map((candidate) => {
      const item = asRecord(candidate);

      if (!item) {
        return null;
      }

      const src = asString(item.src);

      if (!src) {
        return null;
      }

      return {
        src,
        alt: asString(item.alt) || null,
        width: asString(item.width) || null,
        height: asString(item.height) || null,
      };
    })
    .filter((image): image is ImageLike => Boolean(image));
}

function normalizeForms(value: unknown) {
  const forms: FormLike[] = [];

  for (const candidate of asArray(value)) {
    const item = asRecord(candidate);

    if (!item) {
      continue;
    }

    const fields: FormFieldLike[] = [];

    for (const field of asArray(item.fields)) {
      if (typeof field === "string") {
        fields.push({ name: field });
        continue;
      }

      const fieldRecord = asRecord(field);

      if (!fieldRecord) {
        continue;
      }

      fields.push({
        tag: asString(fieldRecord.tag) || null,
        type: asString(fieldRecord.type) || null,
        name: asString(fieldRecord.name) || null,
        label: asString(fieldRecord.label) || null,
        placeholder: asString(fieldRecord.placeholder) || null,
      });
    }

    forms.push({
      action: asString(item.action) || null,
      method: asString(item.method) || null,
      scope:
        item.scope === "navigation" || item.scope === "footer"
          ? item.scope
          : "main",
      fields,
      buttons: stringArray(item.buttons),
    });
  }

  return forms;
}

function normalizeJsonLd(value: unknown) {
  const record = asRecord(value);

  if (record && Array.isArray(record.jsonLd)) {
    return record.jsonLd;
  }

  return [];
}

function normalizePage(page: ScannedPageSignalInput): NormalizedPage {
  const headings = asRecord(page.headingsJson);
  const legacyHeadings = Array.isArray(page.headingsJson)
    ? stringArray(page.headingsJson)
    : [];
  const linkData = normalizeLinks(page.linksJson);
  const images = normalizeImages(page.imagesJson);
  const forms = normalizeForms(page.formsJson);
  const h2 = headings ? stringArray(headings.h2) : legacyHeadings;
  const h3 = headings ? stringArray(headings.h3) : [];
  const bodyText = (headings && asString(headings.bodyText)) || "";
  const canonicalUrl =
    (headings && asString(headings.canonicalUrl)) ||
    (headings && asString(asRecord(headings.seo)?.canonicalUrl)) ||
    null;
  const robots =
    (headings && asString(headings.robots)) ||
    (headings && asString(asRecord(headings.seo)?.robots)) ||
    null;
  const textParts = [
    page.title,
    page.metaDescription,
    page.h1,
    ...h2,
    ...h3,
    ...linkData.links.flatMap((link) => [link.text, link.href]),
    ...linkData.ctas.flatMap((cta) => [cta.text, cta.href ?? ""]),
    ...linkData.emails,
    ...images.flatMap((image) => [image.alt ?? "", image.src]),
    ...forms.flatMap((form) => [
      form.action ?? "",
      ...form.buttons,
      ...form.fields.flatMap((field) => [
        field.type ?? "",
        field.name ?? "",
        field.label ?? "",
        field.placeholder ?? "",
      ]),
    ]),
    bodyText,
    page.contentText,
  ];

  return {
    url: page.url,
    pageType: page.pageType ?? "UNKNOWN",
    statusCode: page.statusCode ?? null,
    title: compact(page.title),
    metaDescription: compact(page.metaDescription),
    h1: compact(page.h1),
    h1Count: headings ? numberOrNull(headings.h1Count) : null,
    h2,
    h3,
    links: linkData.links,
    ctas: linkData.ctas,
    emails: linkData.emails,
    images,
    forms,
    jsonLd: normalizeJsonLd(page.headingsJson),
    canonicalUrl,
    robots,
    bodyText: compact(bodyText || page.contentText),
    text: compact(textParts.filter(Boolean).join(" ")),
    roleClassification: null,
  };
}

function isPageType(page: NormalizedPage, type: string) {
  return page.pageType.toUpperCase() === type;
}

function supportsPageRole(page: NormalizedPage, role: PageRole) {
  return Boolean(
    page.roleClassification && pageSupportsRole(page.roleClassification, role),
  );
}

function supportsAnyPageRole(page: NormalizedPage, roles: PageRole[]) {
  return roles.some((role) => supportsPageRole(page, role));
}

function linkEvidence(
  pages: NormalizedPage[],
  predicate: (text: string, link: LinkLike) => boolean,
  label: string,
) {
  for (const page of pages) {
    const link = page.links.find((candidate) =>
      predicate(`${candidate.text} ${candidate.href}`, candidate),
    );

    if (link) {
      return [`${label}: ${link.text || link.href}`];
    }
  }

  return [];
}

function hasEmailInput(form: FormLike) {
  return form.fields.some((field) =>
    /\bemail\b/i.test(
      [field.type, field.name, field.label, field.placeholder]
        .filter(Boolean)
        .join(" "),
    ),
  );
}

function formText(form: FormLike) {
  return compact(
    [
      form.action ?? "",
      ...form.buttons,
      ...form.fields.flatMap((field) => [
        field.type ?? "",
        field.name ?? "",
        field.label ?? "",
        field.placeholder ?? "",
      ]),
    ].join(" "),
  );
}

function collectSchemaTypes(
  value: unknown,
  types: Set<string>,
  sameAs: string[],
) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSchemaTypes(item, types, sameAs));
    return;
  }

  const record = asRecord(value);

  if (!record) {
    return;
  }

  const rawType = record["@type"];

  if (typeof rawType === "string") {
    types.add(rawType.toLowerCase());
  } else if (Array.isArray(rawType)) {
    rawType
      .map(asString)
      .filter(Boolean)
      .forEach((type) => {
        types.add(type.toLowerCase());
      });
  }

  if (record.sameAs) {
    const values = Array.isArray(record.sameAs)
      ? stringArray(record.sameAs)
      : [asString(record.sameAs)].filter(Boolean);
    sameAs.push(...values);
  }

  collectSchemaTypes(record["@graph"], types, sameAs);
  collectSchemaTypes(record.aggregateRating, types, sameAs);
  collectSchemaTypes(record.review, types, sameAs);
}

function collectSchemaNames(value: unknown, type: string, names: string[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSchemaNames(item, type, names));
    return;
  }

  const record = asRecord(value);

  if (!record) {
    return;
  }

  const rawType = record["@type"];
  const types = Array.isArray(rawType)
    ? rawType.map(asString)
    : [asString(rawType)];

  if (
    types.some((candidate) => candidate.toLowerCase() === type.toLowerCase()) &&
    asString(record.name)
  ) {
    names.push(asString(record.name));
  }

  collectSchemaNames(record["@graph"], type, names);
}

function schemaDetection(
  schemaTypes: Set<string>,
  type: string,
  label: string,
) {
  return detection(
    schemaTypes.has(type.toLowerCase()) ? [`Schema: ${label}`] : [],
  );
}

function detectRetailers(pages: NormalizedPage[]) {
  const result = {} as Record<RetailerKey, SignalDetection>;

  for (const [key, retailer] of Object.entries(RETAILERS) as Array<
    [RetailerKey, (typeof RETAILERS)[RetailerKey]]
  >) {
    result[key] = detection(
      linkEvidence(
        pages,
        (text) => retailer.patterns.some((pattern) => pattern.test(text)),
        retailer.label,
      ),
    );
  }

  return result;
}

function indexabilitySignal(pages: NormalizedPage[]): IndexabilitySignal {
  const robotsPage = pages.find((page) => page.robots);

  if (robotsPage?.robots) {
    const indexable = !/\bnoindex\b/i.test(robotsPage.robots);

    return {
      detected: true,
      indexable,
      evidence: [`Robots meta: ${robotsPage.robots}`],
    };
  }

  const successfulPage = pages.find((page) => page.statusCode === 200);

  if (successfulPage) {
    return {
      detected: true,
      indexable: null,
      evidence: [`Page returned HTTP ${successfulPage.statusCode}`],
    };
  }

  return {
    detected: false,
    indexable: null,
    evidence: [],
  };
}

function looksLikePersonName(value: string, allowRoleWord = false) {
  const candidate = compact(value).replace(/^[\s:,-]+|[\s:,-]+$/g, "");
  const words = candidate.split(/\s+/);

  if (
    words.length < 2 ||
    words.length > 4 ||
    (!allowRoleWord && AUTHOR_TERMS.test(candidate)) ||
    /\b(home|welcome|books?|newsletter|official|website|latest|new)\b/i.test(
      candidate,
    )
  ) {
    return false;
  }

  return words.every((word) => {
    const letters = word.replace(/[^\p{L}]/gu, "");
    return (
      letters.length > 0 &&
      (letters === letters.toLocaleUpperCase() || /^\p{Lu}/u.test(letters))
    );
  });
}

function likelyAuthorNameEvidence(
  titleH1Content: string,
  allText: string,
  personNames: string[],
) {
  const schemaName = personNames.find(Boolean);

  if (schemaName) {
    return [`Author name: ${schemaName} (Person schema)`];
  }

  const rawHeadingSegments = titleH1Content
    .split(/[|•—–\n]/)
    .map(compact)
    .filter(Boolean);
  const headingSegments = rawHeadingSegments.filter((segment) =>
    looksLikePersonName(segment),
  );

  if (headingSegments[0]) {
    return [`Likely author name: ${headingSegments[0]}`];
  }

  const repeatedName = rawHeadingSegments.find(
    (segment) =>
      looksLikePersonName(segment, true) &&
      rawHeadingSegments.filter(
        (candidate) =>
          candidate.toLocaleLowerCase() === segment.toLocaleLowerCase(),
      ).length >= 2,
  );

  if (repeatedName) {
    return [`Likely author name: ${repeatedName}`];
  }

  const nameWord = "[\\p{Lu}][\\p{L}\\p{M}'’.-]*";
  const rolePattern = new RegExp(
    `\\b(${nameWord}(?:\\s+${nameWord}){1,3})\\s+(?:is|writes?)(?:\\s+as)?[^.!?]{0,60}\\b(author|writer|novelist|poet|memoirist)\\b`,
    "u",
  );
  const roleMatch = allText.match(rolePattern)?.[1];

  return roleMatch ? [`Likely author name from biography: ${roleMatch}`] : [];
}

function looksLikeBookTitle(value: string, personNames: string[]) {
  const candidate = compact(value);
  const wordCount = candidate.split(/\s+/).length;

  return Boolean(
    candidate.length >= 3 &&
    candidate.length <= 100 &&
    wordCount <= 12 &&
    !/^(books?|series|reviews?|praise|welcome|home|about|latest book|featured book|new release)$/i.test(
      candidate,
    ) &&
    !AUTHOR_TERMS.test(candidate) &&
    !personNames.some(
      (name) => name.toLocaleLowerCase() === candidate.toLocaleLowerCase(),
    ),
  );
}

function pageHasBookContext(page: NormalizedPage) {
  return Boolean(
    isPageType(page, "BOOKS") ||
    supportsAnyPageRole(page, ["BOOKS_INDEX", "BOOK_DETAIL", "SERIES"]) ||
    BOOK_BLURB_TERMS.test(page.text) ||
    FEATURED_BOOK_TERMS.test(page.text) ||
    page.ctas.some((cta) =>
      isBookPurchaseAction(`${cta.text} ${cta.href ?? ""}`),
    ) ||
    page.links.some((link) =>
      Object.values(RETAILERS).some((retailer) =>
        retailer.patterns.some((pattern) =>
          pattern.test(`${link.text} ${link.href}`),
        ),
      ),
    ),
  );
}

function detectedBookHeadings(pages: NormalizedPage[], personNames: string[]) {
  return pages.flatMap((page) => {
    if (!pageHasBookContext(page)) {
      return [];
    }

    return [page.h1, ...page.h2, ...page.h3]
      .filter((heading): heading is string => Boolean(heading))
      .filter((heading) => looksLikeBookTitle(heading, personNames))
      .map((heading) => compact(heading));
  });
}

function isLikelyBookCover(
  image: ImageLike,
  page: NormalizedPage,
  bookTitles: string[],
) {
  const imageText = `${image.alt ?? ""} ${image.src}`;

  if (BOOK_COVER_TERMS.test(imageText)) {
    return true;
  }

  if (!pageHasBookContext(page)) {
    return false;
  }

  const normalizedImageText = imageText
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ");
  const matchesTitle = bookTitles.some((title) => {
    const meaningfulWords = title
      .toLocaleLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length >= 4);

    return (
      meaningfulWords.length > 0 &&
      meaningfulWords.every((word) => normalizedImageText.includes(word))
    );
  });
  const width = Number(image.width);
  const height = Number(image.height);
  const portraitRatio =
    width > 0 && height > 0
      ? height / width >= 1.2 && height / width <= 2.2
      : false;

  return matchesTitle || portraitRatio;
}

export function detectAuthorWebsiteSignals(
  scannedPages: ScannedPageSignalInput[],
): AuthorWebsiteSignals {
  const pages = scannedPages
    .map(normalizePage)
    .filter(
      (page) =>
        page.statusCode === null ||
        (page.statusCode >= 200 && page.statusCode < 300),
    )
    .map((page) => ({
      ...page,
      roleClassification: classifyPageRole({
        url: page.url,
        declaredPageType: page.pageType,
        title: page.title,
        h1: page.h1,
        headings: [...page.h2, ...page.h3],
        bodyText: page.bodyText,
        links: page.links,
        images: page.images,
        forms: page.forms,
        jsonLd: page.jsonLd,
      }),
    }));
  const homepage =
    pages.find((page) => supportsPageRole(page, "HOME")) ??
    pages.find((page) => isPageType(page, "HOME")) ??
    pages[0];
  const allText = pages.map((page) => page.text).join(" ");
  const titleH1Content = pages
    .flatMap((page) => [page.title, page.h1])
    .filter(Boolean)
    .join("\n");
  const schemaTypes = new Set<string>();
  const sameAsValues: string[] = [];
  const personNames: string[] = [];
  const bookNames: string[] = [];

  pages
    .flatMap((page) => page.jsonLd)
    .forEach((item) => {
      collectSchemaTypes(item, schemaTypes, sameAsValues);
      collectSchemaNames(item, "Person", personNames);
      collectSchemaNames(item, "Book", bookNames);
    });

  const bookHeadings = detectedBookHeadings(pages, personNames);

  const retailers = detectRetailers(pages);
  const retailerEvidence = Object.values(retailers)
    .filter((retailer) => retailer.detected)
    .flatMap((retailer) => retailer.evidence);

  const homepageHeadline =
    homepage?.h1 && homepage.h1.length >= 3 && homepage.h1.length <= 120
      ? [`Homepage headline: ${homepage.h1}`]
      : [];
  const emailInputEvidence = pages.flatMap((page) =>
    page.forms
      .filter(hasEmailInput)
      .map(
        (form) =>
          `Email input on ${page.url}${form.action ? ` (${form.action})` : ""}`,
      ),
  );
  const newsletterFormEvidence = pages.flatMap((page) =>
    page.forms
      .filter(
        (form) =>
          hasEmailInput(form) &&
          (NEWSLETTER_TERMS.test(formText(form)) ||
            supportsPageRole(page, "NEWSLETTER")),
      )
      .map(
        (form) =>
          `Newsletter form on ${page.url}${form.buttons[0] ? `: ${form.buttons[0]}` : ""}`,
      ),
  );
  const subscribeFormEvidence = pages.flatMap((page) =>
    page.forms
      .filter((form) => /\b(subscribe|join|sign up)\b/i.test(formText(form)))
      .map(
        (form) =>
          `Subscribe form on ${page.url}${form.buttons[0] ? `: ${form.buttons[0]}` : ""}`,
      ),
  );
  const newsletterLinkEvidence = pages.flatMap((page) =>
    page.links
      .filter(isNewsletterLink)
      .map(
        (link) => `Newsletter link on ${page.url}: ${link.text || link.href}`,
      ),
  );
  const missingAltEvidence = pages.flatMap((page) =>
    page.images
      .filter((image) => !image.alt)
      .map((image) => `Missing image alt text: ${image.src}`),
  );
  const socialEvidence = pages.flatMap((page) =>
    page.links
      .filter((link) =>
        /\b(facebook|instagram|tiktok|twitter|x\.com|linkedin|youtube|goodreads|threads|bsky|pinterest)\b/i.test(
          link.href,
        ),
      )
      .map((link) => `Social link: ${link.text || link.href}`),
  );

  return {
    pagesAnalyzed: pages.length,
    pageRoles: pages.map((page) => page.roleClassification),
    observations: pages.flatMap((page) => page.roleClassification.observations),
    authorBrand: {
      authorNameVisible: detection(
        likelyAuthorNameEvidence(titleH1Content, allText, personNames),
      ),
      genreOrCategoryMentioned: detection(
        firstEvidence([allText], GENRE_TERMS, "Genre/category wording"),
      ),
      clearHomepageHeadline: detection(homepageHeadline),
      aboutSectionOrPage: detection([
        ...pages
          .filter(
            (page) =>
              isPageType(page, "ABOUT") || supportsPageRole(page, "ABOUT"),
          )
          .map((page) => `About page: ${page.url}`),
        ...linkEvidence(
          pages,
          (text) => /\b(about|bio|meet the author)\b/i.test(text),
          "About link",
        ),
      ]),
    },
    bookPromotion: {
      bookCoverImages: detection(
        pages.flatMap((page) =>
          page.images
            .filter((image) =>
              isLikelyBookCover(image, page, [...bookHeadings, ...bookNames]),
            )
            .map((image) => `Book cover image: ${image.alt || image.src}`),
        ),
      ),
      bookTitles: detection([
        ...bookHeadings.map((heading) => `Book heading: ${heading}`),
        ...bookNames.map((name) => `Book name from schema: ${name}`),
        ...(schemaTypes.has("book") && bookNames.length === 0
          ? ["Book schema detected"]
          : []),
      ]),
      bookDescriptionOrBlurb: detection(
        firstEvidence([allText], BOOK_BLURB_TERMS, "Book description wording"),
      ),
      buyLinks: detection([
        ...pages.flatMap((page) =>
          page.ctas
            .filter((cta) =>
              isBookPurchaseAction(`${cta.text} ${cta.href ?? ""}`),
            )
            .map((cta) => `Buy CTA: ${cta.text || cta.href}`),
        ),
        ...linkEvidence(pages, isBookPurchaseAction, "Buy link"),
      ]),
      retailerLinks: detection(retailerEvidence),
      featuredBookSection: detection(
        firstEvidence([allText], FEATURED_BOOK_TERMS, "Featured book wording"),
      ),
      seriesPage: detection([
        ...pages
          .filter(
            (page) =>
              supportsPageRole(page, "SERIES") ||
              /\/series\b/i.test(page.url) ||
              SERIES_TERMS.test(page.text),
          )
          .map((page) => `Series signal: ${page.url}`),
      ]),
      reviewsOrPraise: detection(
        firstEvidence([allText], PRAISE_TERMS, "Reviews/praise wording"),
      ),
    },
    newsletter: {
      newsletterSignupForm: detection([
        ...newsletterFormEvidence,
        ...newsletterLinkEvidence,
      ]),
      subscribeForm: detection([
        ...subscribeFormEvidence,
        ...newsletterLinkEvidence,
      ]),
      emailInput: detection(emailInputEvidence),
      readerMagnetPhrases: detection(
        firstEvidence([allText], READER_MAGNET_TERMS, "Reader magnet wording"),
      ),
      freeChapter: detection(
        firstEvidence([allText], /\bfree chapter\b/i, "Free chapter wording"),
      ),
      bonusScene: detection(
        firstEvidence([allText], /\bbonus scene\b/i, "Bonus scene wording"),
      ),
      freeBook: detection(
        firstEvidence(
          [allText],
          /\bfree (book|novella|short story)\b/i,
          "Free book wording",
        ),
      ),
      updatesSignup: detection(
        firstEvidence(
          [allText],
          /\b(updates|book news|release news)\b/i,
          "Updates wording",
        ),
      ),
    },
    seo: {
      titleTagExists: detection(
        pages
          .filter((page) => page.title)
          .map((page) => `Title tag: ${page.title}`),
      ),
      metaDescriptionExists: detection(
        pages
          .filter((page) => page.metaDescription)
          .map((page) => `Meta description: ${page.metaDescription}`),
      ),
      h1Exists: detection(
        pages.filter((page) => page.h1).map((page) => `H1: ${page.h1}`),
      ),
      multipleH1Issue: detection(
        pages
          .filter((page) => page.h1Count !== null && page.h1Count > 1)
          .map((page) => `Multiple H1 tags on ${page.url}: ${page.h1Count}`),
      ),
      missingAltText: detection(missingAltEvidence),
      indexabilitySignals: indexabilitySignal(pages),
      canonicalUrl: detection(
        pages
          .filter((page) => page.canonicalUrl)
          .map((page) => `Canonical URL: ${page.canonicalUrl}`),
      ),
    },
    trust: {
      authorBio: detection([
        ...pages
          .filter(
            (page) =>
              isPageType(page, "ABOUT") ||
              supportsPageRole(page, "ABOUT") ||
              BIO_TERMS.test(page.text),
          )
          .map((page) => `Author bio signal: ${page.url}`),
      ]),
      authorPhoto: detection(
        pages.flatMap((page) =>
          page.images
            .filter((image) =>
              PHOTO_TERMS.test(`${image.alt ?? ""} ${image.src}`),
            )
            .map((image) => `Author photo: ${image.alt || image.src}`),
        ),
      ),
      contactForm: detection(
        pages
          .filter(
            (page) =>
              (isPageType(page, "CONTACT") ||
                supportsPageRole(page, "CONTACT")) &&
              page.forms.length > 0,
          )
          .map((page) => `Contact form: ${page.url}`),
      ),
      contactEmail: detection([
        ...pages.flatMap((page) =>
          page.emails.map((email) => `Contact email: ${email}`),
        ),
        ...firstEvidence([allText], EMAIL_PATTERN, "Email text"),
      ]),
      socialLinks: detection(socialEvidence),
      mediaKit: detection([
        ...pages
          .filter(
            (page) =>
              isPageType(page, "MEDIA_KIT") ||
              supportsPageRole(page, "MEDIA_KIT"),
          )
          .map((page) => `Media kit page: ${page.url}`),
        ...linkEvidence(
          pages,
          (text) => /\b(media kit|press kit|press)\b/i.test(text),
          "Media kit link",
        ),
      ]),
      privacyPolicy: detection([
        ...pages
          .filter((page) => supportsPageRole(page, "PRIVACY"))
          .map((page) => `Privacy policy page: ${page.url}`),
        ...linkEvidence(
          pages,
          (text) => /\bprivacy\b/i.test(text),
          "Privacy policy link",
        ),
      ]),
    },
    retailers,
    schema: {
      person: schemaDetection(schemaTypes, "person", "Person"),
      book: schemaDetection(schemaTypes, "book", "Book"),
      organization: schemaDetection(
        schemaTypes,
        "organization",
        "Organization",
      ),
      review: schemaDetection(schemaTypes, "review", "Review"),
      aggregateRating: schemaDetection(
        schemaTypes,
        "aggregaterating",
        "AggregateRating",
      ),
      sameAs: detection(
        sameAsValues.length > 0
          ? [`sameAs links: ${sameAsValues.join(", ")}`]
          : [],
      ),
    },
  };
}
