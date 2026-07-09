import dns from "node:dns/promises";
import net from "node:net";

import { normalizeWebsiteUrl } from "@/lib/urls/normalize";

const DEFAULT_REDIRECT_LIMIT = 5;
const DEFAULT_TIMEOUT_MS = 5000;

type ResolveHostname = (hostname: string) => Promise<string[]>;
type FetchImplementation = (
  input: string,
  init: RequestInit
) => Promise<Response>;

type UrlSecurityOptions = {
  redirectLimit?: number;
  timeoutMs?: number;
  resolveHostname?: ResolveHostname;
  fetchImplementation?: FetchImplementation;
};

export type UrlSecurityValidationResult =
  | {
      ok: true;
      normalizedUrl: string;
      finalUrl: string;
      domain: string;
      redirects: string[];
    }
  | {
      ok: false;
      message: string;
    };

function cleanHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
}

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);

  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isBlockedIpv6(address: string) {
  const normalized = cleanHostname(address);

  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("::ffff:")
  ) {
    return true;
  }

  const firstHextetText = normalized.split(":")[0];
  const firstHextet = Number.parseInt(firstHextetText, 16);

  if (!Number.isFinite(firstHextet)) {
    return false;
  }

  return (
    // fc00::/7 unique local addresses.
    (firstHextet & 0xfe00) === 0xfc00 ||
    // fe80::/10 link-local addresses.
    (firstHextet & 0xffc0) === 0xfe80 ||
    // fec0::/10 deprecated site-local addresses.
    (firstHextet & 0xffc0) === 0xfec0
  );
}

function isBlockedHostOrAddress(value: string) {
  const hostname = cleanHostname(value);
  const ipVersion = net.isIP(hostname);

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return true;
  }

  if (ipVersion === 4) {
    return isPrivateIpv4(hostname);
  }

  if (ipVersion === 6) {
    return isBlockedIpv6(hostname);
  }

  return false;
}

function parseHttpUrl(value: string) {
  try {
    const normalizedUrl = normalizeWebsiteUrl(value);
    const parsedUrl = new URL(normalizedUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        ok: false as const,
        message: "Enter a website URL that starts with http or https.",
      };
    }

    return {
      ok: true as const,
      url: parsedUrl,
      normalizedUrl,
    };
  } catch {
    return {
      ok: false as const,
      message: "Enter a valid website URL.",
    };
  }
}

async function defaultResolveHostname(hostname: string) {
  const records = await dns.lookup(hostname, {
    all: true,
    verbatim: true,
  });

  return records.map((record) => record.address);
}

async function resolveAndValidateHostname(
  hostname: string,
  resolveHostname: ResolveHostname
) {
  if (isBlockedHostOrAddress(hostname)) {
    return "Enter a public website URL. Local and private network addresses are not allowed.";
  }

  if (net.isIP(cleanHostname(hostname))) {
    return null;
  }

  try {
    const addresses = await resolveHostname(hostname);

    if (addresses.length === 0) {
      return "We could not verify that website address. Check the URL and try again.";
    }

    if (addresses.some(isBlockedHostOrAddress)) {
      return "That website points to a private or local network address, so it cannot be scanned.";
    }

    return null;
  } catch {
    return "We could not verify that website address. Check the URL and try again.";
  }
}

async function fetchWithTimeout(
  fetchImplementation: FetchImplementation,
  url: string,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImplementation(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "GrailHiiv Author Website Analyzer",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function validateUrlForScan(
  value: string,
  options: UrlSecurityOptions = {}
): Promise<UrlSecurityValidationResult> {
  const redirectLimit = options.redirectLimit ?? DEFAULT_REDIRECT_LIMIT;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const resolveHostname = options.resolveHostname ?? defaultResolveHostname;
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const parsed = parseHttpUrl(value);

  if (!parsed.ok) {
    return parsed;
  }

  let currentUrl = parsed.url;
  const normalizedUrl = parsed.normalizedUrl;
  const redirects: string[] = [];

  for (let redirectCount = 0; redirectCount <= redirectLimit; redirectCount++) {
    const hostnameError = await resolveAndValidateHostname(
      currentUrl.hostname,
      resolveHostname
    );

    if (hostnameError) {
      return {
        ok: false,
        message: hostnameError,
      };
    }

    let response: Response;

    try {
      response = await fetchWithTimeout(
        fetchImplementation,
        currentUrl.toString(),
        timeoutMs
      );
    } catch {
      return {
        ok: false,
        message:
          "We could not reach that website quickly enough. Check the URL and try again.",
      };
    }

    if (
      response.status < 300 ||
      response.status > 399 ||
      !response.headers.has("location")
    ) {
      return {
        ok: true,
        normalizedUrl,
        finalUrl: currentUrl.toString(),
        domain: currentUrl.hostname,
        redirects,
      };
    }

    if (redirectCount === redirectLimit) {
      return {
        ok: false,
        message:
          "That website redirects too many times. Please enter the final author website URL.",
      };
    }

    const location = response.headers.get("location");

    if (!location) {
      return {
        ok: false,
        message: "That website returned an invalid redirect.",
      };
    }

    const nextParsed = parseHttpUrl(new URL(location, currentUrl).toString());

    if (!nextParsed.ok) {
      return {
        ok: false,
        message: "That website redirects to an unsafe URL.",
      };
    }

    currentUrl = nextParsed.url;
    redirects.push(currentUrl.toString());
  }

  return {
    ok: false,
    message: "That website redirects too many times.",
  };
}

export const urlSecurityTestExports = {
  isBlockedHostOrAddress,
  isPrivateIpv4,
  isBlockedIpv6,
};
