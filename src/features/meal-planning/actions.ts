"use server";

import { revalidatePath } from "next/cache";
import {
  addMealToPlanSchema,
  mealPlanMealIdSchema,
  moveMealSchema
} from "@/features/meal-planning/schemas";
import { GroceryListService } from "@/features/grocery-lists/service";
import { MealPlanningService } from "@/features/meal-planning/service";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";

const mealPlanningService = new MealPlanningService();
const groceryListService = new GroceryListService();

function parseParticipants(formData: FormData) {
  return formData
    .getAll("participantMemberIds")
    .map(String)
    .filter(Boolean);
}

export async function addMealToPlanAction(formData: FormData) {
  const input = addMealToPlanSchema.parse({
    weekStartDate: formData.get("weekStartDate"),
    recipeId: formData.get("recipeId"),
    mealStrategyId: formData.get("mealStrategyId"),
    plannedForDate: formData.get("plannedForDate"),
    mealType: formData.get("mealType"),
    servings: formData.get("servings"),
    participantMemberIds: parseParticipants(formData),
    notes: formData.get("notes") ?? ""
  });
  const context = await getCurrentHouseholdOrRedirect();

  await mealPlanningService.addMeal(context, input);
  revalidatePath("/dashboard");
  revalidatePath("/weekly-planner");
  revalidatePath("/grocery-lists");
}

export async function moveMealAction(
  mealPlanMealId: string,
  plannedForDate: string
) {
  const input = moveMealSchema.parse({
    mealPlanMealId,
    plannedForDate
  });
  const context = await getCurrentHouseholdOrRedirect();
  const originalWeekStart = await mealPlanningService.getWeekStartForMeal(
    context,
    input.mealPlanMealId
  );

  await mealPlanningService.moveMeal(
    context,
    input.mealPlanMealId,
    input.plannedForDate
  );
  if (originalWeekStart) {
    await groceryListService.regenerateForWeek(context, originalWeekStart);
  }
  revalidatePath("/dashboard");
  revalidatePath("/weekly-planner");
  revalidatePath("/grocery-lists");
}

export async function removeMealFromPlanAction(mealPlanMealId: string) {
  const input = mealPlanMealIdSchema.parse({ mealPlanMealId });
  const context = await getCurrentHouseholdOrRedirect();
  const weekStartDate = await mealPlanningService.getWeekStartForMeal(
    context,
    input.mealPlanMealId
  );

  await mealPlanningService.removeMeal(context, input.mealPlanMealId);
  if (weekStartDate) {
    await groceryListService.regenerateForWeek(context, weekStartDate);
  }
  revalidatePath("/dashboard");
  revalidatePath("/grocery-lists");
  revalidatePath("/weekly-planner");
}
