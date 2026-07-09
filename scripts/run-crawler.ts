import "dotenv/config";

import { crawlReportWebsite } from "@/lib/crawler/service.core";
import { prisma } from "@/lib/db/prisma.core";
import { getWebsiteDomain, normalizeWebsiteUrl } from "@/lib/urls/normalize";
import { validateUrlForScan } from "@/lib/urls/security";

async function main() {
  const inputUrl = process.argv[2] ?? "https://example.com";
  const security = await validateUrlForScan(inputUrl);

  if (!security.ok) {
    throw new Error(security.message);
  }

  const normalizedUrl = normalizeWebsiteUrl(security.finalUrl);
  const report = await prisma.report.create({
    data: {
      url: inputUrl,
      normalizedUrl,
      domain: getWebsiteDomain(normalizedUrl),
      authorType: "Not Sure",
      websiteGoal: "Get general critique",
    },
  });

  const result = await crawlReportWebsite(report.id);

  console.log(
    JSON.stringify(
      {
        reportId: result.reportId,
        pagesSaved: result.pagesSaved,
        crawledUrls: result.crawledUrls,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
