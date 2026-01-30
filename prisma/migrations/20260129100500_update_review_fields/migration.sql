-- Align Review table with current Prisma schema

ALTER TABLE "Review" DROP COLUMN IF EXISTS "rating";

ALTER TABLE "Review"
  ADD COLUMN IF NOT EXISTS "cleanlinessStars" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "hospitalityStars" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tasteStars" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tipPaymentIntentId" TEXT,
  ADD COLUMN IF NOT EXISTS "tipStars" INTEGER NOT NULL DEFAULT 0;

-- Indexes and constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Review_tipPaymentIntentId_key" ON "Review"("tipPaymentIntentId") WHERE "tipPaymentIntentId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Review_cleanlinessStars_idx" ON "Review"("cleanlinessStars");
CREATE INDEX IF NOT EXISTS "Review_hospitalityStars_idx" ON "Review"("hospitalityStars");
CREATE INDEX IF NOT EXISTS "Review_tasteStars_idx" ON "Review"("tasteStars");
