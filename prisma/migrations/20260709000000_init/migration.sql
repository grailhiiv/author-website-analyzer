-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "AnalysisJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('BRAND_CLARITY', 'BOOK_PROMOTION', 'READER_CONVERSION', 'SEO_DISCOVERABILITY', 'MOBILE_ACCESSIBILITY', 'PERFORMANCE_HEALTH', 'TRUST_CREDIBILITY', 'MAINTENANCE_RISK');

-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('HOME', 'ABOUT', 'BOOKS', 'CONTACT', 'NEWSLETTER', 'BLOG', 'MEDIA_KIT', 'EVENTS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SalesLeadStatus" AS ENUM ('NEW', 'REVIEWED', 'CONTACTED', 'INTERESTED', 'NOT_A_FIT', 'CONVERTED');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "websiteGoal" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'QUEUED',
    "overallScore" INTEGER,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisJob" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" "AnalysisJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "lockedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "websiteGoal" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageScanned" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pageType" "PageType" NOT NULL DEFAULT 'UNKNOWN',
    "statusCode" INTEGER,
    "title" TEXT,
    "metaDescription" TEXT,
    "h1" TEXT,
    "headingsJson" JSONB,
    "linksJson" JSONB,
    "imagesJson" JSONB,
    "formsJson" JSONB,
    "wordCount" INTEGER,
    "screenshotUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageScanned_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportScore" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportFinding" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalAudit" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "mobilePerformance" INTEGER,
    "desktopPerformance" INTEGER,
    "mobileAccessibility" INTEGER,
    "desktopAccessibility" INTEGER,
    "mobileSeo" INTEGER,
    "desktopSeo" INTEGER,
    "mobileBestPractices" INTEGER,
    "desktopBestPractices" INTEGER,
    "lighthouseJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicalAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSalesNote" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "manualNote" TEXT NOT NULL DEFAULT '',
    "leadStatus" "SalesLeadStatus" NOT NULL DEFAULT 'NEW',
    "serviceFit" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "outreachMessage" TEXT,
    "outreachSource" TEXT,
    "outreachGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSalesNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Report_domain_idx" ON "Report"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisJob_reportId_key" ON "AnalysisJob"("reportId");

-- CreateIndex
CREATE INDEX "AnalysisJob_status_nextRunAt_idx" ON "AnalysisJob"("status", "nextRunAt");

-- CreateIndex
CREATE INDEX "AnalysisJob_lockedAt_idx" ON "AnalysisJob"("lockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_reportId_key" ON "Lead"("reportId");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "PageScanned_reportId_idx" ON "PageScanned"("reportId");

-- CreateIndex
CREATE INDEX "PageScanned_pageType_idx" ON "PageScanned"("pageType");

-- CreateIndex
CREATE INDEX "ReportScore_category_idx" ON "ReportScore"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ReportScore_reportId_category_key" ON "ReportScore"("reportId", "category");

-- CreateIndex
CREATE INDEX "ReportFinding_reportId_idx" ON "ReportFinding"("reportId");

-- CreateIndex
CREATE INDEX "ReportFinding_category_idx" ON "ReportFinding"("category");

-- CreateIndex
CREATE INDEX "ReportFinding_severity_idx" ON "ReportFinding"("severity");

-- CreateIndex
CREATE INDEX "ReportFinding_priority_idx" ON "ReportFinding"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalAudit_reportId_key" ON "TechnicalAudit"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSalesNote_reportId_key" ON "ReportSalesNote"("reportId");

-- CreateIndex
CREATE INDEX "ReportSalesNote_leadStatus_idx" ON "ReportSalesNote"("leadStatus");

-- CreateIndex
CREATE INDEX "ReportSalesNote_priority_idx" ON "ReportSalesNote"("priority");

-- CreateIndex
CREATE INDEX "ReportSalesNote_updatedAt_idx" ON "ReportSalesNote"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- AddForeignKey
ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageScanned" ADD CONSTRAINT "PageScanned_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportScore" ADD CONSTRAINT "ReportScore_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportFinding" ADD CONSTRAINT "ReportFinding_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalAudit" ADD CONSTRAINT "TechnicalAudit_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSalesNote" ADD CONSTRAINT "ReportSalesNote_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
