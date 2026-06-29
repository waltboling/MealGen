import type { CurrentHousehold } from "@/lib/auth/current-household";
import { HouseholdRepository } from "@/server/repositories/household-repository";

const householdRepository = new HouseholdRepository();

export class HouseholdService {
  getSettings(context: CurrentHousehold) {
    return householdRepository.getSettings(context.householdId, context.isDemo);
  }

  listMembers(context: CurrentHousehold, weekStartDate?: string) {
    return householdRepository.listMembers(
      context.householdId,
      context.isDemo,
      weekStartDate
    );
  }

  listProfiles(context: CurrentHousehold) {
    return householdRepository.listProfiles(context.householdId, context.isDemo);
  }

  updateHousehold(
    context: CurrentHousehold,
    input: { name: string; defaultServings: number }
  ) {
    return householdRepository.updateHousehold(
      context.householdId,
      context.isDemo,
      input
    );
  }

  inviteUser(
    context: CurrentHousehold,
    input: { email: string; role: "ADMIN" | "OWNER" | "ADULT" | "MEMBER" | "GUEST" }
  ) {
    return householdRepository.inviteUser(context.householdId, context.isDemo, input);
  }

  updateMembershipRole(
    context: CurrentHousehold,
    input: { userId: string; role: "ADMIN" | "OWNER" | "ADULT" | "MEMBER" | "GUEST" }
  ) {
    return householdRepository.updateMembershipRole(
      context.householdId,
      context.isDemo,
      input
    );
  }

  createProfile(
    context: CurrentHousehold,
    input: Parameters<HouseholdRepository["createProfile"]>[2]
  ) {
    return householdRepository.createProfile(
      context.householdId,
      context.isDemo,
      input
    );
  }

  updateProfile(
    context: CurrentHousehold,
    input: Parameters<HouseholdRepository["updateProfile"]>[2]
  ) {
    return householdRepository.updateProfile(
      context.householdId,
      context.isDemo,
      input
    );
  }

  deactivateProfile(context: CurrentHousehold, id: string) {
    return householdRepository.deactivateProfile(
      context.householdId,
      context.isDemo,
      id
    );
  }
}
