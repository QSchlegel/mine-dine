DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GuestSentiment') THEN
        CREATE TYPE "GuestSentiment" AS ENUM ('LIKE', 'DISLIKE');
    END IF;
END $$;

-- AlterTable
ALTER TABLE "Recipe" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RecipeComment" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RecipeLike" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RecipeUsage" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GuestReview" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "dinnerId" TEXT NOT NULL,
    "sentiment" "GuestSentiment" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestReview_bookingId_key" ON "GuestReview"("bookingId");

-- CreateIndex
CREATE INDEX "GuestReview_hostId_idx" ON "GuestReview"("hostId");

-- CreateIndex
CREATE INDEX "GuestReview_guestId_idx" ON "GuestReview"("guestId");

-- CreateIndex
CREATE INDEX "GuestReview_dinnerId_idx" ON "GuestReview"("dinnerId");

-- CreateIndex
CREATE INDEX "GuestReview_sentiment_idx" ON "GuestReview"("sentiment");

-- Avoid failing if the index already exists (some environments may have it)
CREATE UNIQUE INDEX IF NOT EXISTS "Review_tipPaymentIntentId_key" ON "Review"("tipPaymentIntentId");

-- AddForeignKey
ALTER TABLE "GuestReview" ADD CONSTRAINT "GuestReview_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestReview" ADD CONSTRAINT "GuestReview_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "Dinner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestReview" ADD CONSTRAINT "GuestReview_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestReview" ADD CONSTRAINT "GuestReview_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
