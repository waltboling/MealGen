import { z } from "zod";

const csvList = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

export const tasteProfileSchema = z.object({
  profileName: z.string().trim().min(1).max(80),
  initials: z.string().trim().max(4).optional().nullable(),
  color: z.string().trim().max(24).optional().nullable(),
  likes: csvList,
  dislikes: csvList,
  allergies: csvList,
  dietaryPreferences: csvList,
  favoriteCuisines: csvList,
  preferredSpiceLevel: z.coerce.number().int().min(0).max(5).default(2),
  notes: z.string().trim().max(800).optional().nullable()
});

export const createHouseholdOnboardingSchema = tasteProfileSchema.extend({
  householdName: z.string().trim().min(1).max(80)
});

export const joinHouseholdSchema = z.object({
  inviteCode: z.string().trim().min(3).max(80)
});
