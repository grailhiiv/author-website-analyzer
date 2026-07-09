const privateIpv4Ranges = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
];

const trackingParams = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "msclkid",
]);

function withProtocol(value: string) {
  return /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
}

export function isBlockedHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized === "[::1]"
  ) {
    return true;
  }

  return privateIpv4Ranges.some((range) => range.test(normalized));
}

export function normalizeWebsiteUrl(value: string) {
  const parsed = new URL(withProtocol(value.trim()));

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed.");
  }

  parsed.protocol = "https:";
  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();

  for (const key of Array.from(parsed.searchParams.keys())) {
    const normalizedKey = key.toLowerCase();

    if (normalizedKey.startsWith("utm_") || trackingParams.has(normalizedKey)) {
      parsed.searchParams.delete(key);
    }
  }

  parsed.searchParams.sort();

  if (parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  return parsed.toString();
}

export function getWebsiteDomain(normalizedUrl: string) {
  return new URL(normalizedUrl).hostname;
}
