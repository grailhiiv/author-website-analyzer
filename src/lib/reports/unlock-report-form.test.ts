import assert from "node:assert/strict";
import test from "node:test";

import { parseUnlockReportFormData } from "@/lib/reports/unlock-report-form";

function createUnlockFormData(consent?: string) {
  const formData = new FormData();
  formData.set("reportId", "report-123");
  formData.set("fullName", "James Author");
  formData.set("email", "james@example.com");

  if (consent !== undefined) {
    formData.set("consent", consent);
  }

  return formData;
}

test("accepts an unchecked optional marketing consent checkbox", () => {
  const parsed = parseUnlockReportFormData(createUnlockFormData());

  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.consent, undefined);
  }
});

test("accepts a checked marketing consent checkbox", () => {
  const parsed = parseUnlockReportFormData(createUnlockFormData("on"));

  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.consent, "on");
  }
});

test("rejects an unexpected marketing consent value", () => {
  const parsed = parseUnlockReportFormData(createUnlockFormData("yes"));

  assert.equal(parsed.success, false);
});
