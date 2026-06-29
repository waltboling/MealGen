CREATE TYPE "HouseholdRole" AS ENUM ('OWNER', 'ADULT', 'MEMBER', 'GUEST');
CREATE TYPE "MemberPreferenceType" AS ENUM ('LIKE', 'DISLIKE', 'ALLERGY', 'DIETARY_PREFERENCE', 'FAVORITE_CUISINE');
CREATE TYPE "SourceType" AS ENUM ('WEBSITE', 'CREATOR', 'BLOG', 'PUBLICATION', 'CHANNEL');
CREATE TYPE "MealPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'MEAL_PREP', 'OTHER');
CREATE TYPE "GroceryItemSource" AS ENUM ('GENERATED', 'MANUAL');

CREATE TABLE "UserProfile" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Household" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseholdMembership" (
  "id" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "HouseholdRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HouseholdMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseholdMember" (
  "id" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "cookingSkill" TEXT,
  "preferredSpiceLevel" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemberPreference" (
  "id" UUID NOT NULL,
  "memberId" UUID NOT NULL,
  "type" "MemberPreferenceType" NOT NULL,
  "value" TEXT NOT NULL,
  "weight" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemberPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportedRecipe" (
  "id" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "providerId" TEXT,
  "externalId" TEXT,
  "title" TEXT NOT NULL,
  "imageUrl" TEXT,
  "sourceName" TEXT,
  "authorName" TEXT,
  "sourceUrl" TEXT,
  "ingredientsJson" JSONB NOT NULL,
  "instructionsJson" JSONB NOT NULL,
  "prepMinutes" INTEGER,
  "cookMinutes" INTEGER,
  "servings" INTEGER,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "rawPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportedRecipe_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Recipe" (
  "id" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "importedRecipeId" UUID,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "sourceName" TEXT,
  "sourceUrl" TEXT,
  "authorName" TEXT,
  "prepMinutes" INTEGER,
  "cookMinutes" INTEGER,
  "servings" INTEGER NOT NULL,
  "isCustom" BOOLEAN NOT NULL DEFAULT true,
  "createdByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecipeIngredient" (
  "id" UUID NOT NULL,
  "recipeId" UUID NOT NULL,
  "displayText" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT,
  "quantity" DECIMAL(10,3),
  "unit" TEXT,
  "position" INTEGER NOT NULL,
  CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecipeInstruction" (
  "id" UUID NOT NULL,
  "recipeId" UUID NOT NULL,
  "step" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  CONSTRAINT "RecipeInstruction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecipeNote" (
  "id" UUID NOT NULL,
  "recipeId" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecipeNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecipeTag" (
  "id" UUID NOT NULL,
  "recipeId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "RecipeTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FavoriteSource" (
  "id" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "type" "SourceType" NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT,
  "rankingBoost" INTEGER NOT NULL DEFAULT 10,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FavoriteSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MealPlan" (
  "id" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "weekStartDate" DATE NOT NULL,
  "status" "MealPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MealPlanMeal" (
  "id" UUID NOT NULL,
  "mealPlanId" UUID NOT NULL,
  "recipeId" UUID NOT NULL,
  "mealType" "MealType" NOT NULL,
  "plannedForDate" DATE,
  "servings" INTEGER NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MealPlanMeal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MealPlanMealParticipant" (
  "id" UUID NOT NULL,
  "mealPlanMealId" UUID NOT NULL,
  "householdMemberId" UUID NOT NULL,
  CONSTRAINT "MealPlanMealParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroceryList" (
  "id" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "mealPlanId" UUID,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryList_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroceryListItem" (
  "id" UUID NOT NULL,
  "groceryListId" UUID NOT NULL,
  "recipeId" UUID,
  "mealPlanMealId" UUID,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT,
  "quantity" DECIMAL(10,3),
  "unit" TEXT,
  "category" TEXT,
  "checked" BOOLEAN NOT NULL DEFAULT false,
  "source" "GroceryItemSource" NOT NULL DEFAULT 'GENERATED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroceryListItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IngredientNormalizationRule" (
  "id" UUID NOT NULL,
  "rawName" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "category" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IngredientNormalizationRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");
CREATE UNIQUE INDEX "HouseholdMembership_householdId_userId_key" ON "HouseholdMembership"("householdId", "userId");
CREATE INDEX "HouseholdMembership_userId_idx" ON "HouseholdMembership"("userId");
CREATE INDEX "HouseholdMember_householdId_idx" ON "HouseholdMember"("householdId");
CREATE INDEX "MemberPreference_memberId_type_idx" ON "MemberPreference"("memberId", "type");
CREATE INDEX "ImportedRecipe_householdId_idx" ON "ImportedRecipe"("householdId");
CREATE INDEX "ImportedRecipe_providerId_externalId_idx" ON "ImportedRecipe"("providerId", "externalId");
CREATE INDEX "Recipe_householdId_idx" ON "Recipe"("householdId");
CREATE INDEX "Recipe_createdByUserId_idx" ON "Recipe"("createdByUserId");
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");
CREATE UNIQUE INDEX "RecipeInstruction_recipeId_step_key" ON "RecipeInstruction"("recipeId", "step");
CREATE INDEX "RecipeNote_recipeId_idx" ON "RecipeNote"("recipeId");
CREATE UNIQUE INDEX "RecipeTag_recipeId_name_key" ON "RecipeTag"("recipeId", "name");
CREATE INDEX "FavoriteSource_householdId_idx" ON "FavoriteSource"("householdId");
CREATE UNIQUE INDEX "MealPlan_householdId_weekStartDate_key" ON "MealPlan"("householdId", "weekStartDate");
CREATE INDEX "MealPlanMeal_mealPlanId_idx" ON "MealPlanMeal"("mealPlanId");
CREATE INDEX "MealPlanMeal_recipeId_idx" ON "MealPlanMeal"("recipeId");
CREATE UNIQUE INDEX "MealPlanMealParticipant_mealPlanMealId_householdMemberId_key" ON "MealPlanMealParticipant"("mealPlanMealId", "householdMemberId");
CREATE UNIQUE INDEX "GroceryList_mealPlanId_key" ON "GroceryList"("mealPlanId");
CREATE INDEX "GroceryList_householdId_idx" ON "GroceryList"("householdId");
CREATE INDEX "GroceryListItem_groceryListId_idx" ON "GroceryListItem"("groceryListId");
CREATE INDEX "GroceryListItem_normalizedName_idx" ON "GroceryListItem"("normalizedName");
CREATE UNIQUE INDEX "IngredientNormalizationRule_rawName_key" ON "IngredientNormalizationRule"("rawName");

ALTER TABLE "HouseholdMembership" ADD CONSTRAINT "HouseholdMembership_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdMembership" ADD CONSTRAINT "HouseholdMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberPreference" ADD CONSTRAINT "MemberPreference_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HouseholdMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportedRecipe" ADD CONSTRAINT "ImportedRecipe_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_importedRecipeId_fkey" FOREIGN KEY ("importedRecipeId") REFERENCES "ImportedRecipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeInstruction" ADD CONSTRAINT "RecipeInstruction_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeNote" ADD CONSTRAINT "RecipeNote_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeTag" ADD CONSTRAINT "RecipeTag_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoriteSource" ADD CONSTRAINT "FavoriteSource_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealPlanMeal" ADD CONSTRAINT "MealPlanMeal_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealPlanMeal" ADD CONSTRAINT "MealPlanMeal_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MealPlanMealParticipant" ADD CONSTRAINT "MealPlanMealParticipant_mealPlanMealId_fkey" FOREIGN KEY ("mealPlanMealId") REFERENCES "MealPlanMeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealPlanMealParticipant" ADD CONSTRAINT "MealPlanMealParticipant_householdMemberId_fkey" FOREIGN KEY ("householdMemberId") REFERENCES "HouseholdMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryList" ADD CONSTRAINT "GroceryList_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryList" ADD CONSTRAINT "GroceryList_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_groceryListId_fkey" FOREIGN KEY ("groceryListId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_mealPlanMealId_fkey" FOREIGN KEY ("mealPlanMealId") REFERENCES "MealPlanMeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
