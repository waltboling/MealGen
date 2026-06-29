import { z } from "zod";

export const groceryListIdSchema = z.object({
  groceryListId: z.uuid()
});

export const groceryItemIdSchema = z.object({
  groceryItemId: z.uuid()
});

export const weekStartSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/);

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

export const manualGroceryItemSchema = z.object({
  weekStartDate: weekStartSchema,
  name: z.string().trim().min(1).max(120),
  quantity: z
    .union([z.coerce.number().positive(), z.literal("")])
    .transform((value) => (value === "" ? null : value)),
  unit: optionalText,
  category: optionalText
});

export const toggleGroceryItemSchema = z.object({
  groceryItemId: z.uuid(),
  checked: z.boolean()
});
