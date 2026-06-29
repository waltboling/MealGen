import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { isDemoMode, validateEnvironment } from "@/lib/env";
import { getCurrentUserOrRedirect } from "@/lib/auth/user";

export const DEMO_HOUSEHOLD_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000002";

export type CurrentHousehold = {
  householdId: string;
  userId: string;
  role: "ADMIN" | "OWNER" | "MEMBER" | "ADULT" | "GUEST";
  isDemo: boolean;
};

export async function getCurrentHouseholdOrRedirect(): Promise<CurrentHousehold> {
  validateEnvironment();

  if (isDemoMode()) {
    return {
      householdId: DEMO_HOUSEHOLD_ID,
      userId: DEMO_USER_ID,
      role: process.env.DEMO_HOUSEHOLD_ROLE === "member" ? "MEMBER" : "ADMIN",
      isDemo: true
    };
  }

  const user = await getCurrentUserOrRedirect();

  const existingMembership = await prisma.householdMembership.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { createdAt: "asc" }
  });

  if (existingMembership) {
    const linkedProfile = await prisma.householdMember.findFirst({
      where: {
        householdId: existingMembership.householdId,
        linkedUserId: user.id,
        profileType: "USER_LINKED",
        active: true
      }
    });

    if (!linkedProfile) {
      redirect("/onboarding/profile");
    }

    return {
      householdId: existingMembership.householdId,
      userId: user.id,
      role: existingMembership.role,
      isDemo: false
    };
  }

  redirect("/onboarding");
}
