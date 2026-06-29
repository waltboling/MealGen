"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createMealProfileSchema,
  deactivateMealProfileSchema,
  inviteHouseholdUserSchema,
  updateHouseholdSchema,
  updateMealProfileSchema,
  updateMembershipRoleSchema
} from "@/features/household/schemas";
import { HouseholdService } from "@/features/household/service";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";
import { assertCanManageHousehold, canEditProfile } from "@/lib/auth/permissions";

const householdService = new HouseholdService();

function redirectWithStatus(status: string) {
  redirect(`/household?status=${status}`);
}

function revalidateHouseholdViews() {
  revalidatePath("/household");
  revalidatePath("/weekly-planner");
  revalidatePath("/dashboard");
}

export async function updateHouseholdAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  assertCanManageHousehold(context);

  const input = updateHouseholdSchema.parse({
    name: formData.get("name"),
    defaultServings: formData.get("defaultServings")
  });

  await householdService.updateHousehold(context, input);
  revalidateHouseholdViews();
  redirectWithStatus("household-updated");
}

export async function inviteHouseholdUserAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  assertCanManageHousehold(context);

  const input = inviteHouseholdUserSchema.parse({
    email: formData.get("email"),
    role: formData.get("role")
  });

  await householdService.inviteUser(context, input);
  revalidateHouseholdViews();
  redirectWithStatus("invite-created");
}

export async function updateMembershipRoleAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  assertCanManageHousehold(context);

  const input = updateMembershipRoleSchema.parse({
    userId: formData.get("userId"),
    role: formData.get("role")
  });

  await householdService.updateMembershipRole(context, input);
  revalidateHouseholdViews();
  redirectWithStatus("role-updated");
}

export async function createMealProfileAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  assertCanManageHousehold(context);

  const input = createMealProfileSchema.parse({
    name: formData.get("name"),
    profileType: formData.get("profileType"),
    color: formData.get("color"),
    initials: formData.get("initials"),
    activeFrom: formData.get("activeFrom"),
    activeUntil: formData.get("activeUntil"),
    likes: formData.get("likes"),
    dislikes: formData.get("dislikes"),
    allergies: formData.get("allergies"),
    dietaryPreferences: formData.get("dietaryPreferences"),
    favoriteCuisines: formData.get("favoriteCuisines"),
    preferredSpiceLevel: formData.get("preferredSpiceLevel"),
    notes: formData.get("notes")
  });

  await householdService.createProfile(context, input);
  revalidateHouseholdViews();
  redirectWithStatus("profile-created");
}

export async function updateMealProfileAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  const input = updateMealProfileSchema.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    profileType: formData.get("profileType"),
    active: formData.get("active") === "true",
    color: formData.get("color"),
    initials: formData.get("initials"),
    activeFrom: formData.get("activeFrom"),
    activeUntil: formData.get("activeUntil"),
    likes: formData.get("likes"),
    dislikes: formData.get("dislikes"),
    allergies: formData.get("allergies"),
    dietaryPreferences: formData.get("dietaryPreferences"),
    favoriteCuisines: formData.get("favoriteCuisines"),
    preferredSpiceLevel: formData.get("preferredSpiceLevel"),
    notes: formData.get("notes")
  });

  const settings = await householdService.getSettings(context);
  const profile = settings.profiles.find((item) => item.id === input.id);

  if (!profile || !canEditProfile(context, profile)) {
    throw new Error("You do not have permission to edit this profile.");
  }

  await householdService.updateProfile(context, input);
  revalidateHouseholdViews();
  redirectWithStatus("profile-updated");
}

export async function deactivateMealProfileAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  assertCanManageHousehold(context);

  const input = deactivateMealProfileSchema.parse({
    id: formData.get("id")
  });

  await householdService.deactivateProfile(context, input.id);
  revalidateHouseholdViews();
  redirectWithStatus("profile-deactivated");
}
