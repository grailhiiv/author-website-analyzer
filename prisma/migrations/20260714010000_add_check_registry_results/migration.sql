CREATE TYPE "FindingOrigin" AS ENUM ('DETERMINISTIC_SCORE', 'SYSTEM_DIAGNOSTIC');
CREATE TYPE "CheckResultState" AS ENUM ('PASS', 'FAIL', 'UNKNOWN', 'NOT_APPLICABLE');

ALTER TABLE "ReportFinding"
ADD COLUMN "checkId" TEXT,
ADD COLUMN "origin" "FindingOrigin" NOT NULL DEFAULT 'SYSTEM_DIAGNOSTIC';

-- Existing deterministic scoring findings used priorities 1-7. Pipeline and
-- collection diagnostics use priorities 8-9, so preserve those separately.
UPDATE "ReportFinding"
SET "origin" = 'DETERMINISTIC_SCORE'
WHERE "priority" <= 7;

CREATE INDEX "ReportFinding_checkId_idx" ON "ReportFinding"("checkId");
CREATE INDEX "ReportFinding_origin_idx" ON "ReportFinding"("origin");

CREATE TABLE "ReportCheckResult" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "checkVersion" INTEGER NOT NULL,
    "registryVersion" INTEGER NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "state" "CheckResultState" NOT NULL,
    "availablePoints" DOUBLE PRECISION NOT NULL,
    "earnedPoints" DOUBLE PRECISION NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "evidenceReferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportCheckResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReportCheckResult_reportId_checkId_key"
ON "ReportCheckResult"("reportId", "checkId");
CREATE INDEX "ReportCheckResult_checkId_idx" ON "ReportCheckResult"("checkId");
CREATE INDEX "ReportCheckResult_category_idx" ON "ReportCheckResult"("category");
CREATE INDEX "ReportCheckResult_state_idx" ON "ReportCheckResult"("state");

ALTER TABLE "ReportCheckResult"
ADD CONSTRAINT "ReportCheckResult_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
