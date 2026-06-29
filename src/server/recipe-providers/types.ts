export type RecipeSearchInput = {
  query?: string;
  cuisines?: string[];
  diets?: string[];
  maxCookTimeMinutes?: number | null;
  servings?: number | null;
};

export type RecipeSearchResult = {
  providerId: string;
  externalId: string;
  title: string;
  imageUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  authorName: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  servings: number | null;
  cuisines: string[];
  diets: string[];
  tags: string[];
};

export type RecipeLookupInput = {
  externalId: string;
};

export type ImportedRecipeCandidate = RecipeSearchResult & {
  description: string | null;
  ingredients: Array<{
    displayText: string;
    name: string;
    quantity: number | null;
    unit: string | null;
  }>;
  instructions: string[];
  tags: string[];
  rawPayload?: unknown;
};

export interface RecipeProvider {
  id: string;
  name: string;
  search(input: RecipeSearchInput): Promise<RecipeSearchResult[]>;
  getRecipe(input: RecipeLookupInput): Promise<ImportedRecipeCandidate>;
}
