import { z } from "zod";

export const mealPlanIdSchema = z.object({
  mealPlanId: z.uuid()
});

export const mealTypeSchema = z.enum([
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACK",
  "MEAL_PREP",
  "OTHER"
]);

export const mealPlanMealIdSchema = z.object({
  mealPlanMealId: z.uuid()
});

export const weekStartSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/);

const optionalWeekStartSchema = z
  .union([weekStartSchema, z.literal(""), z.null(), z.undefined()])
  .transform((value) => (value ? value : null));

export const addMealToPlanSchema = z.object({
  weekStartDate: weekStartSchema,
  recipeId: z.uuid(),
  mealStrategyId: z
    .union([z.uuid(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value ? value : null)),
  plannedForDate: optionalWeekStartSchema,
  mealType: mealTypeSchema,
  servings: z.coerce.number().int().min(1).max(100),
  participantMemberIds: z.array(z.uuid()).min(1),
  notes: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null))
});

export const moveMealSchema = z.object({
  mealPlanMealId: z.uuid(),
  plannedForDate: weekStartSchema
});
