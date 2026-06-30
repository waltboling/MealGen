"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addRecipeToWeekSchema,
  recipeFormSchema,
  recipeIdSchema,
  importRecipeToWeekSchema,
  recipeImportSchema
} from "@/features/recipes/schemas";
import { HouseholdService } from "@/features/household/service";
import { MealPlanningService } from "@/features/meal-planning/service";
import { RecipeService } from "@/features/recipes/service";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";
import { getCurrentWeekStart } from "@/lib/date/week";
import { parseRecipeFileWithOpenAi } from "@/server/recipe-image-parser/openai-recipe-image-parser";

const recipeService = new RecipeService();
const mealPlanningService = new MealPlanningService();
const householdService = new HouseholdService();

function parseJsonField<T>(formData: FormData, key: string, fallback: T): T {
  const raw = formData.get(key);

  if (typeof raw !== "string" || raw.length === 0) {
    return fallback;
  }

  return JSON.parse(raw) as T;
}

function parseRecipeForm(formData: FormData) {
  return recipeFormSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    sourceName: formData.get("sourceName"),
    sourceUrl: formData.get("sourceUrl"),
    authorName: formData.get("authorName"),
    prepMinutes: formData.get("prepMinutes"),
    cookMinutes: formData.get("cookMinutes"),
    servings: formData.get("servings"),
    tags: parseJsonField<string[]>(formData, "tagsJson", []),
    ingredients: parseJsonField(formData, "ingredientsJson", []),
    instructions: parseJsonField(formData, "instructionsJson", []),
    notes: parseJsonField(formData, "notesJson", [])
  });
}

export async function createRecipeAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  const input = parseRecipeForm(formData);
  const recipeId = await recipeService.createRecipe(context, input);

  revalidatePath("/recipes");
  redirect(`/recipes/${recipeId}`);
}

export async function updateRecipeAction(recipeId: string, formData: FormData) {
  const parsedId = recipeIdSchema.parse({ recipeId });
  const context = await getCurrentHouseholdOrRedirect();
  const input = parseRecipeForm(formData);
  const updated = await recipeService.updateRecipe(
    context,
    parsedId.recipeId,
    input
  );

  if (!updated) {
    notFound();
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${parsedId.recipeId}`);
  redirect(`/recipes/${parsedId.recipeId}`);
}

export async function deleteRecipeAction(recipeId: string) {
  const parsedId = recipeIdSchema.parse({ recipeId });
  const context = await getCurrentHouseholdOrRedirect();
  await recipeService.deleteRecipe(context, parsedId.recipeId);

  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function importRecipeAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  const input = recipeImportSchema.parse({
    providerId: formData.get("providerId"),
    externalId: formData.get("externalId")
  });
  const recipeId = await recipeService.importRecipe(context, input);

  revalidatePath("/recipes");
  revalidatePath("/recipes/search");
  redirect(`/recipes/${recipeId}`);
}

export async function importRecipeImageAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  const file = formData.get("recipeFile") ?? formData.get("recipeImage");
  const returnPath =
    typeof formData.get("returnPath") === "string"
      ? String(formData.get("returnPath"))
      : "/recipes/generate";
  const safeReturnPath = returnPath.startsWith("/recipes/")
    ? returnPath
    : "/recipes/generate";
  let recipeId: string;

  if (!(file instanceof File)) {
    redirect(
      `${safeReturnPath}?importError=Choose%20a%20recipe%20file%20to%20import.`
    );
  }

  try {
    const input = await parseRecipeFileWithOpenAi(file);
    recipeId = await recipeService.createRecipe(context, input);

    revalidatePath("/recipes");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The recipe file could not be imported.";

    redirect(`${safeReturnPath}?importError=${encodeURIComponent(message)}`);
  }

  redirect(`/recipes/${recipeId}/edit`);
}

async function addRecipeIdToWeek(
  recipeId: string,
  formInput: {
    weekStartDate?: string;
    mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "MEAL_PREP" | "OTHER";
    servings?: number;
  }
) {
  const context = await getCurrentHouseholdOrRedirect();
  const weekStartDate = formInput.weekStartDate ?? getCurrentWeekStart();
  const members = await householdService.listMembers(context, weekStartDate);

  await mealPlanningService.addMeal(context, {
    weekStartDate,
    recipeId,
    plannedForDate: null,
    mealType: formInput.mealType,
    servings: formInput.servings ?? 4,
    participantMemberIds: members.map((member) => member.id),
    notes: "Added to week"
  });
  revalidatePath("/dashboard");
  revalidatePath("/weekly-planner");
  revalidatePath("/recipes");

  return weekStartDate;
}

export async function addRecipeToWeekAction(formData: FormData) {
  const input = addRecipeToWeekSchema.parse({
    recipeId: formData.get("recipeId"),
    weekStartDate: formData.get("weekStartDate") || undefined,
    mealType: formData.get("mealType") || "DINNER",
    servings: formData.get("servings") || undefined
  });
  const weekStartDate = await addRecipeIdToWeek(input.recipeId, input);

  redirect(`/weekly-planner?week=${weekStartDate}`);
}

export async function importRecipeToWeekAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  const input = importRecipeToWeekSchema.parse({
    providerId: formData.get("providerId"),
    externalId: formData.get("externalId"),
    weekStartDate: formData.get("weekStartDate") || undefined,
    mealType: formData.get("mealType") || "DINNER",
    servings: formData.get("servings") || undefined
  });
  const recipeId = await recipeService.importRecipe(context, input);
  const weekStartDate = await addRecipeIdToWeek(recipeId, input);

  revalidatePath("/recipes/search");
  redirect(`/weekly-planner?week=${weekStartDate}`);
}
