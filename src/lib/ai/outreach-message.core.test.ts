import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFallbackOutreachMessage,
  buildOutreachMessagePrompt,
  generateOutreachMessage,
  parseOutreachMessageJson,
  parseSerializedOutreachMessage,
  serializeOutreachMessage,
} from "@/lib/ai/outreach-message.core";

const outreachInput = {
  authorName: "",
  websiteUrl: "https://janewriter.test/",
  domain: "janewriter.test",
  authorType: "Fiction Author",
  websiteGoal: "Grow newsletter",
  overallScore: 48,
  serviceFit: "Newsletter setup",
  findings: [
    {
      title: "Newsletter signup was not detected",
      finding:
        "The saved scan data did not detect a newsletter form or email signup field.",
      recommendation:
        "Add a clear newsletter signup section with a simple reader benefit.",
      priority: 1,
      severity: "HIGH",
      category: "READER_ENGAGEMENT",
    },
    {
      title: "Buy links were not detected",
      finding: "The saved scan data did not detect retailer links.",
      recommendation:
        "Add a visible book section with retailer links for the featured book.",
      priority: 2,
      severity: "MEDIUM",
      category: "BOOK_VISIBILITY",
    },
    {
      title: "Meta description was not detected",
      finding: "The saved scan data did not detect a homepage meta description.",
      recommendation: "Add a concise homepage meta description.",
      priority: 3,
      severity: "LOW",
      category: "SEARCH_VISIBILITY",
    },
  ],
};

test("fallback outreach uses placeholders and top findings", () => {
  const message = buildFallbackOutreachMessage(outreachInput);

  assert.match(message.emailVersion, /Hi \[Name\]/);
  assert.match(message.shortDmVersion, /newsletter signup was not detected/i);
  assert.match(message.shortDmVersion, /buy links were not detected/i);
  assert.doesNotMatch(JSON.stringify(message), /guaranteed|massive sales/i);
});

test("outreach prompt limits findings to one or two issues", () => {
  const prompt = buildOutreachMessagePrompt(outreachInput);

  assert.match(prompt, /Newsletter signup was not detected/);
  assert.match(prompt, /Buy links were not detected/);
  assert.doesNotMatch(prompt, /Meta description was not detected/);
});

test("outreach parser validates shape and rejects exaggerated claims", () => {
  const valid = {
    emailVersion: "Hi [Name], I noticed the newsletter path could be clearer.",
    shortDmVersion: "Hi [Name], I made a quick scorecard if useful.",
    followUpVersion: "Just following up in case the scorecard would help.",
  };

  assert.equal(
    parseOutreachMessageJson(JSON.stringify(valid)).shortDmVersion,
    valid.shortDmVersion
  );

  assert.throws(
    () =>
      parseOutreachMessageJson(
        JSON.stringify({
          ...valid,
          followUpVersion: "This will create guaranteed sales.",
        })
      ),
    /unsupported sales language/i
  );
});

test("generateOutreachMessage validates mocked OpenAI JSON output", async () => {
  const aiMessage = {
    emailVersion:
      "Subject: Quick author website scorecard\n\nHi Jane,\n\nI noticed the newsletter path and book links could be clearer. I put together a short scorecard if it would be helpful.",
    shortDmVersion:
      "Hi Jane, I noticed a couple of reader journey items around newsletter signup and book links. I made a quick scorecard if useful.",
    followUpVersion:
      "Hi Jane, just following up in case the scorecard would be useful as you review your author website.",
  };
  let requestBody: Record<string, unknown> | null = null;

  const result = await generateOutreachMessage(
    {
      ...outreachInput,
      authorName: "Jane Writer",
    },
    {
      apiKey: "test-key",
      model: "test-model",
      fetchImplementation: async (_url, init) => {
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;

        return new Response(
          JSON.stringify({
            output: [
              {
                type: "message",
                content: [
                  {
                    type: "output_text",
                    text: JSON.stringify(aiMessage),
                  },
                ],
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      },
    }
  );

  assert.equal(result.source, "ai");
  assert.equal(result.message.shortDmVersion, aiMessage.shortDmVersion);
  assert.ok(requestBody);
  const body = requestBody as Record<string, unknown>;

  assert.equal(body.model, "test-model");
});

test("serialized outreach message can be parsed back", () => {
  const message = buildFallbackOutreachMessage(outreachInput);
  const serialized = serializeOutreachMessage({
    source: "fallback",
    message,
  });
  const parsed = parseSerializedOutreachMessage(serialized);

  assert.ok(parsed);
  assert.equal(parsed.kind, "admin-outreach-message");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.source, "fallback");
  assert.equal(parsed.message.emailVersion, message.emailVersion);
});
