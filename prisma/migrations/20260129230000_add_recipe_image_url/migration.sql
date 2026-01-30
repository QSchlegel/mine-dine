-- Ensure imageUrl exists (safe if already added)
ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
