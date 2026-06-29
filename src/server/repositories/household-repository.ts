import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import type {
  HouseholdMemberOption,
  HouseholdProfile,
  HouseholdRole,
  HouseholdSettings
} from "@/features/household/types";

type DemoHouseholdData = HouseholdSettings;

type ProfileInput = {
  name: string;
  profileType: "USER_LINKED" | "MANAGED" | "GUEST";
  color?: string | null;
  initials?: string | null;
  activeFrom?: string | null;
  activeUntil?: string | null;
  likes: string[];
  dislikes: string[];
  allergies: string[];
  dietaryPreferences: string[];
  favoriteCuisines: string[];
  preferredSpiceLevel?: number | null;
  notes?: string | null;
};

const demoHouseholdPath = path.join(process.cwd(), "data", "demo-household.json");

function toDateOnly(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function createInviteCode() {
  return randomUUID().split("-")[0].toUpperCase();
}

async function readDemoHousehold() {
  const raw = await readFile(demoHouseholdPath, "utf8");
  return JSON.parse(raw) as DemoHouseholdData;
}

async function writeDemoHousehold(data: DemoHouseholdData) {
  await writeFile(demoHouseholdPath, `${JSON.stringify(data, null, 2)}\n`);
}

function mapProfile(member: {
  id: string;
  linkedUserId: string | null;
  profileType: "USER_LINKED" | "MANAGED" | "GUEST";
  name: string;
  avatarUrl: string | null;
  color: string | null;
  initials: string | null;
  active: boolean;
  temporary: boolean;
  activeFrom: Date | null;
  activeUntil: Date | null;
  preferredSpiceLevel: number | null;
  likes: string[];
  dislikes: string[];
  allergies: string[];
  dietaryPreferences: string[];
  favoriteCuisines: string[];
  notes: string | null;
}): HouseholdProfile {
  return {
    id: member.id,
    linkedUserId: member.linkedUserId,
    profileType: member.profileType,
    name: member.name,
    avatarUrl: member.avatarUrl,
    color: member.color,
    initials: member.initials,
    active: member.active,
    temporary: member.temporary,
    activeFrom: toDateOnly(member.activeFrom),
    activeUntil: toDateOnly(member.activeUntil),
    preferredSpiceLevel: member.preferredSpiceLevel,
    likes: member.likes,
    dislikes: member.dislikes,
    allergies: member.allergies,
    dietaryPreferences: member.dietaryPreferences,
    favoriteCuisines: member.favoriteCuisines,
    notes: member.notes
  };
}

function toMemberOption(profile: HouseholdProfile): HouseholdMemberOption {
  return {
    id: profile.id,
    name: profile.name,
    active: profile.active,
    linkedUserId: profile.linkedUserId,
    profileType: profile.profileType,
    temporary: profile.temporary,
    activeFrom: profile.activeFrom,
    activeUntil: profile.activeUntil,
    color: profile.color,
    initials: profile.initials
  };
}

function isProfileVisibleForWeek(profile: HouseholdProfile, weekStartDate?: string) {
  if (!profile.active) {
    return false;
  }

  if (!weekStartDate || profile.profileType !== "GUEST") {
    return true;
  }

  const weekEndDate = new Date(`${weekStartDate}T00:00:00.000Z`);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
  const weekEnd = weekEndDate.toISOString().slice(0, 10);

  if (profile.activeFrom && profile.activeFrom > weekEnd) {
    return false;
  }

  if (profile.activeUntil && profile.activeUntil < weekStartDate) {
    return false;
  }

  return true;
}

export class HouseholdRepository {
  async getSettings(householdId: string, isDemo: boolean): Promise<HouseholdSettings> {
    if (isDemo) {
      return readDemoHousehold();
    }

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        memberships: {
          include: { user: true },
          orderBy: { createdAt: "asc" }
        },
        members: {
          orderBy: { createdAt: "asc" }
        },
        invitations: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!household) {
      throw new Error("Household not found.");
    }

    return {
      household: {
        id: household.id,
        name: household.name,
        defaultServings: 4
      },
      accountUsers: household.memberships.map((membership) => {
        const linkedProfile = household.members.find(
          (profile) => profile.linkedUserId === membership.userId
        );

        return {
          id: membership.userId,
          email: membership.user.email,
          name: membership.user.name,
          role: membership.role,
          status: membership.status,
          linkedProfileId: linkedProfile?.id ?? null
        };
      }),
      invitations: household.invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        token: invitation.token
      })),
      profiles: household.members.map(mapProfile)
    };
  }

  async listMembers(
    householdId: string,
    isDemo: boolean,
    weekStartDate?: string
  ): Promise<HouseholdMemberOption[]> {
    const profiles = await this.listProfiles(householdId, isDemo);
    return profiles
      .filter((profile) => isProfileVisibleForWeek(profile, weekStartDate))
      .map(toMemberOption);
  }

  async listProfiles(
    householdId: string,
    isDemo: boolean
  ): Promise<HouseholdProfile[]> {
    if (isDemo) {
      const data = await readDemoHousehold();
      return data.profiles;
    }

    const members = await prisma.householdMember.findMany({
      where: { householdId },
      orderBy: { createdAt: "asc" }
    });

    if (members.length === 0) {
      const member = await prisma.householdMember.create({
        data: {
          householdId,
          name: "Household Member",
          profileType: "MANAGED"
        }
      });

      return [mapProfile(member)];
    }

    return members.map(mapProfile);
  }

  async updateHousehold(
    householdId: string,
    isDemo: boolean,
    input: { name: string; defaultServings: number }
  ) {
    if (isDemo) {
      const data = await readDemoHousehold();
      data.household.name = input.name;
      data.household.defaultServings = input.defaultServings;
      await writeDemoHousehold(data);
      return;
    }

    await prisma.household.update({
      where: { id: householdId },
      data: { name: input.name }
    });
  }

  async inviteUser(
    householdId: string,
    isDemo: boolean,
    input: { email: string; role: HouseholdRole }
  ) {
    if (isDemo) {
      const data = await readDemoHousehold();
      data.invitations.unshift({
        id: randomUUID(),
        email: input.email,
        role: input.role,
        status: "PENDING",
        token: createInviteCode()
      });
      await writeDemoHousehold(data);
      return;
    }

    await prisma.householdInvitation.create({
      data: {
        householdId,
        email: input.email,
        role: input.role,
        status: "PENDING",
        token: createInviteCode()
      }
    });
  }

  async updateMembershipRole(
    householdId: string,
    isDemo: boolean,
    input: { userId: string; role: HouseholdRole }
  ) {
    if (isDemo) {
      const data = await readDemoHousehold();
      const user = data.accountUsers.find((account) => account.id === input.userId);
      if (user) {
        user.role = input.role;
        await writeDemoHousehold(data);
      }
      return;
    }

    await prisma.householdMembership.updateMany({
      where: { householdId, userId: input.userId },
      data: { role: input.role }
    });
  }

  async createProfile(householdId: string, isDemo: boolean, input: ProfileInput) {
    if (isDemo) {
      const data = await readDemoHousehold();
      data.profiles.push({
        id: randomUUID(),
        linkedUserId: null,
        name: input.name,
        profileType: input.profileType,
        active: true,
        temporary: input.profileType === "GUEST",
        activeFrom: normalizeOptionalText(input.activeFrom),
        activeUntil: normalizeOptionalText(input.activeUntil),
        avatarUrl: null,
        color: normalizeOptionalText(input.color),
        initials: normalizeOptionalText(input.initials),
        likes: input.likes,
        dislikes: input.dislikes,
        allergies: input.allergies,
        dietaryPreferences: input.dietaryPreferences,
        favoriteCuisines: input.favoriteCuisines,
        preferredSpiceLevel: input.preferredSpiceLevel ?? null,
        notes: normalizeOptionalText(input.notes)
      });
      await writeDemoHousehold(data);
      return;
    }

    await prisma.householdMember.create({
      data: {
        householdId,
        name: input.name,
        profileType: input.profileType,
        temporary: input.profileType === "GUEST",
        activeFrom: input.activeFrom ? new Date(`${input.activeFrom}T00:00:00.000Z`) : null,
        activeUntil: input.activeUntil ? new Date(`${input.activeUntil}T00:00:00.000Z`) : null,
        color: normalizeOptionalText(input.color),
        initials: normalizeOptionalText(input.initials),
        likes: input.likes,
        dislikes: input.dislikes,
        allergies: input.allergies,
        dietaryPreferences: input.dietaryPreferences,
        favoriteCuisines: input.favoriteCuisines,
        preferredSpiceLevel: input.preferredSpiceLevel ?? null,
        notes: normalizeOptionalText(input.notes)
      }
    });
  }

  async updateProfile(
    householdId: string,
    isDemo: boolean,
    input: ProfileInput & { id: string; active: boolean }
  ) {
    if (isDemo) {
      const data = await readDemoHousehold();
      const profile = data.profiles.find((item) => item.id === input.id);
      if (profile) {
        Object.assign(profile, {
          name: input.name,
          profileType: input.profileType,
          active: input.active,
          temporary: input.profileType === "GUEST",
          activeFrom: normalizeOptionalText(input.activeFrom),
          activeUntil: normalizeOptionalText(input.activeUntil),
          color: normalizeOptionalText(input.color),
          initials: normalizeOptionalText(input.initials),
          likes: input.likes,
          dislikes: input.dislikes,
          allergies: input.allergies,
          dietaryPreferences: input.dietaryPreferences,
          favoriteCuisines: input.favoriteCuisines,
          preferredSpiceLevel: input.preferredSpiceLevel ?? null,
          notes: normalizeOptionalText(input.notes)
        });
        await writeDemoHousehold(data);
      }
      return;
    }

    await prisma.householdMember.updateMany({
      where: { id: input.id, householdId },
      data: {
        name: input.name,
        profileType: input.profileType,
        active: input.active,
        temporary: input.profileType === "GUEST",
        activeFrom: input.activeFrom ? new Date(`${input.activeFrom}T00:00:00.000Z`) : null,
        activeUntil: input.activeUntil ? new Date(`${input.activeUntil}T00:00:00.000Z`) : null,
        color: normalizeOptionalText(input.color),
        initials: normalizeOptionalText(input.initials),
        likes: input.likes,
        dislikes: input.dislikes,
        allergies: input.allergies,
        dietaryPreferences: input.dietaryPreferences,
        favoriteCuisines: input.favoriteCuisines,
        preferredSpiceLevel: input.preferredSpiceLevel ?? null,
        notes: normalizeOptionalText(input.notes)
      }
    });
  }

  async deactivateProfile(householdId: string, isDemo: boolean, id: string) {
    if (isDemo) {
      const data = await readDemoHousehold();
      const profile = data.profiles.find((item) => item.id === id);
      if (profile) {
        profile.active = false;
        await writeDemoHousehold(data);
      }
      return;
    }

    await prisma.householdMember.updateMany({
      where: { id, householdId },
      data: { active: false }
    });
  }
}
