import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  buildVisualDesignAnalysis,
  type VisualDesignObservation,
  type VisualViewportEvidence,
  type VisualViewportVariant,
} from "@/lib/screenshots/visual-design";

type CalibrationCase = {
  id: string;
  viewport: VisualViewportVariant;
  observationId: VisualDesignObservation["id"];
  expectedStatus: VisualDesignObservation["status"];
  overrides: Partial<VisualViewportEvidence>;
};

const fixturePath = new URL(
  "../../../benchmarks/author-sites/fixtures/visual-check-calibration.json",
  import.meta.url,
);
const calibrationCases = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as CalibrationCase[];

function viewport(
  variant: VisualViewportVariant,
  overrides: Partial<VisualViewportEvidence>,
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

for (const calibrationCase of calibrationCases) {
  test(`visual calibration fixture: ${calibrationCase.id}`, () => {
    const analysis = buildVisualDesignAnalysis([
      viewport(calibrationCase.viewport, calibrationCase.overrides),
    ]);
    const observation = analysis?.observations.find(
      (candidate) =>
        candidate.id === calibrationCase.observationId &&
        candidate.viewport === calibrationCase.viewport,
    );

    assert.equal(observation?.status, calibrationCase.expectedStatus);
  });
}
