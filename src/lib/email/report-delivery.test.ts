import assert from "node:assert/strict";
import { test } from "node:test";

import { buildFullReportEmail } from "@/lib/email/report-delivery.core";

test("buildFullReportEmail includes the PDF notice and online report link", () => {
  const message = buildFullReportEmail({
    recipientName: "Jane <Writer>",
    domain: "jane-author.test",
    reportUrl: "https://reports.example.com/report/jane-author.test",
  });

  assert.match(message.subject, /jane-author\.test/);
  assert.match(message.text, /attached as a PDF/);
  assert.match(message.text, /https:\/\/reports\.example\.com\/report\/jane-author\.test/);
  assert.match(message.html, /Jane &lt;Writer&gt;/);
  assert.doesNotMatch(message.html, /Jane <Writer>/);
});
