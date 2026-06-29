export type MealPlanStatus = "DRAFT" | "ACTIVE" | "COMPLETED";

export type MealType =
  | "BREAKFAST"
  | "LUNCH"
  | "DINNER"
  | "SNACK"
  | "MEAL_PREP"
  | "OTHER";

export type MealPlanMealInput = {
  recipeId: string;
  mealStrategyId?: string | null;
  plannedForDate: string | null;
  mealType: MealType;
  servings: number;
  participantMemberIds: string[];
  notes?: string | null;
};

export type PlannedMeal = MealPlanMealInput & {
  id: string;
  recipeTitle: string;
  recipeImageUrl: string | null;
  participantNames: string[];
};

export type WeeklyMealPlan = {
  id: string;
  weekStartDate: string;
  status: MealPlanStatus;
  notes: string | null;
  meals: PlannedMeal[];
};
