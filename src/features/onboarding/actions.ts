"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { isDemoMode } from "@/lib/env";
import { getCurrentUserOrRedirect, getPostAuthRedirect } from "@/lib/auth/user";
import {
  createHouseholdOnboardingSchema,
  joinHouseholdSchema,
  tasteProfileSchema
} from "@/features/onboarding/schemas";

function emptyToNull(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

function normalizedCode(value: string) {
  return value.trim().toUpperCase();
}

export async function createHouseholdOnboardingAction(formData: FormData) {
  if (isDemoMode()) {
    redirect("/dashboard");
  }

  const user = await getCurrentUserOrRedirect();
  const existingDestination = await getPostAuthRedirect(user.id);

  if (existingDestination !== "/onboarding") {
    redirect(existingDestination);
  }

  const input = createHouseholdOnboardingSchema.parse({
    householdName: formData.get("householdName"),
    profileName: formData.get("profileName"),
    initials: formData.get("initials"),
    color: formData.get("color"),
    likes: formData.get("likes"),
    dislikes: formData.get("dislikes"),
    allergies: formData.get("allergies"),
    dietaryPreferences: formData.get("dietaryPreferences"),
    favoriteCuisines: formData.get("favoriteCuisines"),
    preferredSpiceLevel: formData.get("preferredSpiceLevel"),
    notes: formData.get("notes")
  });

  await prisma.household.create({
    data: {
      name: input.householdName,
      memberships: {
        create: {
          userId: user.id,
          role: "ADMIN",
          status: "ACTIVE"
        }
      },
      members: {
        create: {
          linkedUserId: user.id,
          profileType: "USER_LINKED",
          name: input.profileName,
          initials: emptyToNull(input.initials) ?? initialsFor(input.profileName),
          color: emptyToNull(input.color),
          likes: input.likes,
          dislikes: input.dislikes,
          allergies: input.allergies,
          dietaryPreferences: input.dietaryPreferences,
          favoriteCuisines: input.favoriteCuisines,
          preferredSpiceLevel: input.preferredSpiceLevel,
          notes: emptyToNull(input.notes)
        }
      }
    }
  });

  redirect("/dashboard");
}

export async function acceptHouseholdInviteAction(formData: FormData) {
  if (isDemoMode()) {
    redirect("/dashboard");
  }

  const user = await getCurrentUserOrRedirect();
  const input = joinHouseholdSchema.parse({
    inviteCode: formData.get("inviteCode")
  });
  const code = normalizedCode(input.inviteCode);

  const invitation = await prisma.householdInvitation.findFirst({
    where: {
      status: "PENDING",
      token: code,
      email: {
        equals: user.email,
        mode: "insensitive"
      }
    }
  });

  if (!invitation) {
    redirect(`/onboarding/join?code=${encodeURIComponent(code)}&error=invite`);
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.householdMembership.upsert({
      where: {
        householdId_userId: {
          householdId: invitation.householdId,
          userId: user.id
        }
      },
      update: {
        role: invitation.role,
        status: "ACTIVE"
      },
      create: {
        householdId: invitation.householdId,
        userId: user.id,
        role: invitation.role,
        status: "ACTIVE"
      }
    });

    await transaction.householdInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" }
    });
  });

  redirect("/onboarding/profile?joined=1");
}

export async function createLinkedTasteProfileAction(formData: FormData) {
  if (isDemoMode()) {
    redirect("/dashboard");
  }

  const user = await getCurrentUserOrRedirect();
  const membership = await prisma.householdMembership.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { createdAt: "asc" }
  });

  if (!membership) {
    redirect("/onboarding");
  }

  const existingProfile = await prisma.householdMember.findFirst({
    where: {
      householdId: membership.householdId,
      linkedUserId: user.id,
      profileType: "USER_LINKED",
      active: true
    }
  });

  if (existingProfile) {
    redirect("/dashboard");
  }

  const input = tasteProfileSchema.parse({
    profileName: formData.get("profileName"),
    initials: formData.get("initials"),
    color: formData.get("color"),
    likes: formData.get("likes"),
    dislikes: formData.get("dislikes"),
    allergies: formData.get("allergies"),
    dietaryPreferences: formData.get("dietaryPreferences"),
    favoriteCuisines: formData.get("favoriteCuisines"),
    preferredSpiceLevel: formData.get("preferredSpiceLevel"),
    notes: formData.get("notes")
  });

  await prisma.householdMember.create({
    data: {
      householdId: membership.householdId,
      linkedUserId: user.id,
      profileType: "USER_LINKED",
      name: input.profileName,
      initials: emptyToNull(input.initials) ?? initialsFor(input.profileName),
      color: emptyToNull(input.color),
      likes: input.likes,
      dislikes: input.dislikes,
      allergies: input.allergies,
      dietaryPreferences: input.dietaryPreferences,
      favoriteCuisines: input.favoriteCuisines,
      preferredSpiceLevel: input.preferredSpiceLevel,
      notes: emptyToNull(input.notes)
    }
  });

  redirect("/dashboard");
}
