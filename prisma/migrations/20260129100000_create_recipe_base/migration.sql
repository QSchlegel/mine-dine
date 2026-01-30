-- Create recipe core tables before stats/usage

CREATE TABLE "Recipe" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "servings" INTEGER,
  "prepTime" TEXT,
  "cookTime" TEXT,
  "ingredients" JSONB NOT NULL,
  "steps" JSONB NOT NULL,
  "tags" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecipeComment" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecipeComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecipeLike" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecipeLike_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "Recipe_authorId_idx" ON "Recipe"("authorId");
CREATE INDEX "Recipe_isPublic_idx" ON "Recipe"("isPublic");
CREATE INDEX "Recipe_createdAt_idx" ON "Recipe"("createdAt");

CREATE INDEX "RecipeComment_recipeId_idx" ON "RecipeComment"("recipeId");
CREATE INDEX "RecipeComment_userId_idx" ON "RecipeComment"("userId");

CREATE UNIQUE INDEX "RecipeLike_recipeId_userId_key" ON "RecipeLike"("recipeId", "userId");
CREATE INDEX "RecipeLike_recipeId_idx" ON "RecipeLike"("recipeId");
CREATE INDEX "RecipeLike_userId_idx" ON "RecipeLike"("userId");

-- Foreign keys
ALTER TABLE "Recipe"
  ADD CONSTRAINT "Recipe_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecipeComment"
  ADD CONSTRAINT "RecipeComment_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "RecipeComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecipeLike"
  ADD CONSTRAINT "RecipeLike_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "RecipeLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Trigger to keep updatedAt fresh
CREATE OR REPLACE FUNCTION update_recipe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipe_updated_at
BEFORE UPDATE ON "Recipe"
FOR EACH ROW EXECUTE FUNCTION update_recipe_updated_at();
