import { z } from "zod";

export const recipeIdSchema = z.object({
  recipeId: z.uuid()
});

export const recipeImportSchema = z.object({
  providerId: z.string().trim().min(1).max(80),
  externalId: z.string().trim().min(1).max(160)
});

export const addRecipeToWeekSchema = z.object({
  recipeId: z.uuid(),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mealType: z
    .enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "MEAL_PREP", "OTHER"])
    .default("DINNER"),
  servings: z.coerce.number().int().min(1).max(100).optional()
});

export const importRecipeToWeekSchema = recipeImportSchema.extend({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mealType: z
    .enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "MEAL_PREP", "OTHER"])
    .default("DINNER"),
  servings: z.coerce.number().int().min(1).max(100).optional()
});

export const recipeSearchSchema = z.object({
  query: z.string().trim().optional(),
  cuisines: z.array(z.string().trim().min(1).max(40)).default([]),
  diets: z.array(z.string().trim().min(1).max(40)).default([]),
  maxCookTimeMinutes: z
    .union([z.coerce.number().int().positive(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value === "" || value == null ? null : value)),
  servings: z
    .union([z.coerce.number().int().positive(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value === "" || value == null ? null : value))
});

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const nullableNumber = z
  .union([z.coerce.number().int().min(0), z.literal("")])
  .transform((value) => (value === "" ? null : value));

export const recipeIngredientSchema = z.object({
  displayText: z.string().trim().min(1),
  name: z.string().trim().min(1),
  quantity: z
    .union([z.coerce.number().positive(), z.literal(""), z.null()])
    .transform((value) => (value === "" ? null : value)),
  unit: optionalText
});

export const recipeInstructionSchema = z.object({
  text: z.string().trim().min(1)
});

export const recipeNoteSchema = z.object({
  text: z.string().trim().min(1)
});

export const recipeFormSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: optionalText,
  imageUrl: optionalText,
  sourceName: optionalText,
  sourceUrl: optionalText,
  authorName: optionalText,
  prepMinutes: nullableNumber,
  cookMinutes: nullableNumber,
  servings: z.coerce.number().int().min(1).max(100),
  tags: z.array(z.string().trim().min(1).max(40)).max(16),
  ingredients: z.array(recipeIngredientSchema).min(1),
  instructions: z.array(recipeInstructionSchema).min(1),
  notes: z.array(recipeNoteSchema).max(20)
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
