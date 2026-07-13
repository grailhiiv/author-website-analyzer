-- Align databases created before the report categories were renamed.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_enum
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
        WHERE pg_type.typname = 'ReportCategory'
          AND pg_enum.enumlabel = 'BOOK_PROMOTION'
    ) THEN
        ALTER TYPE "ReportCategory" RENAME VALUE 'BOOK_PROMOTION' TO 'BOOK_VISIBILITY';
        ALTER TYPE "ReportCategory" RENAME VALUE 'READER_CONVERSION' TO 'READER_ENGAGEMENT';
        ALTER TYPE "ReportCategory" RENAME VALUE 'SEO_DISCOVERABILITY' TO 'SEARCH_VISIBILITY';
        ALTER TYPE "ReportCategory" RENAME VALUE 'MOBILE_ACCESSIBILITY' TO 'MOBILE_PERFORMANCE';
        ALTER TYPE "ReportCategory" RENAME VALUE 'PERFORMANCE_HEALTH' TO 'TECHNICAL_HEALTH';
        ALTER TYPE "ReportCategory" RENAME VALUE 'TRUST_CREDIBILITY' TO 'AUTHOR_TRUST';
        ALTER TYPE "ReportCategory" RENAME VALUE 'MAINTENANCE_RISK' TO 'SITE_USABILITY';
    END IF;
END $$;
