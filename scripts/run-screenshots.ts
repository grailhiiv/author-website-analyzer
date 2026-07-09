import { captureHomepageScreenshots } from "@/lib/screenshots/capture.core";

async function main() {
  const targetUrl = process.argv[2] ?? "https://example.com";
  const result = await captureHomepageScreenshots(targetUrl, {
    reportId: "manual-test",
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
