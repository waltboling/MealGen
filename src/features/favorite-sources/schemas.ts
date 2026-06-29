import { z } from "zod";

export const favoriteSourceTypeSchema = z.enum([
  "WEBSITE",
  "CREATOR",
  "BLOG",
  "PUBLICATION",
  "CHANNEL"
]);

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

export const favoriteSourceIdSchema = z.object({
  id: z.uuid()
});

export const favoriteSourceFormSchema = z.object({
  type: favoriteSourceTypeSchema,
  name: z.string().trim().min(1).max(120),
  url: optionalText,
  rankingBoost: z.coerce.number().int().min(1).max(100).default(10),
  notes: optionalText
});
