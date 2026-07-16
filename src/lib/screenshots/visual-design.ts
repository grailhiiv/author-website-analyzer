export const VISUAL_DESIGN_ANALYSIS_VERSION = "2.0.0";

export type VisualDesignPillar =
  "information_architecture" | "ui_ux" | "conversion_design";

export type VisualViewportVariant = "desktop" | "tablet" | "mobile";

export type VisualElementSample = {
  label: string;
  width: number;
  height: number;
  fontSize?: number;
  contrastRatio?: number;
};

export type VisualViewportEvidence = {
  variant: VisualViewportVariant;
  viewportWidth: number;
  viewportHeight: number;
  documentWidth: number;
  documentHeight: number;
  visibleHeadingCount: number;
  headingsAboveFoldCount: number;
  visibleNavigationCount: number;
  visibleNavigationControlCount: number;
  navigationLinkCount: number;
  navigationControlActivationAttempted: boolean;
  navigationControlRevealedLinkCount: number;
  navigationControlSamples: string[];
  navigationLinkSamples: string[];
  navigationControlRevealedLinkSamples: string[];
  visibleCtaCount: number;
  ctasAboveFoldCount: number;
  ctaSamples: string[];
  visibleFormCount: number;
  formsWithManyFieldsCount: number;
  largestFormFieldCount: number;
  formSamples: string[];
  interactiveElementCount: number;
  undersizedInteractiveCount: number;
  undersizedInteractiveSamples: VisualElementSample[];
  textElementCount: number;
  undersizedTextCount: number;
  undersizedTextSamples: VisualElementSample[];
  contrastTextCount: number;
  lowContrastTextCount: number;
  lowContrastTextSamples: VisualElementSample[];
  horizontalOverflowElementCount: number;
  horizontalOverflowElementSamples: VisualElementSample[];
  obstructiveOverlayCount: number;
  largestOverlayCoverage: number;
};

export type VisualDesignObservationStatus =
  "passed" | "needs_review" | "failed";

export type VisualDesignObservation = {
  id:
    | "navigation-availability"
    | "horizontal-overflow"
    | "main-heading-visibility"
    | "primary-action-visibility"
    | "form-length"
    | "text-contrast"
    | "mobile-tap-targets"
    | "mobile-text-size"
    | "obstructive-overlay";
  pillar: VisualDesignPillar;
  viewport: VisualViewportVariant;
  status: VisualDesignObservationStatus;
  title: string;
  summary: string;
  evidence: string;
  recommendation: string | null;
};

export type VisualDesignAnalysis = {
  version: typeof VISUAL_DESIGN_ANALYSIS_VERSION;
  source: "playwright-computed-layout";
  scoringImpact: "selected_checks";
  status: "complete" | "partial";
  viewports: VisualViewportEvidence[];
  observations: VisualDesignObservation[];
  errors: string[];
};

export const visualDesignPillarLabels: Record<VisualDesignPillar, string> = {
  information_architecture: "Site Structure",
  ui_ux: "Visual Design",
  conversion_design: "Conversion Design",
};

export const visualDesignManualReviewPrompts: Array<{
  pillar: VisualDesignPillar;
  prompt: string;
}> = [
  {
    pillar: "information_architecture",
    prompt:
      "Is the page hierarchy logical, is the menu consistent, and can a reader reach Books, About, newsletter, and Contact without getting lost? Confirm the click count for buying a book and joining the list.",
  },
  {
    pillar: "ui_ux",
    prompt:
      "Does the first impression feel professional and current, match the author's genre and intended readers, and use hierarchy, book covers, image quality, typography, color, and spacing consistently?",
  },
  {
    pillar: "conversion_design",
    prompt:
      "Are Buy, Read a sample, Join the newsletter, and Contact actions clear and prominent without competing with one another, and do forms request only necessary information?",
  },
];

const OVERFLOW_TOLERANCE_PX = 4;
const MINIMUM_TAP_TARGET_PX = 24;
const SMALL_TEXT_THRESHOLD_PX = 14;
const MINIMUM_SMALL_TEXT_COUNT = 3;
const MANY_FORM_FIELDS_THRESHOLD = 5;
export const MINIMUM_CONTRAST_MEASUREMENT_COVERAGE = 0.8;
export const MINIMUM_CONTRAST_TEXT_COUNT = 3;

function formatPixels(value: number) {
  return `${Math.round(value)}px`;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function viewportLabel(variant: VisualViewportVariant) {
  return `${variant.charAt(0).toUpperCase()}${variant.slice(1)}`;
}

function buildViewportObservations(
  viewport: VisualViewportEvidence,
): VisualDesignObservation[] {
  const observations: VisualDesignObservation[] = [];
  const label = viewportLabel(viewport.variant);
  const navigationHasUsableLinks =
    viewport.variant === "desktop"
      ? viewport.navigationLinkCount > 0
      : viewport.navigationLinkCount > 0 ||
        viewport.navigationControlRevealedLinkCount > 0;
  const navigationNeedsReview = !navigationHasUsableLinks;

  observations.push({
    id: "navigation-availability",
    pillar: "information_architecture",
    viewport: viewport.variant,
    status: navigationNeedsReview ? "failed" : "passed",
    title: `${label} navigation availability`,
    summary: navigationNeedsReview
      ? "No usable visible navigation region was detected in this viewport."
      : viewport.navigationLinkCount > 0
        ? "Visible primary navigation links were detected."
        : "The visible menu control revealed internal navigation links when activated.",
    evidence: `${viewport.visibleNavigationCount} navigation region(s), ${viewport.navigationLinkCount} initially visible navigation link(s), ${viewport.visibleNavigationControlCount} visible menu control(s), and ${viewport.navigationControlRevealedLinkCount} link(s) revealed by activation.${
      viewport.navigationLinkSamples.length > 0 ||
      viewport.navigationControlSamples.length > 0 ||
      viewport.navigationControlRevealedLinkSamples.length > 0
        ? ` Samples: ${[
            ...viewport.navigationLinkSamples,
            ...viewport.navigationControlSamples,
            ...viewport.navigationControlRevealedLinkSamples,
          ].join(", ")}.`
        : ""
    }`,
    recommendation: navigationNeedsReview
      ? "Make the primary menu easy to find and give readers direct paths to Books, About, newsletter signup, and contact information."
      : null,
  });

  const overflowPixels = Math.max(
    0,
    viewport.documentWidth - viewport.viewportWidth,
  );
  const hasHorizontalOverflow =
    overflowPixels > OVERFLOW_TOLERANCE_PX &&
    viewport.horizontalOverflowElementCount > 0;

  observations.push({
    id: "horizontal-overflow",
    pillar: "ui_ux",
    viewport: viewport.variant,
    status: hasHorizontalOverflow ? "failed" : "passed",
    title: `${label} horizontal overflow`,
    summary: hasHorizontalOverflow
      ? `The rendered page is ${formatPixels(overflowPixels)} wider than the ${formatPixels(viewport.viewportWidth)} viewport.`
      : "The rendered page fits within the viewport width.",
    evidence: `Document width ${formatPixels(viewport.documentWidth)}; viewport width ${formatPixels(viewport.viewportWidth)}; ${viewport.horizontalOverflowElementCount} unclipped overflow source(s).${
      viewport.horizontalOverflowElementSamples.length > 0
        ? ` Samples: ${viewport.horizontalOverflowElementSamples.map((sample) => sample.label).join(", ")}.`
        : ""
    }`,
    recommendation: hasHorizontalOverflow
      ? "Inspect the preview for clipped content or sideways scrolling, then constrain the overflowing element at this breakpoint."
      : null,
  });

  const headingNeedsReview = viewport.headingsAboveFoldCount === 0;

  observations.push({
    id: "main-heading-visibility",
    pillar: "ui_ux",
    viewport: viewport.variant,
    status: headingNeedsReview ? "failed" : "passed",
    title: `${label} main-heading visibility`,
    summary: headingNeedsReview
      ? "No visible H1 appears in the first viewport."
      : "A visible H1 appears in the first viewport.",
    evidence: `${viewport.visibleHeadingCount} visible H1 element(s); ${viewport.headingsAboveFoldCount} visible before scrolling.`,
    recommendation: headingNeedsReview
      ? "Make the first screen clearly identify the author or current book with a descriptive main heading."
      : null,
  });

  const actionNeedsReview = viewport.ctasAboveFoldCount === 0;

  observations.push({
    id: "primary-action-visibility",
    pillar: "conversion_design",
    viewport: viewport.variant,
    status: actionNeedsReview ? "failed" : "passed",
    title: `${label} primary-action visibility`,
    summary: actionNeedsReview
      ? "No clear author-focused action was detected before scrolling."
      : "A clear author-focused action was detected before scrolling.",
    evidence: `${viewport.visibleCtaCount} visible action candidate(s); ${viewport.ctasAboveFoldCount} before scrolling.${
      viewport.ctaSamples.length > 0
        ? ` Samples: ${viewport.ctaSamples.join(", ")}.`
        : ""
    }`,
    recommendation: actionNeedsReview
      ? "Place one specific, prominent next step near the main message, such as Buy the book, Read a sample, or Join the newsletter."
      : null,
  });

  const formNeedsReview = viewport.formsWithManyFieldsCount > 0;

  observations.push({
    id: "form-length",
    pillar: "conversion_design",
    viewport: viewport.variant,
    status: formNeedsReview ? "failed" : "passed",
    title: `${label} form length`,
    summary: formNeedsReview
      ? `${viewport.formsWithManyFieldsCount} visible form(s) ask for more than ${MANY_FORM_FIELDS_THRESHOLD} fields.`
      : "No unusually long visible form was detected.",
    evidence: `${viewport.visibleFormCount} visible form(s); largest contains ${viewport.largestFormFieldCount} non-hidden field(s).${
      viewport.formSamples.length > 0
        ? ` Samples: ${viewport.formSamples.join("; ")}.`
        : ""
    }`,
    recommendation: formNeedsReview
      ? "Shorten the form to the information required for this action, and move optional questions to a later step."
      : null,
  });

  const contrastCoverage =
    viewport.textElementCount > 0
      ? viewport.contrastTextCount / viewport.textElementCount
      : 0;
  const contrastStatus: VisualDesignObservationStatus =
    viewport.contrastTextCount < MINIMUM_CONTRAST_TEXT_COUNT ||
    contrastCoverage < MINIMUM_CONTRAST_MEASUREMENT_COVERAGE
      ? "needs_review"
      : viewport.lowContrastTextCount > 0
        ? "failed"
        : "passed";
  const contrastSamples = viewport.lowContrastTextSamples
    .map(
      (sample) =>
        `${sample.label} (${sample.contrastRatio?.toFixed(2) ?? "?"}:1)`,
    )
    .join("; ");

  observations.push({
    id: "text-contrast",
    pillar: "ui_ux",
    viewport: viewport.variant,
    status: contrastStatus,
    title: `${label} text contrast`,
    summary:
      contrastStatus === "needs_review"
        ? "Text contrast could not be measured reliably in this viewport."
        : contrastStatus === "failed"
          ? `${viewport.lowContrastTextCount} visible text element(s) fall below the baseline contrast threshold.`
          : "Measured visible text meets the baseline contrast threshold.",
    evidence: contrastSamples
      ? `${viewport.contrastTextCount} of ${viewport.textElementCount} text elements measured (${formatPercent(contrastCoverage)} coverage). Samples: ${contrastSamples}.`
      : `${viewport.contrastTextCount} of ${viewport.textElementCount} text elements measured (${formatPercent(contrastCoverage)} coverage).`,
    recommendation:
      contrastStatus === "failed"
        ? "Increase the contrast between the flagged text and its background while preserving the author brand palette."
        : null,
  });

  if (viewport.variant === "mobile") {
    const tapTargetsNeedReview = viewport.undersizedInteractiveCount > 0;
    const tapTargetSamples = viewport.undersizedInteractiveSamples
      .map(
        (sample) =>
          `${sample.label} (${formatPixels(sample.width)} x ${formatPixels(sample.height)})`,
      )
      .join("; ");

    observations.push({
      id: "mobile-tap-targets",
      pillar: "ui_ux",
      viewport: viewport.variant,
      status: tapTargetsNeedReview ? "failed" : "passed",
      title: "Mobile tap-target size",
      summary: tapTargetsNeedReview
        ? `${viewport.undersizedInteractiveCount} visible control(s) are smaller than ${MINIMUM_TAP_TARGET_PX}px in at least one dimension.`
        : "Visible controls meet the automated tap-target size check.",
      evidence: tapTargetSamples
        ? `${viewport.interactiveElementCount} controls inspected. Samples: ${tapTargetSamples}.`
        : `${viewport.interactiveElementCount} controls inspected.`,
      recommendation: tapTargetsNeedReview
        ? "Increase the clickable area or spacing around links and controls that are difficult to tap on a phone."
        : null,
    });

    const smallTextNeedsReview =
      viewport.undersizedTextCount >= MINIMUM_SMALL_TEXT_COUNT;
    const textSamples = viewport.undersizedTextSamples
      .map(
        (sample) => `${sample.label} (${formatPixels(sample.fontSize ?? 0)})`,
      )
      .join("; ");

    observations.push({
      id: "mobile-text-size",
      pillar: "ui_ux",
      viewport: viewport.variant,
      status: smallTextNeedsReview ? "failed" : "passed",
      title: "Mobile text size",
      summary: smallTextNeedsReview
        ? `${viewport.undersizedTextCount} visible text element(s) use text smaller than ${SMALL_TEXT_THRESHOLD_PX}px.`
        : "The automated check found no repeated use of very small mobile text.",
      evidence: textSamples
        ? `${viewport.textElementCount} text elements inspected. Samples: ${textSamples}.`
        : `${viewport.textElementCount} text elements inspected.`,
      recommendation: smallTextNeedsReview
        ? "Increase body, navigation, or form text that is difficult to read on a phone."
        : null,
    });
  }

  const overlayNeedsReview = viewport.obstructiveOverlayCount > 0;

  observations.push({
    id: "obstructive-overlay",
    pillar: "ui_ux",
    viewport: viewport.variant,
    status: overlayNeedsReview ? "failed" : "passed",
    title: `${label} overlay obstruction`,
    summary: overlayNeedsReview
      ? `${viewport.obstructiveOverlayCount} large fixed overlay(s) may obscure the first screen.`
      : "No large fixed overlay obscures the first screen.",
    evidence: overlayNeedsReview
      ? `Largest candidate covers ${formatPercent(viewport.largestOverlayCoverage)} of the viewport.`
      : "No qualifying overlay candidate was detected.",
    recommendation: overlayNeedsReview
      ? "Make cookie, signup, or promotional overlays easy to dismiss without hiding the main author or book message."
      : null,
  });

  return observations;
}

export function buildVisualDesignAnalysis(
  viewports: VisualViewportEvidence[],
  errors: string[] = [],
): VisualDesignAnalysis | null {
  if (viewports.length === 0 && errors.length === 0) {
    return null;
  }

  const order: Record<VisualViewportVariant, number> = {
    desktop: 0,
    tablet: 1,
    mobile: 2,
  };
  const orderedViewports = [...viewports].sort(
    (a, b) => order[a.variant] - order[b.variant],
  );
  const capturedVariants = new Set(
    orderedViewports.map((viewport) => viewport.variant),
  );

  return {
    version: VISUAL_DESIGN_ANALYSIS_VERSION,
    source: "playwright-computed-layout",
    scoringImpact: "selected_checks",
    status:
      capturedVariants.size === 3 && errors.length === 0
        ? "complete"
        : "partial",
    viewports: orderedViewports,
    observations: orderedViewports.flatMap(buildViewportObservations),
    errors,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getVisualDesignAnalysis(
  crawlDiagnostics: unknown,
): VisualDesignAnalysis | null {
  if (!isRecord(crawlDiagnostics)) {
    return null;
  }

  const value = crawlDiagnostics.visualDesignAnalysis;

  if (
    !isRecord(value) ||
    value.version !== VISUAL_DESIGN_ANALYSIS_VERSION ||
    value.source !== "playwright-computed-layout" ||
    value.scoringImpact !== "selected_checks" ||
    !Array.isArray(value.viewports) ||
    !Array.isArray(value.observations) ||
    !Array.isArray(value.errors)
  ) {
    return null;
  }

  return value as VisualDesignAnalysis;
}
