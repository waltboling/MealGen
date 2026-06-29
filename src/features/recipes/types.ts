export type RecipeOrigin = "CUSTOM" | "IMPORTED";

export type RecipeIngredientInput = {
  displayText: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
};

export type RecipeInstructionInput = {
  text: string;
};

export type RecipeNoteInput = {
  text: string;
};

export type RecipeFormInput = {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  authorName?: string | null;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  servings: number;
  tags: string[];
  ingredients: RecipeIngredientInput[];
  instructions: RecipeInstructionInput[];
  notes: RecipeNoteInput[];
};

export type RecipeImportInput = {
  providerId: string;
  externalId: string;
};

export type RecipeListItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sourceName: string | null;
  origin: RecipeOrigin;
  prepMinutes: number | null;
  cookMinutes: number | null;
  servings: number;
  tags: string[];
  ingredientCount: number;
  noteCount: number;
  updatedAt: Date;
};

export type RecipeDetails = RecipeListItem & {
  sourceName: string | null;
  sourceUrl: string | null;
  authorName: string | null;
  importedRecipeId: string | null;
  providerId: string | null;
  externalId: string | null;
  ingredients: Array<RecipeIngredientInput & { id: string; position: number }>;
  instructions: Array<RecipeInstructionInput & { id: string; step: number }>;
  notes: Array<RecipeNoteInput & { id: string; createdAt: Date }>;
};
