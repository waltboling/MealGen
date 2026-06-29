import type { MealType } from "@/features/meal-planning/types";

export type MealStrategySourceType = "ai_generated" | "recipe_catalog";

export type MealStrategy = {
  id: string;
  name: string;
  mealType: MealType;
  weeklyTarget: number;
  defaultServings: number;
  prompt: string;
  maxCookTimeMinutes: number | null;
  calorieMin: number | null;
  calorieMax: number | null;
  proteinGoal: number | null;
  preferredProteins: string[];
  preferredBaseCarbs: string[];
  vegetables: string[];
  avoidIngredients: string[];
  sourceTypes: MealStrategySourceType[];
  active: boolean;
};

export type MealStrategyInput = Omit<MealStrategy, "id" | "active"> & {
  active?: boolean;
};

export type MealStrategyProgress = {
  strategy: MealStrategy;
  acceptedCount: number;
  remainingCount: number;
};
