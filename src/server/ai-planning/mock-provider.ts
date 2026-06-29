import { aiPlanningResultSchema } from "../../features/ai-planning/schemas.ts";
import type { AiMealSuggestion } from "../../features/ai-planning/types.ts";
import type {
  AiPlanningProvider,
  AiPlanningProviderInput
} from "./types.ts";

function listOrFallback(values: string[], fallback: string[]) {
  return values.length > 0 ? values : fallback;
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function ingredient(
  displayText: string,
  name: string,
  quantity: number | null,
  unit: string | null
) {
  return { displayText, name, quantity, unit };
}

function inferCuisine(prompt: string, profiles: AiPlanningProviderInput["profiles"]) {
  const normalized = prompt.toLowerCase();
  const cuisines = [
    "korean",
    "mexican",
    "italian",
    "mediterranean",
    "thai",
    "japanese",
    "indian",
    "chinese"
  ];
  const match = cuisines.find((cuisine) => normalized.includes(cuisine));

  if (match) {
    return titleCase(match);
  }

  return profiles.flatMap((profile) => profile.favoriteCuisines)[0] ?? null;
}

function cuisineSeasoning(cuisine: string | null) {
  switch (cuisine?.toLowerCase()) {
    case "korean":
      return ["1 tbsp gochujang", "gochujang", 1, "tbsp"] as const;
    case "mexican":
      return ["1 tbsp chili-lime seasoning", "chili-lime seasoning", 1, "tbsp"] as const;
    case "italian":
      return ["1 tbsp Italian herb blend", "Italian herb blend", 1, "tbsp"] as const;
    case "mediterranean":
      return ["1 tbsp oregano and lemon zest", "oregano and lemon zest", 1, "tbsp"] as const;
    default:
      return ["1 tbsp house seasoning", "house seasoning", 1, "tbsp"] as const;
  }
}

export class MockAiPlanningProvider implements AiPlanningProvider {
  id = "mock";

  async generate(input: AiPlanningProviderInput) {
    const { request, profiles, savedRecipes } = input;
    const proteins = listOrFallback(request.preferredProteins, [
      "chicken",
      "beef",
      "turkey",
      "tofu"
    ]);
    const carbs = listOrFallback(request.preferredBaseCarbs, [
      "rice",
      "quinoa",
      "potatoes"
    ]);
    const vegetables = listOrFallback(
      request.vegetables,
      unique(profiles.flatMap((profile) => profile.likes)).filter(
        (item) => !proteins.includes(item) && !carbs.includes(item)
      ).slice(0, 6)
    );
    const safeVegetables = listOrFallback(vegetables, [
      "broccoli",
      "peppers",
      "zucchini",
      "spinach"
    ]);
    const householdMatches = request.useHouseholdPreferences
      ? unique([
          ...profiles.flatMap((profile) => profile.favoriteCuisines),
          ...profiles.flatMap((profile) => profile.likes)
        ]).slice(0, 6)
      : [];
    const allergyWarnings = unique(
      profiles.flatMap((profile) => profile.allergies)
    ).map((allergy) => `Avoid ${allergy} because it is listed as an allergy.`);
    const avoidWarnings = request.avoidIngredients.map(
      (item) => `Avoiding ${item} per request.`
    );
    const cuisine = inferCuisine(request.prompt, profiles);
    const seasoning = cuisineSeasoning(cuisine);
    const suggestions: AiMealSuggestion[] = Array.from(
      { length: request.numberOfMeals },
      (_, index) => {
        const protein = proteins[index % proteins.length];
        const carb = carbs[index % carbs.length];
        const vegA = safeVegetables[index % safeVegetables.length];
        const vegB = safeVegetables[(index + 1) % safeVegetables.length];
        const savedRecipe = request.useSavedRecipes
          ? savedRecipes.find((recipe) =>
              [protein, carb, vegA].some((term) =>
                `${recipe.title} ${recipe.tags.join(" ")}`.toLowerCase().includes(
                  term.toLowerCase()
                )
              )
            )
          : null;
        const title = savedRecipe
          ? savedRecipe.title
          : `${titleCase(protein)} ${titleCase(carb)} Power Bowl`;

        return {
          id: `suggestion-${index + 1}`,
          title: cuisine && !savedRecipe ? `${cuisine} ${title}` : title,
          mealType: request.mealType,
          cuisine,
          shortDescription: `A balanced ${request.mealType.toLowerCase()} built around ${protein}, ${carb}, ${vegA}, and ${vegB}.`,
          whyItMatches: `Matches the prompt with a protein-forward portion, a practical carb, varied vegetables, and a target cook time around ${request.maxCookTimeMinutes ?? 40} minutes.`,
          estimatedCookTimeMinutes: Math.min(request.maxCookTimeMinutes ?? 40, 40),
          estimatedCalories: request.calorieTarget ?? 650,
          estimatedProteinGrams: request.proteinGoal ?? 42,
          servings: request.servings,
          ingredients: [
            ingredient(`${Math.max(1, request.servings * 0.375)} lb ${protein}`, protein, Math.max(1, request.servings * 0.375), "lb"),
            ingredient(`${Math.max(1, request.servings * 0.5)} cups cooked ${carb}`, carb, Math.max(1, request.servings * 0.5), "cups"),
            ingredient(`${Math.max(1, request.servings * 0.5)} cups ${vegA}`, vegA, Math.max(1, request.servings * 0.5), "cups"),
            ingredient(`${Math.max(1, request.servings * 0.5)} cups ${vegB}`, vegB, Math.max(1, request.servings * 0.5), "cups"),
            ingredient("2 tbsp olive oil", "olive oil", 2, "tbsp"),
            ingredient(seasoning[0], seasoning[1], seasoning[2], seasoning[3]),
            ingredient("1 lemon or splash of vinegar", "lemon", 1, null)
          ],
          instructions: [
            `Cook or warm the ${carb} and divide it across containers or plates.`,
            `Season and cook the ${protein} until done.`,
            `Saute or roast ${vegA} and ${vegB} with olive oil, salt, and pepper.`,
            "Assemble bowls and finish with lemon or vinegar for brightness."
          ],
          tags: unique([
            "ai suggested",
            request.mealType.toLowerCase(),
            cuisine ?? "",
            protein,
            carb,
            "meal prep"
          ]),
          matchedHouseholdPreferences: householdMatches,
          warnings: [...allergyWarnings, ...avoidWarnings],
          assumptions: [
            "Nutrition values are estimates, not exact calculations.",
            "Pantry staples such as salt, pepper, and oil are assumed available."
          ],
          nutritionEstimateNote:
            "Calories and protein are estimated from typical cooked portions for the listed protein, carb, vegetables, and cooking oil.",
          sourceType: savedRecipe
            ? savedRecipe.origin === "IMPORTED"
              ? "imported_recipe"
              : "saved_recipe"
            : "generated",
          sourceRecipeId: savedRecipe?.id ?? null,
          sourceUrl: null
        };
      }
    );

    return aiPlanningResultSchema.parse({
      providerId: this.id,
      suggestions,
      warnings: allergyWarnings
    });
  }
}
