import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPageSpeedUrl,
  extractKeyLighthouseData,
  normalizePageSpeedScore,
  runPageSpeedAudit,
} from "@/lib/pagespeed/service.core";

function createPageSpeedResponse(overrides = {}) {
  return {
    lighthouseResult: {
      finalUrl: "https://author.test/",
      fetchTime: "2026-07-08T00:00:00.000Z",
      lighthouseVersion: "12.0.0",
      categories: {
        performance: { score: 0.86 },
        accessibility: { score: 0.92 },
        seo: { score: 1 },
        "best-practices": { score: 0.77 },
      },
      audits: {
        "first-contentful-paint": {
          id: "first-contentful-paint",
          title: "First Contentful Paint",
          score: 0.9,
          numericValue: 1100,
          displayValue: "1.1 s",
        },
        "largest-contentful-paint": {
          id: "largest-contentful-paint",
          title: "Largest Contentful Paint",
          score: 0.72,
          numericValue: 2400,
          displayValue: "2.4 s",
        },
        "total-blocking-time": {
          id: "total-blocking-time",
          title: "Total Blocking Time",
          score: 0.81,
          numericValue: 280,
          displayValue: "280 ms",
        },
        "cumulative-layout-shift": {
          id: "cumulative-layout-shift",
          title: "Cumulative Layout Shift",
          score: 1,
          numericValue: 0.02,
          displayValue: "0.02",
        },
        "speed-index": {
          id: "speed-index",
          title: "Speed Index",
          score: 0.68,
          numericValue: 3300,
          displayValue: "3.3 s",
        },
        viewport: {
          id: "viewport",
          title: "Has a viewport meta tag",
          score: 1,
        },
      },
    },
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

test("buildPageSpeedUrl adds strategy, API key, URL, and categories", () => {
  const url = buildPageSpeedUrl(
    "https://author.test/",
    "mobile",
    "test-key"
  );

  assert.equal(url.searchParams.get("url"), "https://author.test/");
  assert.equal(url.searchParams.get("key"), "test-key");
  assert.equal(url.searchParams.get("strategy"), "mobile");
  assert.deepEqual(url.searchParams.getAll("category"), [
    "performance",
    "accessibility",
    "best-practices",
    "seo",
  ]);
});

test("normalizePageSpeedScore converts Lighthouse scores to 0-100", () => {
  assert.equal(normalizePageSpeedScore(0.86), 86);
  assert.equal(normalizePageSpeedScore(1), 100);
  assert.equal(normalizePageSpeedScore(87), 87);
  assert.equal(normalizePageSpeedScore(-1), 0);
  assert.equal(normalizePageSpeedScore(1.5), 2);
  assert.equal(normalizePageSpeedScore(null), null);
});

test("extractKeyLighthouseData stores category scores and key audits", () => {
  const data = extractKeyLighthouseData("mobile", createPageSpeedResponse());

  assert.equal(data.strategy, "mobile");
  assert.equal(data.finalUrl, "https://author.test/");
  assert.deepEqual(data.categories, {
    performance: 86,
    accessibility: 92,
    seo: 100,
    bestPractices: 77,
  });
  assert.equal(data.audits["first-contentful-paint"]?.score, 90);
  assert.equal(data.audits["first-contentful-paint"]?.displayValue, "1.1 s");
  assert.equal(data.audits["largest-contentful-paint"]?.displayValue, "2.4 s");
  assert.equal(data.audits["total-blocking-time"]?.displayValue, "280 ms");
  assert.equal(data.audits["cumulative-layout-shift"]?.displayValue, "0.02");
  assert.equal(data.audits["speed-index"]?.displayValue, "3.3 s");
  assert.equal(data.audits["meta-description"], null);
});

test("runPageSpeedAudit runs mobile and desktop with mocked responses", async () => {
  const requestedStrategies: string[] = [];
  const fetchImplementation = async (input: string | URL) => {
    const url = input instanceof URL ? input : new URL(input);
    const strategy = url.searchParams.get("strategy");

    if (strategy) {
      requestedStrategies.push(strategy);
    }

    return jsonResponse(createPageSpeedResponse());
  };

  const result = await runPageSpeedAudit("https://author.test/", {
    apiKey: "test-key",
    fetchImplementation,
  });

  assert.deepEqual(requestedStrategies.sort(), ["desktop", "mobile"]);
  assert.equal(result.mobile.ok, true);
  assert.equal(result.desktop.ok, true);
  assert.equal(result.mobile.scores.performance, 86);
  assert.equal(result.desktop.scores.bestPractices, 77);
  assert.deepEqual(result.lighthouseJson.errors, {});
});

test("runPageSpeedAudit returns partial data when one strategy fails", async () => {
  const fetchImplementation = async (input: string | URL) => {
    const url = input instanceof URL ? input : new URL(input);

    if (url.searchParams.get("strategy") === "mobile") {
      return jsonResponse({ error: "quota" }, 500);
    }

    return jsonResponse(createPageSpeedResponse());
  };

  const result = await runPageSpeedAudit("https://author.test/", {
    apiKey: "test-key",
    fetchImplementation,
  });

  assert.equal(result.mobile.ok, false);
  assert.equal(result.desktop.ok, true);
  assert.equal(result.mobile.scores.performance, null);
  assert.equal(result.desktop.scores.performance, 86);
  assert.match(result.lighthouseJson.errors.mobile ?? "", /HTTP 500/);
  assert.equal(result.lighthouseJson.mobile, null);
  assert.equal(result.lighthouseJson.desktop?.categories.seo, 100);
});
