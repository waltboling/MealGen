"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { acceptAiMealFormSchema } from "@/features/ai-planning/schemas";
import { AiPlanningService } from "@/features/ai-planning/service";
import { GroceryListService } from "@/features/grocery-lists/service";
import { MealPlanningService } from "@/features/meal-planning/service";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";

const aiPlanningService = new AiPlanningService();
const mealPlanningService = new MealPlanningService();
const groceryListService = new GroceryListService();

function safeAiMealReturnTo(
  value: FormDataEntryValue | null,
  fallbackWeek: string,
  addedTitle: string,
  addedMealId: string,
  addedSuggestionId: string
) {
  const target =
    typeof value === "string" &&
    (value.startsWith("/plan-with-ai") || value.startsWith("/dashboard"))
      ? value
      : `/plan-with-ai?weekStartDate=${fallbackWeek}`;
  const url = new URL(target, "http://local");

  url.searchParams.append("added", addedTitle);
  url.searchParams.append("addedMealId", addedMealId);
  url.searchParams.append("addedSuggestionId", addedSuggestionId);

  return `${url.pathname}${url.search}${url.hash}`;
}

function removeAddedMealFromReturnTo(
  value: FormDataEntryValue | null,
  fallbackWeek: string,
  mealId: string
) {
  const target =
    typeof value === "string" && value.startsWith("/plan-with-ai")
      ? value
      : `/plan-with-ai?weekStartDate=${fallbackWeek}`;
  const url = new URL(target, "http://local");
  const addedTitles = url.searchParams.getAll("added");
  const addedMealIds = url.searchParams.getAll("addedMealId");
  const addedSuggestionIds = url.searchParams.getAll("addedSuggestionId");

  url.searchParams.delete("added");
  url.searchParams.delete("addedMealId");
  url.searchParams.delete("addedSuggestionId");

  addedMealIds.forEach((currentMealId, index) => {
    if (currentMealId === mealId) {
      return;
    }

    if (addedTitles[index]) {
      url.searchParams.append("added", addedTitles[index]);
    }

    url.searchParams.append("addedMealId", currentMealId);

    if (addedSuggestionIds[index]) {
      url.searchParams.append("addedSuggestionId", addedSuggestionIds[index]);
    }
  });

  return `${url.pathname}${url.search}${url.hash}`;
}

export async function acceptAiMealAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  const input = acceptAiMealFormSchema.parse({
    title: formData.get("title"),
    shortDescription: formData.get("shortDescription"),
    whyItMatches: formData.get("whyItMatches"),
    mealType: formData.get("mealType"),
    mealStrategyId: formData.get("mealStrategyId"),
    weekStartDate: formData.get("weekStartDate"),
    plannedForDate: formData.get("plannedForDate"),
    participantMemberIds: formData.getAll("participantMemberIds").map(String),
    servings: formData.get("servings"),
    estimatedCookTimeMinutes: formData.get("estimatedCookTimeMinutes"),
    estimatedCalories: formData.get("estimatedCalories"),
    estimatedProteinGrams: formData.get("estimatedProteinGrams"),
    cuisine: formData.get("cuisine"),
    nutritionEstimateNote: formData.get("nutritionEstimateNote"),
    ingredientsText: formData.get("ingredientsText"),
    instructionsText: formData.get("instructionsText"),
    tagsText: formData.get("tagsText"),
    sourceType: formData.get("sourceType")
  });

  const accepted = await aiPlanningService.acceptMeal(context, input);
  revalidatePath("/dashboard");
  revalidatePath("/weekly-planner");
  revalidatePath("/recipes");
  redirect(
    safeAiMealReturnTo(
      formData.get("returnTo"),
      input.weekStartDate,
      input.title,
      accepted.mealPlanMealId,
      String(formData.get("suggestionId") ?? input.title)
    )
  );
}

export async function removeAcceptedAiMealAction(formData: FormData) {
  const mealPlanMealId = String(formData.get("mealPlanMealId") ?? "");
  const weekStartDate = String(formData.get("weekStartDate") ?? "");
  const context = await getCurrentHouseholdOrRedirect();
  const originalWeekStart =
    weekStartDate ||
    (await mealPlanningService.getWeekStartForMeal(context, mealPlanMealId));

  await mealPlanningService.removeMeal(context, mealPlanMealId);

  if (originalWeekStart) {
    await groceryListService.regenerateForWeek(context, originalWeekStart);
  }

  revalidatePath("/dashboard");
  revalidatePath("/weekly-planner");
  revalidatePath("/grocery-lists");
  redirect(
    removeAddedMealFromReturnTo(
      formData.get("returnTo"),
      originalWeekStart ?? weekStartDate,
      mealPlanMealId
    )
  );
}

export async function saveGeneratedRecipeAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  const input = acceptAiMealFormSchema.parse({
    title: formData.get("title"),
    shortDescription: formData.get("shortDescription"),
    whyItMatches: formData.get("whyItMatches"),
    mealType: formData.get("mealType"),
    mealStrategyId: formData.get("mealStrategyId"),
    weekStartDate: formData.get("weekStartDate"),
    plannedForDate: formData.get("plannedForDate"),
    participantMemberIds: formData.getAll("participantMemberIds").map(String),
    servings: formData.get("servings"),
    estimatedCookTimeMinutes: formData.get("estimatedCookTimeMinutes"),
    estimatedCalories: formData.get("estimatedCalories"),
    estimatedProteinGrams: formData.get("estimatedProteinGrams"),
    cuisine: formData.get("cuisine"),
    nutritionEstimateNote: formData.get("nutritionEstimateNote"),
    ingredientsText: formData.get("ingredientsText"),
    instructionsText: formData.get("instructionsText"),
    tagsText: formData.get("tagsText"),
    sourceType: formData.get("sourceType")
  });
  const recipeId = await aiPlanningService.createGeneratedRecipe(context, input);

  revalidatePath("/recipes");
  redirect(`/recipes/${recipeId}`);
}
