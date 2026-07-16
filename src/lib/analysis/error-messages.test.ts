import assert from "node:assert/strict";
import test from "node:test";

import {
  GENERIC_PUBLIC_ANALYSIS_ERROR,
  getAnalysisErrorMessage,
  getPublicAnalysisErrorMessage,
} from "@/lib/analysis/error-messages";

test("analysis errors retain a useful internal message", () => {
  assert.equal(
    getAnalysisErrorMessage(new Error("Internal failure")),
    "Internal failure",
  );
  assert.equal(
    getAnalysisErrorMessage(null),
    "The analysis job could not be completed.",
  );
});

test("known scan failures remain helpful to the public", () => {
  const message = "The homepage could not be read well enough to analyze.";

  assert.equal(getPublicAnalysisErrorMessage(message), message);
});

test("analysis timeouts receive a concise public explanation", () => {
  assert.equal(
    getPublicAnalysisErrorMessage(
      "The website analysis exceeded the maximum allowed runtime.",
    ),
    "The website took too long to analyze. Please try the scan again.",
  );
});

test("internal framework and database errors are not exposed publicly", () => {
  assert.equal(
    getPublicAnalysisErrorMessage(
      "Invalid __TURBOPACK__ Prisma invocation. Expected CheckResultState.",
    ),
    GENERIC_PUBLIC_ANALYSIS_ERROR,
  );
});
