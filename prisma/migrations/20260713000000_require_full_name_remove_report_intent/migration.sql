-- The full-report CTA now captures only the author's required full name and email address.
ALTER TABLE "Report"
    DROP COLUMN "authorType",
    DROP COLUMN "websiteGoal";

ALTER TABLE "Lead"
    RENAME COLUMN "name" TO "fullName";

ALTER TABLE "Lead"
    DROP COLUMN "authorType",
    DROP COLUMN "websiteGoal";

-- Consolidate the lead pipeline into the five admin statuses used by the UI.
CREATE TYPE "SalesLeadStatus_new" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED');

ALTER TABLE "ReportSalesNote"
    ALTER COLUMN "leadStatus" DROP DEFAULT,
    ALTER COLUMN "leadStatus" TYPE "SalesLeadStatus_new"
    USING (
        CASE
            WHEN "leadStatus"::text = 'REVIEWED' THEN 'NEW'
            WHEN "leadStatus"::text = 'INTERESTED' THEN 'QUALIFIED'
            WHEN "leadStatus"::text = 'NOT_A_FIT' THEN 'CLOSED'
            ELSE "leadStatus"::text
        END
    )::"SalesLeadStatus_new";

ALTER TYPE "SalesLeadStatus" RENAME TO "SalesLeadStatus_old";
ALTER TYPE "SalesLeadStatus_new" RENAME TO "SalesLeadStatus";
DROP TYPE "SalesLeadStatus_old";

ALTER TABLE "ReportSalesNote"
    ALTER COLUMN "leadStatus" SET DEFAULT 'NEW';
