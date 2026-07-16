export const PAGE_ROLE_CLASSIFIER_VERSION = "1.4.0";
export const EVIDENCE_OBSERVATION_VERSION = "1.4.0";

export type PageRole =
  | "HOME"
  | "ABOUT"
  | "BOOKS_INDEX"
  | "BOOK_DETAIL"
  | "SERIES"
  | "NEWSLETTER"
  | "CONTACT"
  | "EVENTS"
  | "MEDIA_KIT"
  | "BLOG_INDEX"
  | "ARTICLE"
  | "PRIVACY"
  | "STORE"
  | "UTILITY"
  | "UNKNOWN";

export type EvidenceScope =
  "response" | "head" | "main" | "navigation" | "footer" | "rendered";

export type EvidenceSourceKind =
  "http" | "dom" | "jsonld" | "link" | "image" | "form" | "text" | "audit";

export type EvidenceObservationState =
  "present" | "absent" | "unknown" | "conflicting";

export type EvidenceStrength = "strong" | "supporting" | "weak";

export type EvidenceObservation = {
  signalId: string;
  sourceUrl: string;
  pageRole: PageRole;
  scope: EvidenceScope;
  sourceKind: EvidenceSourceKind;
  selectorOrProperty?: string;
  normalizedValue?: string;
  state: EvidenceObservationState;
  strength: EvidenceStrength;
  ruleVersion: string;
  observedAt: string | null;
};

export type PageRoleClassifierLink = {
  href: string;
  text?: string | null;
};

export type PageRoleClassifierForm = {
  action?: string | null;
  scope?: "main" | "navigation" | "footer";
  fields: Array<{
    type?: string | null;
    name?: string | null;
    label?: string | null;
    placeholder?: string | null;
  }>;
  buttons: string[];
};

export type PageRoleClassifierInput = {
  url: string;
  declaredPageType?: string | null;
  title?: string | null;
  h1?: string | null;
  headings?: string[];
  bodyText?: string | null;
  links?: PageRoleClassifierLink[];
  images?: Array<{ src: string; alt?: string | null }>;
  forms?: PageRoleClassifierForm[];
  jsonLd?: unknown[];
  semanticArticle?: boolean;
  observedAt?: string | null;
};

export type PageRoleCandidate = {
  role: Exclude<PageRole, "UNKNOWN">;
  points: number;
  observations: EvidenceObservation[];
};

export type PageRoleClassification = {
  sourceUrl: string;
  primaryRole: PageRole;
  secondaryRoles: PageRole[];
  confidence: "high" | "medium" | "low";
  candidates: PageRoleCandidate[];
  observations: EvidenceObservation[];
  classifierVersion: string;
};

type ClassifiedRole = Exclude<PageRole, "UNKNOWN">;

type ObservationInput = Omit<
  EvidenceObservation,
  "signalId" | "sourceUrl" | "pageRole" | "state" | "ruleVersion" | "observedAt"
>;

const DECLARED_ROLE_MAP: Record<string, ClassifiedRole> = {
  HOME: "HOME",
  ABOUT: "ABOUT",
  BOOKS: "BOOKS_INDEX",
  CONTACT: "CONTACT",
  NEWSLETTER: "NEWSLETTER",
  BLOG: "BLOG_INDEX",
  MEDIA_KIT: "MEDIA_KIT",
  EVENTS: "EVENTS",
};

const ROLE_ORDER: ClassifiedRole[] = [
  "HOME",
  "ABOUT",
  "BOOK_DETAIL",
  "BOOKS_INDEX",
  "SERIES",
  "NEWSLETTER",
  "CONTACT",
  "EVENTS",
  "MEDIA_KIT",
  "ARTICLE",
  "BLOG_INDEX",
  "PRIVACY",
  "STORE",
  "UTILITY",
];

const RETAILER_PATTERN =
  /(?:amazon\.|amzn\.to|bookshop\.org|barnesandnoble\.com|bn\.com|books\.apple\.com|kobo\.com|goodreads\.com|audible\.com)/i;
const BUY_PATTERN =
  /\b(?:buy|order|pre-?order|purchase|get the book|shop now)\b/i;
const BOOK_DESCRIPTION_PATTERN =
  /\b(?:about the book|book description|blurb|synopsis|this (?:book|novel)|readers will)\b/i;
const NEWSLETTER_PATTERN =
  /\b(?:newsletter|subscribe|reader list|mailing list|join (?:my|the) list|book updates)\b/i;

function compact(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function jsonLdTypes(value: unknown, result = new Set<string>()) {
  if (Array.isArray(value)) {
    value.forEach((item) => jsonLdTypes(item, result));
    return result;
  }

  if (!value || typeof value !== "object") {
    return result;
  }

  const record = value as Record<string, unknown>;
  const rawType = record["@type"];

  for (const type of Array.isArray(rawType) ? rawType : [rawType]) {
    if (typeof type === "string") {
      result.add(type.toLowerCase());
    }
  }

  Object.values(record).forEach((item) => jsonLdTypes(item, result));
  return result;
}

function pathFor(url: string) {
  try {
    return new URL(url).pathname.toLowerCase().replace(/\/+$/, "") || "/";
  } catch {
    return "/invalid-url";
  }
}

function confidenceFor(points: number) {
  if (points >= 7) {
    return "high" as const;
  }

  if (points >= 5) {
    return "medium" as const;
  }

  return "low" as const;
}

export function classifyPageRole(
  input: PageRoleClassifierInput,
): PageRoleClassification {
  const scores = new Map<ClassifiedRole, PageRoleCandidate>();
  const path = pathFor(input.url);
  const title = compact(input.title);
  const h1 = compact(input.h1);
  const headings = (input.headings ?? []).map(compact).filter(Boolean);
  const prominentValues = [title, h1, ...headings].filter(Boolean);
  const prominentText = compact(prominentValues.join(" "));
  const bodyText = compact(input.bodyText);
  const links = input.links ?? [];
  const forms = input.forms ?? [];
  const schemaTypes = jsonLdTypes(input.jsonLd ?? []);
  const observedAt = input.observedAt ?? null;

  const add = (
    role: ClassifiedRole,
    points: number,
    observation: ObservationInput,
  ) => {
    const candidate = scores.get(role) ?? {
      role,
      points: 0,
      observations: [],
    };
    const evidence: EvidenceObservation = {
      ...observation,
      signalId: `page.role.${role.toLowerCase()}`,
      sourceUrl: input.url,
      pageRole: role,
      state: "present",
      ruleVersion: EVIDENCE_OBSERVATION_VERSION,
      observedAt,
    };
    const signature = `${evidence.sourceKind}|${evidence.selectorOrProperty ?? ""}|${evidence.normalizedValue ?? ""}`;
    const alreadyRecorded = candidate.observations.some(
      (item) =>
        `${item.sourceKind}|${item.selectorOrProperty ?? ""}|${item.normalizedValue ?? ""}` ===
        signature,
    );

    candidate.points += points;
    if (!alreadyRecorded) {
      candidate.observations.push(evidence);
    }
    scores.set(role, candidate);
  };

  if (path === "/") {
    add("HOME", 8, {
      scope: "response",
      sourceKind: "http",
      selectorOrProperty: "finalUrl.pathname",
      normalizedValue: path,
      strength: "strong",
    });
  }

  const declaredRole =
    DECLARED_ROLE_MAP[compact(input.declaredPageType).toUpperCase()];

  if (declaredRole) {
    add(declaredRole, 2, {
      scope: "response",
      sourceKind: "dom",
      selectorOrProperty: "storedPageType",
      normalizedValue: compact(input.declaredPageType).toUpperCase(),
      strength: "supporting",
    });
  }

  const pathRules: Array<[ClassifiedRole, RegExp]> = [
    [
      "ABOUT",
      /\/(?:about|about-me|bio|biography|meet-[^/]+?)(?:\.html?)?$/i,
    ],
    [
      "BOOKS_INDEX",
      /\/(?:books?|novels?|works|bibliography|titles)(?:\.html?)?$/i,
    ],
    [
      "SERIES",
      /\/(?:series|reading-order|[^/]*(?:series|saga|trilogy)[^/]*?)(?:\.html?)?$/i,
    ],
    [
      "NEWSLETTER",
      /\/(?:newsletter|subscribe|reader-list|readers|sign-up)(?:\.html?)?$/i,
    ],
    [
      "CONTACT",
      /\/(?:contact|contact-me|contact-us|get-in-touch)(?:\.html?)?$/i,
    ],
    ["EVENTS", /\/(?:events|appearances|speaking|calendar)(?:\.html?)?$/i],
    [
      "MEDIA_KIT",
      /\/(?:media|press|press-kit|media-kit|publicity)(?:\.html?)?$/i,
    ],
    ["BLOG_INDEX", /\/(?:blog|news|articles|journal)(?:\.html?)?$/i],
    [
      "PRIVACY",
      /\/privacy(?:[-_]+(?:policy|notice|disclosure))?(?:\.html?)?$/i,
    ],
    ["STORE", /\/(?:store|shop)(?:\.html?)?$/i],
    [
      "UTILITY",
      /\/(?:login|account|cart|checkout|search|tags?|categories|404)(?:\.html?)?$/i,
    ],
  ];

  pathRules.forEach(([role, pattern]) => {
    if (pattern.test(path)) {
      const corroboratedByDeclaredType = declaredRole === role;
      add(role, corroboratedByDeclaredType ? 6 : 2, {
        scope: "response",
        sourceKind: "http",
        selectorOrProperty: "finalUrl.pathname",
        normalizedValue: path,
        strength: corroboratedByDeclaredType ? "strong" : "supporting",
      });
    }
  });

  const prominentRules: Array<[ClassifiedRole, RegExp]> = [
    [
      "ABOUT",
      /(?:\b(?:about (?:me|the author)|meet the author|author bio(?:graphy)?)\b)|(?:^(?:About|Meet)\s+[\p{Lu}][\p{L}'’\-]+(?:\s+[\p{Lu}][\p{L}'’\-]+){0,2}$)|(?:^(?:ABOUT|MEET)\s+[\p{Lu}'’\-]+(?:\s+[\p{Lu}'’\-]+){0,2}$)/u,
    ],
    [
      "BOOKS_INDEX",
      /^(?:my )?(?:books?|novels?|published works|bibliography|titles)(?:\s+by\s+.+)?$/i,
    ],
    ["SERIES", /\b(?:book series|reading order|saga|trilogy)\b/i],
    [
      "NEWSLETTER",
      /\b(?:newsletter|reader list|mailing list|subscribe for (?:book )?updates)\b/i,
    ],
    ["CONTACT", /\b(?:contact (?:me|the author|[\p{L}'’-]+)|get in touch)\b/iu],
    ["EVENTS", /\b(?:events|appearances|book tour|speaking engagements)\b/i],
    [
      "MEDIA_KIT",
      /\b(?:media kit|press kit|for the media|publicity resources)\b/i,
    ],
    ["BLOG_INDEX", /^(?:blog|news|articles|journal)(?:\s*[|—-].*)?$/i],
    ["PRIVACY", /\b(?:privacy policy|data policy|privacy notice)\b/i],
    ["STORE", /^(?:store|shop)(?:\s*[|—-].*)?$/i],
  ];

  prominentRules.forEach(([role, pattern]) => {
    const matchingValue = prominentValues.find((value) =>
      role === "CONTACT"
        ? /^(?:contact (?:me|the author|[\p{L}'’-]+(?:\s+[\p{L}'’-]+){0,2})|get in touch)$/iu.test(
            value,
          )
        : role === "PRIVACY"
          ? /^(?:privacy policy|data policy|privacy notice)(?:\s*[|—–-].*)?$/i.test(
              value,
            )
        : pattern.test(value),
    );

    if (matchingValue) {
      add(role, 4, {
        scope: "main",
        sourceKind: "text",
        selectorOrProperty: "title,h1,headings",
        normalizedValue: matchingValue.slice(0, 240),
        strength: "strong",
      });
    }
  });

  if (schemaTypes.has("book")) {
    add("BOOK_DETAIL", 8, {
      scope: "head",
      sourceKind: "jsonld",
      selectorOrProperty: "@type",
      normalizedValue: "Book",
      strength: "strong",
    });
  }

  if (schemaTypes.has("article") || schemaTypes.has("blogposting")) {
    add("ARTICLE", 8, {
      scope: "head",
      sourceKind: "jsonld",
      selectorOrProperty: "@type",
      normalizedValue: schemaTypes.has("blogposting")
        ? "BlogPosting"
        : "Article",
      strength: "strong",
    });
  }

  if (
    schemaTypes.has("collectionpage") &&
    /\b(?:books?|novels?|works)\b/i.test(prominentText)
  ) {
    add("BOOKS_INDEX", 5, {
      scope: "head",
      sourceKind: "jsonld",
      selectorOrProperty: "@type",
      normalizedValue: "CollectionPage with book context",
      strength: "strong",
    });
  }

  if (schemaTypes.has("event")) {
    add("EVENTS", 5, {
      scope: "head",
      sourceKind: "jsonld",
      selectorOrProperty: "@type",
      normalizedValue: "Event",
      strength: "strong",
    });
  }

  if (schemaTypes.has("product") || schemaTypes.has("offer")) {
    add("STORE", 5, {
      scope: "head",
      sourceKind: "jsonld",
      selectorOrProperty: "@type",
      normalizedValue: schemaTypes.has("product") ? "Product" : "Offer",
      strength: "strong",
    });
  }

  const purchaseLinks = links.filter(
    (link) =>
      BUY_PATTERN.test(`${compact(link.text)} ${link.href}`) ||
      RETAILER_PATTERN.test(link.href),
  );

  if (purchaseLinks.length > 0) {
    add("BOOK_DETAIL", 2, {
      scope: "main",
      sourceKind: "link",
      selectorOrProperty: "a[href]",
      normalizedValue: compact(purchaseLinks[0].text) || purchaseLinks[0].href,
      strength: "supporting",
    });

    const prominentPurchaseText = prominentValues.find((value) =>
      BUY_PATTERN.test(value),
    );

    if (prominentPurchaseText) {
      add("BOOK_DETAIL", 2, {
        scope: "main",
        sourceKind: "text",
        selectorOrProperty: "title,h1,headings",
        normalizedValue: prominentPurchaseText.slice(0, 240),
        strength: "supporting",
      });
    }

    const normalizedH1 = h1.toLocaleLowerCase();
    const namedPurchaseLink =
      normalizedH1.length >= 8
        ? purchaseLinks.find((link) =>
            compact(link.text).toLocaleLowerCase().includes(normalizedH1),
          )
        : undefined;

    if (namedPurchaseLink) {
      add("BOOK_DETAIL", 2, {
        scope: "main",
        sourceKind: "link",
        selectorOrProperty: "a[href] text matches h1",
        normalizedValue: compact(namedPurchaseLink.text).slice(0, 240),
        strength: "supporting",
      });
    }

    const distinctPurchaseDestinations = new Set(
      purchaseLinks.map((link) => link.href),
    );
    const isWhatsNewCollection =
      distinctPurchaseDestinations.size >= 2 &&
      prominentValues.some((value) =>
        /^what(?:'|’)?s new(?:\s*[|—–-].*)?$/i.test(value),
      );

    if (isWhatsNewCollection) {
      add("BOOKS_INDEX", 5, {
        scope: "main",
        sourceKind: "link",
        selectorOrProperty: "multiple purchase links + What's New heading",
        normalizedValue: `${distinctPurchaseDestinations.size} purchase destinations`,
        strength: "strong",
      });
    }
  }

  if (input.semanticArticle) {
    add("ARTICLE", 6, {
      scope: "main",
      sourceKind: "dom",
      selectorOrProperty: "article.type-post, article time[datetime]",
      normalizedValue: "Published article structure",
      strength: "strong",
    });
  }

  if (BOOK_DESCRIPTION_PATTERN.test(bodyText)) {
    add("BOOK_DETAIL", 2, {
      scope: "main",
      sourceKind: "text",
      selectorOrProperty: "bodyText",
      normalizedValue: bodyText.match(BOOK_DESCRIPTION_PATTERN)?.[0],
      strength: "supporting",
    });
  }

  const orderedBookMentions =
    bodyText.match(/\bbook\s+(?:#?\d+|one|two|three|four|five)\b/gi) ?? [];
  if (orderedBookMentions.length >= 2) {
    add("SERIES", 5, {
      scope: "main",
      sourceKind: "text",
      selectorOrProperty: "bodyText",
      normalizedValue: [...new Set(orderedBookMentions.map(compact))]
        .slice(0, 4)
        .join(", "),
      strength: "strong",
    });
  }

  const emailForms = forms.filter((form) =>
    form.fields.some((field) =>
      /\bemail\b/i.test(
        [field.type, field.name, field.label, field.placeholder]
          .filter(Boolean)
          .join(" "),
      ),
    ),
  );
  const newsletterForm = emailForms.find((form) =>
    NEWSLETTER_PATTERN.test(
      [form.action, ...form.buttons].filter(Boolean).join(" "),
    ),
  );
  const mainEmailForms = emailForms.filter(
    (form) => form.scope !== "footer" && form.scope !== "navigation",
  );

  if (newsletterForm) {
    const isPageChrome =
      newsletterForm.scope === "footer" ||
      newsletterForm.scope === "navigation";
    add("NEWSLETTER", isPageChrome ? 1 : 7, {
      scope: newsletterForm.scope ?? "main",
      sourceKind: "form",
      selectorOrProperty: "form[email]",
      normalizedValue: compact(
        [newsletterForm.action, ...newsletterForm.buttons]
          .filter(Boolean)
          .join(" "),
      ),
      strength: isPageChrome ? "weak" : "strong",
    });
  } else if (
    mainEmailForms.length > 0 &&
    NEWSLETTER_PATTERN.test(prominentText)
  ) {
    add("NEWSLETTER", 5, {
      scope: "main",
      sourceKind: "form",
      selectorOrProperty: "form[email] + page heading",
      normalizedValue: prominentText.slice(0, 160),
      strength: "strong",
    });
  }

  const contactForm = forms.find((form) => {
    const formContent = [
      form.action,
      ...form.buttons,
      ...form.fields.flatMap((field) => [
        field.type,
        field.name,
        field.label,
        field.placeholder,
      ]),
    ]
      .filter(Boolean)
      .join(" ");

    return /\b(?:contact|message|inquiry|enquiry)\b/i.test(formContent);
  });

  if (contactForm) {
    const isPageChrome =
      contactForm.scope === "footer" || contactForm.scope === "navigation";
    add("CONTACT", isPageChrome ? 1 : 7, {
      scope: contactForm.scope ?? "main",
      sourceKind: "form",
      selectorOrProperty: "form",
      normalizedValue: compact(
        [contactForm.action, ...contactForm.buttons].filter(Boolean).join(" "),
      ),
      strength: isPageChrome ? "weak" : "strong",
    });
  }

  const candidates = [...scores.values()]
    .map((candidate) => ({
      ...candidate,
      observations: candidate.observations.slice(0, 6),
    }))
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      return ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role);
    });
  const winner = candidates[0];
  const routePreferredRole =
    path === "/"
      ? "HOME"
      : /\/privacy(?:[-_]+(?:policy|notice|disclosure))?(?:\.html?)?$/i.test(
            path,
          )
        ? "PRIVACY"
        : null;
  const routePreferredCandidate = routePreferredRole
    ? candidates.find((candidate) => candidate.role === routePreferredRole)
    : undefined;
  const primaryRole =
    routePreferredCandidate && routePreferredCandidate.points >= 3
      ? routePreferredCandidate.role
      : winner && winner.points >= 3
        ? winner.role
        : "UNKNOWN";
  const primaryCandidate = candidates.find(
    (candidate) => candidate.role === primaryRole,
  );
  const comparisonPoints = primaryCandidate?.points ?? winner?.points ?? 0;
  const secondaryRoles = candidates
    .filter(
      (candidate) =>
        candidate.role !== primaryRole &&
        candidate.points >= 3 &&
        candidate.points >= comparisonPoints - 4,
    )
    .map((candidate) => candidate.role);
  const observations = candidates
    .filter(
      (candidate) =>
        candidate.role === primaryRole ||
        secondaryRoles.includes(candidate.role),
    )
    .flatMap((candidate) => candidate.observations);

  return {
    sourceUrl: input.url,
    primaryRole,
    secondaryRoles,
    confidence: confidenceFor(comparisonPoints),
    candidates,
    observations,
    classifierVersion: PAGE_ROLE_CLASSIFIER_VERSION,
  };
}

export function pageSupportsRole(
  classification: PageRoleClassification,
  role: PageRole,
) {
  return (
    classification.primaryRole === role ||
    classification.secondaryRoles.includes(role)
  );
}
