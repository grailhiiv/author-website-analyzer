import { captureHomepageScreenshots } from "@/lib/screenshots/capture.core";

async function main() {
  const targetUrl = process.argv[2] ?? "https://example.com";
  const websiteDomain = new URL(
    /^https?:\/\//i.test(targetUrl) ? targetUrl : `https://${targetUrl}`,
  ).hostname;
  const result = await captureHomepageScreenshots(targetUrl, {
    websiteDomain,
    timeoutMs: 15_000,
  });

  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        homepageUrl: result.homepageUrl,
        screenshots: result.screenshots,
        errors: result.errors,
      },
      null,
      2
    )
  );

  if (!result.screenshots.desktop || !result.screenshots.mobile) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
