"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  mealStrategyFormSchema,
  mealStrategyIdSchema
} from "@/features/meal-strategies/schemas";
import { MealStrategyService } from "@/features/meal-strategies/service";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";

const mealStrategyService = new MealStrategyService();

export async function createMealStrategyAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  const input = mealStrategyFormSchema.parse({
    name: formData.get("name"),
    mealType: formData.get("mealType"),
    weeklyTarget: formData.get("weeklyTarget"),
    defaultServings: formData.get("defaultServings"),
    prompt: formData.get("prompt"),
    maxCookTimeMinutes: formData.get("maxCookTimeMinutes"),
    calorieMin: formData.get("calorieMin"),
    calorieMax: formData.get("calorieMax"),
    proteinGoal: formData.get("proteinGoal"),
    preferredProteins: formData.get("preferredProteins"),
    preferredBaseCarbs: formData.get("preferredBaseCarbs"),
    vegetables: formData.get("vegetables"),
    avoidIngredients: formData.get("avoidIngredients"),
    sourceTypes: formData.getAll("sourceTypes").map(String)
  });

  await mealStrategyService.create(context, input);
  revalidatePath("/plan-with-ai");
  redirect("/plan-with-ai?strategyCreated=true#meal-strategies");
}

export async function updateMealStrategyAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  const idInput = mealStrategyIdSchema.parse({
    mealStrategyId: formData.get("mealStrategyId")
  });
  const input = mealStrategyFormSchema.parse({
    name: formData.get("name"),
    mealType: formData.get("mealType"),
    weeklyTarget: formData.get("weeklyTarget"),
    defaultServings: formData.get("defaultServings"),
    prompt: formData.get("prompt"),
    maxCookTimeMinutes: formData.get("maxCookTimeMinutes"),
    calorieMin: formData.get("calorieMin"),
    calorieMax: formData.get("calorieMax"),
    proteinGoal: formData.get("proteinGoal"),
    preferredProteins: formData.get("preferredProteins"),
    preferredBaseCarbs: formData.get("preferredBaseCarbs"),
    vegetables: formData.get("vegetables"),
    avoidIngredients: formData.get("avoidIngredients"),
    sourceTypes: formData.getAll("sourceTypes").map(String)
  });

  await mealStrategyService.update(context, idInput.mealStrategyId, input);
  revalidatePath("/plan-with-ai");
  redirect("/plan-with-ai?strategyUpdated=true#meal-strategies");
}

export async function deactivateMealStrategyAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  const input = mealStrategyIdSchema.parse({
    mealStrategyId: formData.get("mealStrategyId")
  });

  await mealStrategyService.deactivate(context, input.mealStrategyId);
  revalidatePath("/plan-with-ai");
  redirect("/plan-with-ai#meal-strategies");
}
