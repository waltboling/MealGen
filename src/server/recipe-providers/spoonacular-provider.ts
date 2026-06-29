import type {
  ImportedRecipeCandidate,
  RecipeLookupInput,
  RecipeProvider,
  RecipeSearchInput,
  RecipeSearchResult
} from "./types.ts";

type SpoonacularSearchRecipe = {
  id: number;
  title: string;
  image?: string;
  sourceName?: string;
  sourceUrl?: string;
  creditsText?: string;
  readyInMinutes?: number;
  servings?: number;
  cuisines?: string[];
  diets?: string[];
  dishTypes?: string[];
};

type SpoonacularSearchResponse = {
  results?: SpoonacularSearchRecipe[];
};

type SpoonacularRecipeInformation = SpoonacularSearchRecipe & {
  summary?: string;
  creditsText?: string;
  spoonacularSourceUrl?: string;
  extendedIngredients?: Array<{
    original?: string;
    nameClean?: string;
    name?: string;
    amount?: number;
    unit?: string;
  }>;
  analyzedInstructions?: Array<{
    steps?: Array<{
      number?: number;
      step?: string;
    }>;
  }>;
};

function stripHtml(value: string | null | undefined) {
  return value?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() ?? null;
}

function buildUrl(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`https://api.spoonacular.com${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

export class SpoonacularRecipeProvider implements RecipeProvider {
  id = "spoonacular";
  name = "Spoonacular";

  private get apiKey() {
    const key = process.env.SPOONACULAR_API_KEY;

    if (!key) {
      throw new Error("SPOONACULAR_API_KEY is not configured.");
    }

    return key;
  }

  async search(input: RecipeSearchInput): Promise<RecipeSearchResult[]> {
    const response = await fetch(
      buildUrl("/recipes/complexSearch", {
        apiKey: this.apiKey,
        query: input.query,
        cuisine: input.cuisines?.join(","),
        diet: input.diets?.join(","),
        maxReadyTime: input.maxCookTimeMinutes ?? undefined,
        number: 12,
        addRecipeInformation: "true",
        fillIngredients: "false"
      })
    );

    if (!response.ok) {
      throw new Error("Spoonacular recipe search failed.");
    }

    const data = (await response.json()) as SpoonacularSearchResponse;

    return (data.results ?? []).map((recipe) => ({
      providerId: this.id,
      externalId: String(recipe.id),
      title: recipe.title,
      imageUrl: recipe.image ?? null,
      sourceName: recipe.sourceName ?? null,
      sourceUrl: recipe.sourceUrl ?? null,
      authorName: recipe.creditsText ?? null,
      prepMinutes: null,
      cookMinutes: recipe.readyInMinutes ?? null,
      servings: recipe.servings ?? null,
      cuisines: recipe.cuisines ?? [],
      diets: recipe.diets ?? [],
      tags: recipe.dishTypes ?? []
    }));
  }

  async getRecipe(input: RecipeLookupInput): Promise<ImportedRecipeCandidate> {
    const response = await fetch(
      buildUrl(`/recipes/${input.externalId}/information`, {
        apiKey: this.apiKey,
        includeNutrition: "false"
      })
    );

    if (!response.ok) {
      throw new Error("Spoonacular recipe import failed.");
    }

    const recipe = (await response.json()) as SpoonacularRecipeInformation;
    const instructions =
      recipe.analyzedInstructions
        ?.flatMap((instruction) => instruction.steps ?? [])
        .sort((first, second) => (first.number ?? 0) - (second.number ?? 0))
        .map((step) => step.step?.trim())
        .filter((step): step is string => Boolean(step)) ?? [];

    return {
      providerId: this.id,
      externalId: String(recipe.id),
      title: recipe.title,
      description: stripHtml(recipe.summary),
      imageUrl: recipe.image ?? null,
      sourceName: recipe.sourceName ?? "Spoonacular",
      sourceUrl: recipe.sourceUrl ?? recipe.spoonacularSourceUrl ?? null,
      authorName: recipe.creditsText ?? null,
      prepMinutes: null,
      cookMinutes: recipe.readyInMinutes ?? null,
      servings: recipe.servings ?? 4,
      cuisines: recipe.cuisines ?? [],
      diets: recipe.diets ?? [],
      tags: [...(recipe.dishTypes ?? []), ...(recipe.cuisines ?? [])],
      ingredients:
        recipe.extendedIngredients?.map((ingredient) => ({
          displayText: ingredient.original ?? ingredient.name ?? "Ingredient",
          name: ingredient.nameClean ?? ingredient.name ?? ingredient.original ?? "ingredient",
          quantity: ingredient.amount ?? null,
          unit: ingredient.unit ?? null
        })) ?? [],
      instructions:
        instructions.length > 0
          ? instructions
          : ["Review the original source instructions before cooking."],
      rawPayload: recipe
    };
  }
}
