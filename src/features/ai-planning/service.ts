import type { CurrentHousehold } from "@/lib/auth/current-household";
import type { HouseholdProfile } from "@/features/household/types";
import type { MealType } from "@/features/meal-planning/types";
import type { RecipeFormInput } from "@/features/recipes/types";
import type {
  AiPlanningRequest,
  AiPlanningResult
} from "@/features/ai-planning/types";
import type { ImportedRecipeCandidate } from "@/server/recipe-providers/types";
import { MealPlanningService } from "@/features/meal-planning/service";
import { RecipeService } from "@/features/recipes/service";
import { getAiPlanningProvider } from "@/server/ai-planning/registry";

const recipeService = new RecipeService();
const mealPlanningService = new MealPlanningService();
const suggestionCacheTtlMs = 10 * 60 * 1000;
const suggestionCache = new Map<
  string,
  { expiresAt: number; result: AiPlanningResult }
>();

export type AcceptedAiMealInput = {
  title: string;
  shortDescription: string | null;
  whyItMatches: string | null;
  mealType: MealType;
  mealStrategyId: string | null;
  weekStartDate: string;
  plannedForDate: string | null;
  participantMemberIds: string[];
  servings: number;
  estimatedCookTimeMinutes: number | null;
  estimatedCalories: number | null;
  estimatedProteinGrams: number | null;
  cuisine: string | null;
  nutritionEstimateNote: string | null;
  ingredientsText: string;
  instructionsText: string;
  tagsText: string;
  sourceType: "generated" | "saved_recipe" | "imported_recipe";
};

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseQuantity(raw: string) {
  if (raw.includes("/")) {
    const [numerator, denominator] = raw.split("/").map(Number);
    return denominator ? numerator / denominator : null;
  }

  return Number(raw);
}

function parseIngredientLine(line: string) {
  const match = line.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*([a-zA-Z]+)?\s+(.+)$/);

  if (match) {
    const quantity = parseQuantity(match[1]);
    const unit = match[2] ?? null;
    const name = match[3].trim();

    return {
      displayText: line,
      name,
      quantity: Number.isFinite(quantity) ? quantity : null,
      unit
    };
  }

  return {
    displayText: line,
    name: line.replace(/^[\d./\s]+([a-zA-Z]+)?\s+/, "").trim() || line,
    quantity: null,
    unit: null
  };
}

function catalogSuggestionFromCandidate(
  candidate: ImportedRecipeCandidate,
  request: AiPlanningRequest
) {
  const totalMinutes = (candidate.prepMinutes ?? 0) + (candidate.cookMinutes ?? 0);
  const providerLabel =
    candidate.providerId === "spoonacular" ? "Spoonacular" : candidate.providerId;

  return {
    id: `catalog-${candidate.providerId}-${candidate.externalId}`,
    title: candidate.title,
    mealType: request.mealType,
    cuisine: candidate.cuisines[0] ?? null,
    shortDescription:
      candidate.description ??
      `A catalog recipe from ${candidate.sourceName ?? providerLabel}.`,
    whyItMatches: `Found in the recipe catalog from ${
      candidate.sourceName ?? providerLabel
    } for this planning prompt.`,
    estimatedCookTimeMinutes: totalMinutes > 0 ? totalMinutes : null,
    estimatedCalories: null,
    estimatedProteinGrams: null,
    servings: candidate.servings ?? request.servings,
    ingredients: candidate.ingredients,
    instructions: candidate.instructions,
    tags: Array.from(
      new Set([
        ...candidate.tags,
        ...candidate.cuisines,
        ...candidate.diets,
        "catalog"
      ])
    ).slice(0, 16),
    matchedHouseholdPreferences: [],
    warnings:
      candidate.instructions.length === 1 &&
      candidate.instructions[0].includes("original source")
        ? ["Instructions are limited. Review the original recipe source before cooking."]
        : [],
    assumptions: [
      "Nutrition estimates are not available for catalog results yet."
    ],
    nutritionEstimateNote:
      "Nutrition is not estimated for catalog recipes yet. Use the source recipe or packaging labels for nutrition details.",
    sourceType: "imported_recipe" as const,
    sourceRecipeId: null,
    sourceUrl: candidate.sourceUrl
  };
}

function suggestionCacheKey(
  request: AiPlanningRequest,
  profiles: HouseholdProfile[],
  context: CurrentHousehold
) {
  return JSON.stringify({
    householdId: context.householdId,
    isDemo: context.isDemo,
    request,
    profiles: profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      allergies: profile.allergies,
      dislikes: profile.dislikes,
      dietaryPreferences: profile.dietaryPreferences,
      favoriteCuisines: profile.favoriteCuisines,
      likes: profile.likes,
      notes: profile.notes,
      preferredSpiceLevel: profile.preferredSpiceLevel
    }))
  });
}

function cloneResult(result: AiPlanningResult): AiPlanningResult {
  return {
    providerId: result.providerId,
    warnings: [...result.warnings],
    suggestions: result.suggestions.map((suggestion) => ({
      ...suggestion,
      ingredients: suggestion.ingredients.map((ingredient) => ({
        ...ingredient
      })),
      instructions: [...suggestion.instructions],
      tags: [...suggestion.tags],
      matchedHouseholdPreferences: [...suggestion.matchedHouseholdPreferences],
      warnings: [...suggestion.warnings],
      assumptions: [...suggestion.assumptions]
    }))
  };
}

function revisionPrompt(request: AiPlanningRequest, suggestion: AiPlanningResult["suggestions"][number], instructions: string) {
  return [
    request.prompt,
    "",
    "Revise exactly one meal suggestion using the requested change below.",
    "Keep what still works from the original suggestion, but update the recipe title, description, ingredients, quantities, instructions, nutrition estimates, tags, warnings, and assumptions so the revised recipe is internally consistent.",
    "Do not return multiple alternatives. Return one complete replacement suggestion.",
    "",
    `Requested change: ${instructions}`,
    "",
    `Original suggestion JSON: ${JSON.stringify(suggestion)}`
  ].join("\n");
}

export class AiPlanningService {
  async generateSuggestions(
    request: AiPlanningRequest,
    profiles: HouseholdProfile[],
    context: CurrentHousehold
  ): Promise<AiPlanningResult> {
    const cacheKey = suggestionCacheKey(request, profiles, context);
    const cached = suggestionCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cloneResult(cached.result);
    }

    if (cached) {
      suggestionCache.delete(cacheKey);
    }

    const wantsAiGenerated = request.sourceTypes.includes("ai_generated");
    const wantsRecipeCatalog = request.sourceTypes.includes("recipe_catalog");
    const savedRecipes = request.useSavedRecipes
      ? await recipeService.listRecipes(context)
      : [];
    const warnings: string[] = [];
    const suggestions: AiPlanningResult["suggestions"] = [];

    if (wantsRecipeCatalog) {
      try {
        let catalogResults = await recipeService.searchImportableRecipes(context, {
          query: request.prompt,
          cuisines: [],
          diets: [],
          maxCookTimeMinutes: request.maxCookTimeMinutes,
          servings: request.servings
        });

        if (catalogResults.length === 0) {
          catalogResults = await recipeService.searchImportableRecipes(context, {
            query:
              request.preferredProteins[0] ??
              request.preferredBaseCarbs[0] ??
              undefined,
            cuisines: [],
            diets: [],
            maxCookTimeMinutes: request.maxCookTimeMinutes,
            servings: request.servings
          });
        }

        if (catalogResults.length === 0) {
          catalogResults = await recipeService.searchImportableRecipes(context, {
            cuisines: [],
            diets: [],
            maxCookTimeMinutes: request.maxCookTimeMinutes,
            servings: request.servings
          });
        }

        const detailResults = await Promise.allSettled(
          catalogResults
            .slice(0, request.numberOfMeals)
            .map((recipe) =>
              recipeService.getImportableRecipeCandidate({
                providerId: recipe.providerId,
                externalId: recipe.externalId
              })
            )
        );
        const catalogSuggestions = detailResults
          .filter(
            (result): result is PromiseFulfilledResult<ImportedRecipeCandidate> =>
              result.status === "fulfilled"
          )
          .map((result) => catalogSuggestionFromCandidate(result.value, request));

        suggestions.push(...catalogSuggestions);

        if (catalogSuggestions.length === 0) {
          warnings.push("No usable catalog recipes were found for this prompt.");
        }
      } catch (error) {
        warnings.push(
          error instanceof Error
            ? `Recipe catalog search failed: ${error.message}`
            : "Recipe catalog search failed."
        );
      }
    }

    if (wantsAiGenerated) {
      const provider = getAiPlanningProvider();
      const remainingCount = Math.max(
        1,
        request.numberOfMeals - (wantsRecipeCatalog ? suggestions.length : 0)
      );

      try {
        const generatedResult = await provider.generate({
          request: {
            ...request,
            numberOfMeals: wantsRecipeCatalog
              ? remainingCount
              : request.numberOfMeals
          },
          profiles,
          savedRecipes
        });

        suggestions.push(...generatedResult.suggestions);
        warnings.push(...generatedResult.warnings);
      } catch (error) {
        if (!wantsRecipeCatalog || suggestions.length === 0) {
          throw error;
        }

        warnings.push(
          error instanceof Error
            ? `AI-generated recipes failed: ${error.message}`
            : "AI-generated recipes failed."
        );
      }
    }

    if (suggestions.length === 0) {
      throw new Error(
        warnings[0] ?? "No meal suggestions could be generated from the selected sources."
      );
    }

    const result = {
      providerId: request.sourceTypes.join("+"),
      suggestions: suggestions.slice(0, request.numberOfMeals),
      warnings
    };

    suggestionCache.set(cacheKey, {
      expiresAt: Date.now() + suggestionCacheTtlMs,
      result: cloneResult(result)
    });

    return result;
  }

  async reviseSuggestion(
    request: AiPlanningRequest,
    profiles: HouseholdProfile[],
    context: CurrentHousehold,
    suggestion: AiPlanningResult["suggestions"][number],
    instructions: string
  ) {
    const provider = getAiPlanningProvider();
    const savedRecipes = request.useSavedRecipes
      ? await recipeService.listRecipes(context)
      : [];
    const revisedResult = await provider.generate({
      request: {
        ...request,
        prompt: revisionPrompt(request, suggestion, instructions),
        sourceTypes: ["ai_generated"],
        numberOfMeals: 1,
        generationSeed: `${request.generationSeed ?? ""}:revision:${suggestion.id}:${instructions}`,
        useSavedRecipes: false
      },
      profiles,
      savedRecipes
    });
    const revisedSuggestion = revisedResult.suggestions[0];

    if (!revisedSuggestion) {
      throw new Error("The AI provider did not return a revised recipe.");
    }

    return {
      ...revisedSuggestion,
      id: suggestion.id,
      sourceType: "generated" as const,
      sourceRecipeId: null,
      warnings: [
        ...revisedSuggestion.warnings,
        `Revised from "${suggestion.title}" using: ${instructions}`
      ]
    };
  }

  async acceptMeal(context: CurrentHousehold, input: AcceptedAiMealInput) {
    const tags = [
      ...lines(input.tagsText.replaceAll(",", "\n")),
      "ai planned",
      input.sourceType
    ];
    const notes = [
      input.whyItMatches ? { text: input.whyItMatches } : null,
      input.estimatedCalories
        ? { text: `Estimated calories: ${input.estimatedCalories}` }
        : null,
      input.estimatedProteinGrams
        ? { text: `Estimated protein: ${input.estimatedProteinGrams}g` }
        : null
      ,
      input.nutritionEstimateNote ? { text: input.nutritionEstimateNote } : null
    ].filter((note): note is { text: string } => Boolean(note));
    const recipeInput: RecipeFormInput = {
      title: input.title,
      description: input.shortDescription,
      imageUrl: null,
      sourceName: "AI meal planner",
      sourceUrl: null,
      authorName: null,
      prepMinutes: null,
      cookMinutes: input.estimatedCookTimeMinutes,
      servings: input.servings,
      tags: input.cuisine ? [...tags, input.cuisine] : tags,
      ingredients: lines(input.ingredientsText).map(parseIngredientLine),
      instructions: lines(input.instructionsText).map((text) => ({ text })),
      notes
    };
    const recipeId = await recipeService.createRecipe(context, recipeInput);

    const mealPlanMealId = await mealPlanningService.addMeal(context, {
      weekStartDate: input.weekStartDate,
      recipeId,
      mealStrategyId: input.mealStrategyId,
      plannedForDate: input.plannedForDate,
      mealType: input.mealType,
      servings: input.servings,
      participantMemberIds: input.participantMemberIds,
      notes: "Added from Plan with AI"
    });
    return { recipeId, mealPlanMealId };
  }

  async createGeneratedRecipe(context: CurrentHousehold, input: AcceptedAiMealInput) {
    const recipeId = await recipeService.createRecipe(context, {
      title: input.title,
      description: input.shortDescription,
      imageUrl: null,
      sourceName: "AI recipe generator",
      sourceUrl: null,
      authorName: null,
      prepMinutes: null,
      cookMinutes: input.estimatedCookTimeMinutes,
      servings: input.servings,
      tags: [
        ...lines(input.tagsText.replaceAll(",", "\n")),
        "ai generated",
        ...(input.cuisine ? [input.cuisine] : [])
      ],
      ingredients: lines(input.ingredientsText).map(parseIngredientLine),
      instructions: lines(input.instructionsText).map((text) => ({ text })),
      notes: [
        input.whyItMatches ? { text: input.whyItMatches } : null,
        input.estimatedCalories
          ? { text: `Estimated calories: ${input.estimatedCalories}` }
          : null,
        input.estimatedProteinGrams
          ? { text: `Estimated protein: ${input.estimatedProteinGrams}g` }
          : null,
        input.nutritionEstimateNote ? { text: input.nutritionEstimateNote } : null
      ].filter((note): note is { text: string } => Boolean(note))
    });

    return recipeId;
  }
}
