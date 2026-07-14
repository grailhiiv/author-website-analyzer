import assert from "node:assert/strict";
import test from "node:test";

import {
  validatePublicHttpUrl,
  validateUrlForScan,
} from "@/lib/urls/security";

function createOptions() {
  return {
    timeoutMs: 50,
    resolveHostname: async (hostname: string) => {
      if (hostname === "example.com") {
        return ["93.184.216.34"];
      }

      return [hostname];
    },
    fetchImplementation: async () => new Response(null, { status: 200 }),
  };
}

test("allows a valid https domain", async () => {
  const result = await validateUrlForScan("https://example.com", createOptions());

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.finalUrl, "https://example.com/");
    assert.equal(result.domain, "example.com");
  }
});

test("allows an explicit HTTPS URL", async () => {
  const result = await validateUrlForScan(
    "https://example.com/books",
    createOptions()
  );

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.normalizedUrl, "https://example.com/books");
  }
});

test("allows an explicit HTTP URL", async () => {
  const result = await validateUrlForScan(
    "http://example.com/books",
    createOptions()
  );

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.normalizedUrl, "https://example.com/books");
  }
});

test("allows and normalizes a domain without a protocol", async () => {
  const result = await validateUrlForScan("example.com", createOptions());

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.normalizedUrl, "https://example.com/");
  }
});

test("blocks localhost", async () => {
  const result = await validateUrlForScan("http://localhost", createOptions());

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /public website URL/i);
  }
});

test("blocks 127.0.0.1", async () => {
  const result = await validateUrlForScan("http://127.0.0.1", createOptions());

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /public website URL/i);
  }
});

test("blocks private IP addresses", async () => {
  const result = await validateUrlForScan("https://192.168.1.20", createOptions());

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /public website URL/i);
  }
});

test("blocks file URLs", async () => {
  const result = await validateUrlForScan("file:///etc/passwd", createOptions());

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /valid website URL|http or https/i);
  }
});

test("blocks javascript URLs", async () => {
  const result = await validateUrlForScan("javascript:alert(1)", createOptions());

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /valid website URL|http or https/i);
  }
});

test("blocks other unsafe protocols", async () => {
  const urls = [
    "ftp://example.com/books",
    "data:text/html,<h1>Bad</h1>",
  ];

  for (const url of urls) {
    const result = await validateUrlForScan(url, createOptions());

    assert.equal(result.ok, false, `${url} should be blocked`);

    if (!result.ok) {
      assert.match(result.message, /valid website URL|http or https/i);
    }
  }
});

test("blocks malformed URLs", async () => {
  const result = await validateUrlForScan("https://exa mple.com", createOptions());

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /valid website URL/i);
  }
});

test("blocks public domains that resolve to private IP addresses", async () => {
  const result = await validateUrlForScan("https://example.com", {
    ...createOptions(),
    resolveHostname: async () => ["10.0.0.5"],
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /private or local network address/i);
  }
});

test("reports request timeouts separately from other connection failures", async () => {
  const result = await validateUrlForScan("https://example.com", {
    ...createOptions(),
    fetchImplementation: async () => {
      throw new DOMException("The request was aborted", "AbortError");
    },
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /quickly enough/i);
  }
});

test("reports wrapped TLS certificate failures with an actionable diagnosis", async () => {
  const certificateError = Object.assign(new Error("certificate mismatch"), {
    code: "ERR_TLS_CERT_ALTNAME_INVALID",
  });
  const result = await validateUrlForScan("https://example.com", {
    ...createOptions(),
    fetchImplementation: async () => {
      throw new TypeError("fetch failed", { cause: certificateError });
    },
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /certificate is invalid or does not match/i);
    assert.match(result.message, /site owner needs to repair/i);
  }
});

test("uses a secure connection message for non-timeout network failures", async () => {
  const result = await validateUrlForScan("https://example.com", {
    ...createOptions(),
    fetchImplementation: async () => {
      throw new TypeError("fetch failed");
    },
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /establish a secure connection/i);
  }
});

test("blocks submitted website URLs with embedded credentials", async () => {
  const result = await validateUrlForScan(
    "https://user:secret@example.com/books",
    createOptions(),
  );

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /credentials are not allowed/i);
  }
});

test("browser request validation checks DNS without issuing a fetch", async () => {
  let resolved = 0;
  const result = await validatePublicHttpUrl("https://example.com/app.js", {
    resolveHostname: async () => {
      resolved += 1;
      return ["93.184.216.34"];
    },
  });

  assert.equal(result.ok, true);
  assert.equal(resolved, 1);
});

test("browser request validation blocks credentials and reserved networks", async () => {
  const credentials = await validatePublicHttpUrl(
    "https://user:secret@example.com/",
    { resolveHostname: async () => ["93.184.216.34"] },
  );
  const carrierNat = await validatePublicHttpUrl("http://100.64.0.1/");
  const multicast = await validatePublicHttpUrl("http://224.0.0.1/");

  assert.equal(credentials.ok, false);
  assert.equal(carrierNat.ok, false);
  assert.equal(multicast.ok, false);
});

test("blocks URLs that exceed the redirect limit", async () => {
  const result = await validateUrlForScan("https://example.com", {
    ...createOptions(),
    redirectLimit: 1,
    fetchImplementation: async () =>
      new Response(null, {
        status: 302,
        headers: {
          location: "https://example.com/next",
        },
      }),
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /redirects too many times/i);
  }
});

test("blocks redirects that introduce embedded credentials", async () => {
  const result = await validateUrlForScan("https://example.com", {
    ...createOptions(),
    fetchImplementation: async () =>
      new Response(null, {
        status: 302,
        headers: {
          location: "https://user:secret@example.com/private",
        },
      }),
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.message, /unsafe URL/i);
  }
});

for (const path of ["contact", "about"]) {
  test(`preserves the final trailing slash when /${path} redirects to /${path}/`, async () => {
    const result = await validateUrlForScan(`https://example.com/${path}`, {
      ...createOptions(),
      fetchImplementation: async (input) => {
        if (input === `https://example.com/${path}`) {
          return new Response(null, {
            status: 301,
            headers: {
              location: `/${path}/`,
            },
          });
        }

        return new Response(null, { status: 200 });
      },
    });

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.finalUrl, `https://example.com/${path}/`);
      assert.deepEqual(result.redirects, [`https://example.com/${path}/`]);
    }
  });
}
