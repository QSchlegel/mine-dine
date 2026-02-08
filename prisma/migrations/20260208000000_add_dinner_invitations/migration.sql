-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "DinnerInvitation" (
    "id" TEXT NOT NULL,
    "dinnerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DinnerInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DinnerInvitation_token_key" ON "DinnerInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "DinnerInvitation_dinnerId_email_key" ON "DinnerInvitation"("dinnerId", "email");

-- CreateIndex
CREATE INDEX "DinnerInvitation_dinnerId_idx" ON "DinnerInvitation"("dinnerId");

-- CreateIndex
CREATE INDEX "DinnerInvitation_token_idx" ON "DinnerInvitation"("token");

-- CreateIndex
CREATE INDEX "DinnerInvitation_email_idx" ON "DinnerInvitation"("email");

-- AddForeignKey
ALTER TABLE "DinnerInvitation" ADD CONSTRAINT "DinnerInvitation_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "Dinner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DinnerInvitation" ADD CONSTRAINT "DinnerInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DinnerInvitation" ADD CONSTRAINT "DinnerInvitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
