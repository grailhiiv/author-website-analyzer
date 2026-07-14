import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildVisualDesignAnalysis,
  getVisualDesignAnalysis,
  type VisualViewportEvidence,
  type VisualViewportVariant,
} from "@/lib/screenshots/visual-design";

function viewport(
  variant: VisualViewportVariant = "mobile",
  overrides: Partial<VisualViewportEvidence> = {},
): VisualViewportEvidence {
  const dimensions = {
    desktop: { width: 1440, height: 1200 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 390, height: 844 },
  }[variant];

  return {
    variant,
    viewportWidth: dimensions.width,
    viewportHeight: dimensions.height,
    documentWidth: dimensions.width,
    documentHeight: 1600,
    visibleHeadingCount: 1,
    headingsAboveFoldCount: 1,
    visibleNavigationCount: 1,
    visibleNavigationControlCount: 0,
    navigationLinkCount: 4,
    navigationControlActivationAttempted: false,
    navigationControlRevealedLinkCount: 0,
    navigationControlSamples: [],
    navigationLinkSamples: ["Books", "About", "Contact"],
    navigationControlRevealedLinkSamples: [],
    visibleCtaCount: 2,
    ctasAboveFoldCount: 1,
    ctaSamples: ["Buy the book"],
    visibleFormCount: 1,
    formsWithManyFieldsCount: 0,
    largestFormFieldCount: 2,
    formSamples: ["Newsletter (2 fields)"],
    interactiveElementCount: 4,
    undersizedInteractiveCount: 0,
    undersizedInteractiveSamples: [],
    textElementCount: 20,
    undersizedTextCount: 0,
    undersizedTextSamples: [],
    contrastTextCount: 20,
    lowContrastTextCount: 0,
    lowContrastTextSamples: [],
    horizontalOverflowElementCount: 0,
    horizontalOverflowElementSamples: [],
    obstructiveOverlayCount: 0,
    largestOverlayCoverage: 0,
    ...overrides,
  };
}

describe("buildVisualDesignAnalysis", () => {
  it("scores the selected objective checks while retaining all three design pillars", () => {
    const analysis = buildVisualDesignAnalysis([
      viewport("desktop"),
      viewport("tablet"),
      viewport("mobile"),
    ]);

    assert.equal(analysis?.status, "complete");
    assert.equal(analysis?.scoringImpact, "selected_checks");
    assert.equal(
      analysis?.observations.every(
        (observation) => observation.status === "passed",
      ),
      true,
    );
    assert.deepEqual(
      new Set(analysis?.observations.map((observation) => observation.pillar)),
      new Set(["information_architecture", "ui_ux", "conversion_design"]),
    );
  });

  it("reports measurable design risks with evidence and recommendations", () => {
    const analysis = buildVisualDesignAnalysis([
      viewport("mobile", {
        documentWidth: 430,
        horizontalOverflowElementCount: 1,
        horizontalOverflowElementSamples: [
          { label: "Promotional banner", width: 430, height: 80 },
        ],
        visibleNavigationCount: 0,
        visibleNavigationControlCount: 0,
        navigationLinkCount: 0,
        navigationLinkSamples: [],
        headingsAboveFoldCount: 0,
        ctasAboveFoldCount: 0,
        formsWithManyFieldsCount: 1,
        largestFormFieldCount: 7,
        formSamples: ["Contact form (7 fields)"],
        undersizedInteractiveCount: 2,
        undersizedInteractiveSamples: [
          { label: "Menu", width: 18, height: 18 },
        ],
        undersizedTextCount: 4,
        undersizedTextSamples: [
          { label: "Join the list", width: 120, height: 12, fontSize: 12 },
        ],
        lowContrastTextCount: 1,
        lowContrastTextSamples: [
          {
            label: "Read more",
            width: 80,
            height: 18,
            fontSize: 14,
            contrastRatio: 2.4,
          },
        ],
        obstructiveOverlayCount: 1,
        largestOverlayCoverage: 0.3,
      }),
    ]);
    const misses =
      analysis?.observations.filter(
        (observation) => observation.status === "needs_review",
      ) ?? [];

    assert.equal(analysis?.status, "partial");
    assert.equal(misses.length, 9);
    assert.equal(
      misses.every((observation) => observation.recommendation),
      true,
    );
    assert.match(
      misses.find((observation) => observation.id === "horizontal-overflow")
        ?.evidence ?? "",
      /430px/,
    );
    assert.match(
      misses.find((observation) => observation.id === "form-length")
        ?.evidence ?? "",
      /Contact form/,
    );
  });

  it("marks contrast unknown when the rendered background cannot be measured", () => {
    const analysis = buildVisualDesignAnalysis([
      viewport("desktop", { contrastTextCount: 0 }),
    ]);

    assert.equal(
      analysis?.observations.find(
        (observation) => observation.id === "text-contrast",
      )?.status,
      "unknown",
    );
  });

  it("recognizes a working collapsed mobile navigation menu", () => {
    const analysis = buildVisualDesignAnalysis([
      viewport("mobile", {
        visibleNavigationCount: 0,
        visibleNavigationControlCount: 1,
        navigationLinkCount: 0,
        navigationControlActivationAttempted: true,
        navigationControlRevealedLinkCount: 4,
        navigationControlSamples: ["Menu"],
        navigationControlRevealedLinkSamples: ["Books", "About", "Contact"],
      }),
    ]);

    assert.equal(
      analysis?.observations.find(
        (observation) => observation.id === "navigation-availability",
      )?.status,
      "passed",
    );
  });

  it("flags a mobile menu control that reveals no internal links", () => {
    const analysis = buildVisualDesignAnalysis([
      viewport("mobile", {
        visibleNavigationCount: 0,
        visibleNavigationControlCount: 1,
        navigationLinkCount: 0,
        navigationControlActivationAttempted: true,
        navigationControlRevealedLinkCount: 0,
        navigationControlSamples: ["Menu"],
      }),
    ]);

    assert.equal(
      analysis?.observations.find(
        (observation) => observation.id === "navigation-availability",
      )?.status,
      "needs_review",
    );
  });

  it("requires adequate contrast measurement coverage", () => {
    const insufficient = buildVisualDesignAnalysis([
      viewport("mobile", { textElementCount: 20, contrastTextCount: 15 }),
    ]);
    const sufficient = buildVisualDesignAnalysis([
      viewport("mobile", { textElementCount: 20, contrastTextCount: 16 }),
    ]);

    assert.equal(
      insufficient?.observations.find(
        (observation) => observation.id === "text-contrast",
      )?.status,
      "unknown",
    );
    assert.equal(
      sufficient?.observations.find(
        (observation) => observation.id === "text-contrast",
      )?.status,
      "passed",
    );
  });

  it("ignores document-width drift without a measurable overflow source", () => {
    const clipped = buildVisualDesignAnalysis([
      viewport("mobile", {
        documentWidth: 430,
        horizontalOverflowElementCount: 0,
      }),
    ]);
    const genuine = buildVisualDesignAnalysis([
      viewport("mobile", {
        documentWidth: 430,
        horizontalOverflowElementCount: 1,
        horizontalOverflowElementSamples: [
          { label: "Book carousel", width: 430, height: 80 },
        ],
      }),
    ]);

    assert.equal(
      clipped?.observations.find(
        (observation) => observation.id === "horizontal-overflow",
      )?.status,
      "passed",
    );
    assert.equal(
      genuine?.observations.find(
        (observation) => observation.id === "horizontal-overflow",
      )?.status,
      "needs_review",
    );
  });

  it("retains collection errors when no rendered viewport could be inspected", () => {
    const analysis = buildVisualDesignAnalysis([], ["mobile: unavailable"]);

    assert.equal(analysis?.status, "partial");
    assert.deepEqual(analysis?.viewports, []);
    assert.deepEqual(analysis?.errors, ["mobile: unavailable"]);
  });

  it("returns null when collection was never attempted", () => {
    assert.equal(buildVisualDesignAnalysis([]), null);
  });
});

describe("getVisualDesignAnalysis", () => {
  it("reads the versioned analysis from crawl diagnostics", () => {
    const analysis = buildVisualDesignAnalysis([viewport()]);

    assert.deepEqual(
      getVisualDesignAnalysis({ visualDesignAnalysis: analysis }),
      analysis,
    );
  });

  it("rejects unknown or incomplete diagnostic structures", () => {
    assert.equal(getVisualDesignAnalysis(null), null);
    assert.equal(
      getVisualDesignAnalysis({
        visualDesignAnalysis: { version: "future-version" },
      }),
      null,
    );
  });
});
