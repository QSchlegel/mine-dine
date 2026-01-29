-- Add recipe stats fields
ALTER TABLE "Recipe" 
  ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "useCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "experience" INTEGER NOT NULL DEFAULT 0;

-- Create recipe usage table
CREATE TABLE "RecipeUsage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipeId" TEXT NOT NULL,
  "dinnerId" TEXT,
  "count" INTEGER NOT NULL DEFAULT 1,
  "note" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecipeUsage_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RecipeUsage_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "Dinner" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "RecipeUsage_recipeId_idx" ON "RecipeUsage" ("recipeId");
CREATE INDEX "RecipeUsage_dinnerId_idx" ON "RecipeUsage" ("dinnerId");

-- Trigger to keep updatedAt fresh (Postgres)
CREATE OR REPLACE FUNCTION update_recipe_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipe_usage_updated_at
BEFORE UPDATE ON "RecipeUsage"
FOR EACH ROW EXECUTE FUNCTION update_recipe_usage_updated_at();
