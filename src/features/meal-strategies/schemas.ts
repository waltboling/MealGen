import { z } from "zod";
import { mealTypeSchema } from "@/features/meal-planning/schemas";

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
  .transform((value) => (value === "" || value == null ? null : value));

export const mealStrategyIdSchema = z.object({
  mealStrategyId: z.uuid()
});

export const mealStrategyFormSchema = z.object({
  name: z.string().trim().min(1).max(100),
  mealType: mealTypeSchema,
  weeklyTarget: z.coerce.number().int().min(1).max(14),
  defaultServings: z.coerce.number().int().min(1).max(24),
  prompt: z.string().trim().min(8).max(1200),
  maxCookTimeMinutes: nullablePositiveInt,
  calorieMin: nullablePositiveInt,
  calorieMax: nullablePositiveInt,
  proteinGoal: nullablePositiveInt,
  preferredProteins: csvList,
  preferredBaseCarbs: csvList,
  vegetables: csvList,
  avoidIngredients: csvList,
  sourceTypes: z
    .array(z.enum(["ai_generated", "recipe_catalog"]))
    .min(1)
    .default(["ai_generated"])
});
