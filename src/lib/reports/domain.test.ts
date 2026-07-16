import assert from "node:assert/strict";
import test from "node:test";

import {
  getAdminReportPath,
  getReportDomainCandidates,
  getReportPath,
  normalizeReportDomain,
} from "@/lib/reports/domain";

test("builds distinct public and admin report paths from a domain", () => {
  assert.equal(getReportPath("authorwebsites.com"), "/report/authorwebsites.com");
  assert.equal(
    getAdminReportPath("authorwebsites.com"),
    "/reports/authorwebsites.com",
  );
});

test("normalizes report route values to their hostname", () => {
  assert.equal(
    normalizeReportDomain("https://AuthorWebsites.com/books"),
    "authorwebsites.com",
  );
});

test("builds exact and www report lookup candidates", () => {
  assert.deepEqual(getReportDomainCandidates("authorwebsites.com"), [
    "authorwebsites.com",
    "www.authorwebsites.com",
  ]);
  assert.deepEqual(getReportDomainCandidates("www.authorwebsites.com"), [
    "www.authorwebsites.com",
    "authorwebsites.com",
  ]);
});
