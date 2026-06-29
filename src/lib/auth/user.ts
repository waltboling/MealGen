import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { isDemoMode, validateEnvironment } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentUserProfile = {
  id: string;
  email: string;
  name: string | null;
};

export async function getCurrentUserOrRedirect(): Promise<CurrentUserProfile> {
  validateEnvironment();

  if (isDemoMode()) {
    return {
      id: "00000000-0000-4000-8000-000000000002",
      email: "jon@example.com",
      name: "Jon"
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const profile = await prisma.userProfile.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      name: user.user_metadata?.name ?? null
    },
    create: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name ?? null
    }
  });

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name
  };
}

export async function getPostAuthRedirect(userId: string, inviteCode?: string) {
  if (inviteCode) {
    return `/onboarding/join?code=${encodeURIComponent(inviteCode)}`;
  }

  const membership = await prisma.householdMembership.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" }
  });

  if (!membership) {
    return "/onboarding";
  }

  const linkedProfile = await prisma.householdMember.findFirst({
    where: {
      householdId: membership.householdId,
      linkedUserId: userId,
      profileType: "USER_LINKED",
      active: true
    }
  });

  return linkedProfile ? "/dashboard" : "/onboarding/profile";
}
