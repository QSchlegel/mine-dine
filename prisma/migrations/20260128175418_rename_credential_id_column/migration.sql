-- Rename column from credentialId to credentialID
-- PostgreSQL will automatically update indexes that reference this column
ALTER TABLE "Passkey" RENAME COLUMN "credentialId" TO "credentialID";
