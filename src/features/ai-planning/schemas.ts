import { z } from "zod";
import { mealTypeSchema, weekStartSchema } from "../meal-planning/schemas.ts";

const csvList = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

const nullablePositiveInt = z
  .union([
    z.coerce.number().int().positive(),
    z.literal(""),
    z.null(),
    z.undefined()
  ])
  .optional()
  .transform((value) => (value === "" || value == null ? null : value));

const nullableString = z
  .union([z.string().trim(), z.null(), z.undefined()])
  .optional()
  .transform((value) => (value ? value : null));

export const aiPlanningRequestSchema = z.object({
  prompt: z.string().trim().min(8).max(1800),
  sourceTypes: z
    .array(z.enum(["ai_generated", "recipe_catalog"]))
    .min(1)
    .default(["ai_generated"]),
  generationSeed: nullableString,
  mealType: mealTypeSchema.default("DINNER"),
  numberOfMeals: z.coerce.number().int().min(1).max(7).default(3),
  weekStartDate: weekStartSchema,
  participantMemberIds: z.array(z.uuid()).default([]),
  servings: z.coerce.number().int().min(1).max(24).default(4),
  maxCookTimeMinutes: nullablePositiveInt,
  calorieTarget: nullablePositiveInt,
  calorieMin: nullablePositiveInt,
  calorieMax: nullablePositiveInt,
  proteinGoal: nullablePositiveInt,
  preferredProteins: csvList,
  preferredBaseCarbs: csvList,
  vegetables: csvList,
  avoidIngredients: csvList,
  useHouseholdPreferences: z.coerce.boolean().default(true),
  usePantryStaples: z.coerce.boolean().default(true),
  useSavedRecipes: z.coerce.boolean().default(true)
});

export const aiIngredientSchema = z.object({
  displayText: z.string().trim().min(1),
  name: z.string().trim().min(1),
  quantity: z
    .union([z.coerce.number().positive(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value === "" || value == null ? null : value)),
  unit: nullableString
});

export const aiMealSuggestionSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1).max(160),
  mealType: mealTypeSchema,
  cuisine: nullableString,
  shortDescription: z.string().trim().min(1).max(400),
  whyItMatches: z.string().trim().min(1).max(800),
  estimatedCookTimeMinutes: nullablePositiveInt,
  estimatedCalories: nullablePositiveInt,
  estimatedProteinGrams: nullablePositiveInt,
  servings: z.number().int().min(1).max(24),
  ingredients: z.array(aiIngredientSchema).min(1).max(40),
  instructions: z.array(z.string().trim().min(1)).min(1).max(20),
  tags: z.array(z.string().trim().min(1).max(40)).max(16),
  matchedHouseholdPreferences: z.array(z.string().trim().min(1)).default([]),
  warnings: z.array(z.string().trim().min(1)).default([]),
  assumptions: z.array(z.string().trim().min(1)).default([]),
  nutritionEstimateNote: z
    .string()
    .trim()
    .min(1)
    .max(400)
    .default("Nutrition is estimated from typical ingredient values and portions."),
  sourceType: z.enum(["generated", "saved_recipe", "imported_recipe"]),
  sourceRecipeId: nullableString,
  sourceUrl: nullableString
});

export const aiPlanningResultSchema = z.object({
  providerId: z.string().trim().min(1),
  suggestions: z.array(aiMealSuggestionSchema).min(1).max(7),
  warnings: z.array(z.string().trim().min(1)).default([])
});

export const acceptedAiMealSchema = aiMealSuggestionSchema.extend({
  weekStartDate: weekStartSchema,
  plannedForDate: z
    .union([weekStartSchema, z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value ? value : null)),
  participantMemberIds: z.array(z.uuid()).min(1)
});

export const acceptAiMealFormSchema = z.object({
  title: z.string().trim().min(1).max(160),
  shortDescription: z.string().trim().max(500).nullable(),
  whyItMatches: z.string().trim().max(800).nullable(),
  mealType: mealTypeSchema,
  mealStrategyId: z
    .union([z.uuid(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value ? value : null)),
  weekStartDate: weekStartSchema,
  plannedForDate: z
    .union([weekStartSchema, z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value ? value : null)),
  participantMemberIds: z.array(z.uuid()).min(1),
  servings: z.coerce.number().int().min(1).max(24),
  estimatedCookTimeMinutes: z
    .union([z.coerce.number().int().positive(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value === "" || value == null ? null : value)),
  estimatedCalories: z
    .union([z.coerce.number().int().positive(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value === "" || value == null ? null : value)),
  estimatedProteinGrams: z
    .union([z.coerce.number().int().positive(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value === "" || value == null ? null : value)),
  cuisine: z.string().trim().max(80).nullable(),
  nutritionEstimateNote: z.string().trim().max(400).nullable(),
  ingredientsText: z.string().trim().min(1),
  instructionsText: z.string().trim().min(1),
  tagsText: z.string().trim().optional().default(""),
  sourceType: z.enum(["generated", "saved_recipe", "imported_recipe"])
});
