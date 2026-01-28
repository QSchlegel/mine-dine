/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('EVERYONE', 'ENGAGED_ONLY');

-- CreateEnum
CREATE TYPE "DinnerModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PlanningMode" AS ENUM ('MANUAL', 'AI_ASSISTED', 'AI_GENERATED');

-- CreateEnum
CREATE TYPE "RevenueShareType" AS ENUM ('ONBOARDING', 'REFERRAL');

-- CreateEnum
CREATE TYPE "RevenueShareStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MODERATOR';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "referralCodeUsed" TEXT;

-- AlterTable
ALTER TABLE "Dinner" ADD COLUMN     "aiPlanData" JSONB,
ADD COLUMN     "ingredientList" JSONB,
ADD COLUMN     "menuItems" JSONB,
ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedById" TEXT,
ADD COLUMN     "moderationStatus" "DinnerModerationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "planningMode" "PlanningMode" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "prepTimeline" JSONB;

-- AlterTable
ALTER TABLE "HostApplication" ADD COLUMN     "onboardedById" TEXT;

-- AlterTable
ALTER TABLE "Passkey" ADD COLUMN     "aaguid" TEXT,
ADD COLUMN     "backedUp" BOOLEAN,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "transports" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false,
ADD COLUMN     "hasCompletedGuestTour" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasCompletedHostTour" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "helpPreferences" JSONB,
ADD COLUMN     "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'EVERYONE',
ADD COLUMN     "referralCode" TEXT;

-- AlterTable
ALTER TABLE "Verification" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "DinnerPlan" (
    "id" TEXT NOT NULL,
    "dinnerId" TEXT NOT NULL,
    "menuItems" JSONB NOT NULL,
    "ingredientList" JSONB NOT NULL,
    "prepTimeline" JSONB NOT NULL,
    "pricingBreakdown" JSONB NOT NULL,
    "aiPrompt" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DinnerPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueShare" (
    "id" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "shareType" "RevenueShareType" NOT NULL,
    "basePercentage" DOUBLE PRECISION NOT NULL,
    "bookingNumber" INTEGER NOT NULL,
    "actualPercentage" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "RevenueShareStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DinnerPlan_dinnerId_key" ON "DinnerPlan"("dinnerId");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueShare_bookingId_key" ON "RevenueShare"("bookingId");

-- CreateIndex
CREATE INDEX "RevenueShare_moderatorId_idx" ON "RevenueShare"("moderatorId");

-- CreateIndex
CREATE INDEX "RevenueShare_status_idx" ON "RevenueShare"("status");

-- CreateIndex
CREATE INDEX "RevenueShare_shareType_idx" ON "RevenueShare"("shareType");

-- CreateIndex
CREATE INDEX "RevenueShare_createdAt_idx" ON "RevenueShare"("createdAt");

-- CreateIndex
CREATE INDEX "Booking_referralCodeUsed_idx" ON "Booking"("referralCodeUsed");

-- CreateIndex
CREATE INDEX "Dinner_moderationStatus_idx" ON "Dinner"("moderationStatus");

-- CreateIndex
CREATE INDEX "HostApplication_onboardedById_idx" ON "HostApplication"("onboardedById");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "HostApplication" ADD CONSTRAINT "HostApplication_onboardedById_fkey" FOREIGN KEY ("onboardedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dinner" ADD CONSTRAINT "Dinner_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DinnerPlan" ADD CONSTRAINT "DinnerPlan_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "Dinner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueShare" ADD CONSTRAINT "RevenueShare_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueShare" ADD CONSTRAINT "RevenueShare_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Passkey_credentialId_idx" RENAME TO "Passkey_credentialID_idx";

-- RenameIndex
ALTER INDEX "Passkey_credentialId_key" RENAME TO "Passkey_credentialID_key";
