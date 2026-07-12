import Landing from "./components/Landing";
import WebsiteAuditResult from "./components/WebsiteAuditResult";
import { normalizeReportDomain } from "@/lib/reports/domain";

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string | string[] }>;
}) => {
  const params = await searchParams;
  const rawDomain = Array.isArray(params.domain)
    ? params.domain[0]
    : params.domain;
  const domain = rawDomain ? normalizeReportDomain(rawDomain) : null;

  return (
    <Landing
      activeDomain={domain ?? undefined}
      result={domain ? <WebsiteAuditResult domain={domain} /> : undefined}
    />
  );
};

export default Page;
