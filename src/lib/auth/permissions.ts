import type { CurrentHousehold } from "@/lib/auth/current-household";

export type HouseholdPermission = "manage_household" | "manage_profiles";

export function isHouseholdAdmin(role: string | null | undefined) {
  return role === "ADMIN" || role === "OWNER";
}

export function canManageHousehold(context: CurrentHousehold) {
  return isHouseholdAdmin(context.role);
}

export function assertCanManageHousehold(context: CurrentHousehold) {
  if (!canManageHousehold(context)) {
    throw new Error("You do not have permission to manage household settings.");
  }
}

export function canEditProfile(
  context: CurrentHousehold,
  profile: { linkedUserId?: string | null }
) {
  if (profile.linkedUserId === context.userId) {
    return true;
  }

  return canManageHousehold(context) && !profile.linkedUserId;
}
