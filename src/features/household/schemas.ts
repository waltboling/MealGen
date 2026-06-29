import { z } from "zod";

export const householdIdSchema = z.object({
  householdId: z.uuid()
});

const csvList = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

export const householdRoleSchema = z.enum([
  "ADMIN",
  "OWNER",
  "ADULT",
  "MEMBER",
  "GUEST"
]);

export const householdProfileTypeSchema = z.enum([
  "USER_LINKED",
  "MANAGED",
  "GUEST"
]);

export const updateHouseholdSchema = z.object({
  name: z.string().trim().min(1).max(80),
  defaultServings: z.coerce.number().int().min(1).max(24).default(4)
});

export const inviteHouseholdUserSchema = z.object({
  email: z.email(),
  role: householdRoleSchema.default("MEMBER")
});

export const updateMembershipRoleSchema = z.object({
  userId: z.uuid(),
  role: householdRoleSchema
});

export const createMealProfileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  profileType: householdProfileTypeSchema.default("MANAGED"),
  color: z.string().trim().max(24).optional().nullable(),
  initials: z.string().trim().max(4).optional().nullable(),
  activeFrom: z.string().trim().optional().nullable(),
  activeUntil: z.string().trim().optional().nullable(),
  likes: csvList,
  dislikes: csvList,
  allergies: csvList,
  dietaryPreferences: csvList,
  favoriteCuisines: csvList,
  preferredSpiceLevel: z.coerce.number().int().min(0).max(5).optional().nullable(),
  notes: z.string().trim().max(800).optional().nullable()
});

export const updateMealProfileSchema = createMealProfileSchema.extend({
  id: z.uuid(),
  active: z.coerce.boolean().default(true)
});

export const deactivateMealProfileSchema = z.object({
  id: z.uuid()
});
