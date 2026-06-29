CREATE TABLE "MealStrategy" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "householdId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "mealType" "MealType" NOT NULL,
  "weeklyTarget" INTEGER NOT NULL DEFAULT 5,
  "defaultServings" INTEGER NOT NULL DEFAULT 4,
  "prompt" TEXT NOT NULL,
  "maxCookTimeMinutes" INTEGER,
  "calorieMin" INTEGER,
  "calorieMax" INTEGER,
  "proteinGoal" INTEGER,
  "preferredProteins" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "preferredBaseCarbs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "vegetables" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "avoidIngredients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sourceTypes" TEXT[] NOT NULL DEFAULT ARRAY['ai_generated']::TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MealStrategy_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MealStrategy"
  ADD CONSTRAINT "MealStrategy_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MealPlanMeal"
  ADD COLUMN "mealStrategyId" UUID;

ALTER TABLE "MealPlanMeal"
  ADD CONSTRAINT "MealPlanMeal_mealStrategyId_fkey"
  FOREIGN KEY ("mealStrategyId") REFERENCES "MealStrategy"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "MealStrategy_householdId_idx" ON "MealStrategy"("householdId");
CREATE INDEX "MealPlanMeal_mealStrategyId_idx" ON "MealPlanMeal"("mealStrategyId");
