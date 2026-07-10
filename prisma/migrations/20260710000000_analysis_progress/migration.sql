-- Persist real analysis stages, completion percentage, and measured stage times.
ALTER TABLE "AnalysisJob"
ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'QUEUED',
ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "timingsJson" JSONB;
