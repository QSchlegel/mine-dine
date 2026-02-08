-- CreateEnum
CREATE TYPE "DinnerVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Dinner" ADD COLUMN "visibility" "DinnerVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "Dinner_visibility_idx" ON "Dinner"("visibility");
