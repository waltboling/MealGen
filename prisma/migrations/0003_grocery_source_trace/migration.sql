ALTER TABLE "GroceryListItem"
  ADD COLUMN "sourceRecipeNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "sourceSummary" TEXT;
