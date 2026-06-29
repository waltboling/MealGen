import type { MealType } from "@/features/meal-planning/types";
import type { RecipeIngredientInput } from "@/features/recipes/types";

export type AiMealSourceType = "generated" | "saved_recipe" | "imported_recipe";

export type AiPlanningRequest = {
  prompt: string;
  sourceTypes: Array<"ai_generated" | "recipe_catalog">;
  generationSeed: string | null;
  mealType: MealType;
  numberOfMeals: number;
  weekStartDate: string;
  participantMemberIds: string[];
  servings: number;
  maxCookTimeMinutes: number | null;
  calorieTarget: number | null;
  calorieMin: number | null;
  calorieMax: number | null;
  proteinGoal: number | null;
  preferredProteins: string[];
  preferredBaseCarbs: string[];
  vegetables: string[];
  avoidIngredients: string[];
  useHouseholdPreferences: boolean;
  usePantryStaples: boolean;
  useSavedRecipes: boolean;
};

export type AiMealSuggestion = {
  id: string;
  title: string;
  mealType: MealType;
  cuisine: string | null;
  shortDescription: string;
  whyItMatches: string;
  estimatedCookTimeMinutes: number | null;
  estimatedCalories: number | null;
  estimatedProteinGrams: number | null;
  servings: number;
  ingredients: RecipeIngredientInput[];
  instructions: string[];
  tags: string[];
  matchedHouseholdPreferences: string[];
  warnings: string[];
  assumptions: string[];
  nutritionEstimateNote: string;
  sourceType: AiMealSourceType;
  sourceRecipeId: string | null;
  sourceUrl: string | null;
};

export type AiPlanningResult = {
  providerId: string;
  suggestions: AiMealSuggestion[];
  warnings: string[];
};
