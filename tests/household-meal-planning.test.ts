import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canEditProfile,
  canManageHousehold,
  isHouseholdAdmin
} from "../src/lib/auth/permissions.ts";
import { groupMealsByPerson } from "../src/features/meal-planning/group-meals-by-person.ts";
import type { HouseholdProfile } from "../src/features/household/types.ts";
import type { PlannedMeal } from "../src/features/meal-planning/types.ts";

const adminContext = {
  householdId: "00000000-0000-4000-8000-000000000001",
  userId: "00000000-0000-4000-8000-000000000002",
  role: "ADMIN",
  isDemo: true
} as const;

const memberContext = {
  ...adminContext,
  role: "MEMBER"
} as const;

const profiles: HouseholdProfile[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    name: "Jon",
    active: true,
    linkedUserId: adminContext.userId,
    profileType: "USER_LINKED",
    temporary: false,
    activeFrom: null,
    activeUntil: null,
    color: null,
    initials: "JB",
    avatarUrl: null,
    preferredSpiceLevel: null,
    likes: [],
    dislikes: [],
    allergies: [],
    dietaryPreferences: [],
    favoriteCuisines: [],
    notes: null
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    name: "Inactive Guest",
    active: false,
    linkedUserId: null,
    profileType: "GUEST",
    temporary: true,
    activeFrom: "2026-06-22",
    activeUntil: "2026-06-23",
    color: null,
    initials: "IG",
    avatarUrl: null,
    preferredSpiceLevel: null,
    likes: [],
    dislikes: [],
    allergies: ["tree nuts"],
    dietaryPreferences: [],
    favoriteCuisines: [],
    notes: null
  }
];

const meals: PlannedMeal[] = [
  {
    id: "60000000-0000-4000-8000-000000000001",
    recipeId: "10000000-0000-4000-8000-000000000001",
    recipeTitle: "Chicken Bowls",
    recipeImageUrl: null,
    mealType: "DINNER",
    plannedForDate: "2026-06-22",
    servings: 4,
    notes: null,
    participantMemberIds: [
      "00000000-0000-4000-8000-000000000101",
      "00000000-0000-4000-8000-000000000102"
    ],
    participantNames: ["Jon", "Inactive Guest"]
  },
  {
    id: "60000000-0000-4000-8000-000000000002",
    recipeId: "10000000-0000-4000-8000-000000000002",
    recipeTitle: "Solo Pasta",
    recipeImageUrl: null,
    mealType: "DINNER",
    plannedForDate: "2026-06-23",
    servings: 1,
    notes: null,
    participantMemberIds: [],
    participantNames: []
  }
];

describe("household permissions", () => {
  it("allows admins to manage household settings", () => {
    assert.equal(isHouseholdAdmin("ADMIN"), true);
    assert.equal(isHouseholdAdmin("OWNER"), true);
    assert.equal(canManageHousehold(adminContext), true);
    assert.equal(canManageHousehold(memberContext), false);
  });

  it("allows members to edit only their own linked profile", () => {
    assert.equal(canEditProfile(memberContext, profiles[0]), true);
    assert.equal(canEditProfile(memberContext, profiles[1]), false);
    assert.equal(
      canEditProfile(adminContext, {
        ...profiles[0],
        linkedUserId: "00000000-0000-4000-8000-000000000099"
      }),
      false
    );
    assert.equal(
      canEditProfile(adminContext, { ...profiles[1], linkedUserId: null }),
      true
    );
  });
});

describe("meals by person grouping", () => {
  it("keeps inactive profiles visible when referenced by old meals", () => {
    const groups = groupMealsByPerson(meals, profiles, [
      "2026-06-22",
      "2026-06-23"
    ]);

    const inactiveGuest = groups.find((group) => group.name === "Inactive Guest");

    assert.ok(inactiveGuest);
    assert.equal(inactiveGuest.active, false);
    assert.equal(inactiveGuest.mealsByDay[0].meals[0].recipeTitle, "Chicken Bowls");
  });

  it("groups meals without participants separately", () => {
    const groups = groupMealsByPerson(meals, profiles, [
      "2026-06-22",
      "2026-06-23"
    ]);

    const unnamed = groups.find((group) => group.name === "No named participants");

    assert.ok(unnamed);
    assert.equal(unnamed.mealsByDay[1].meals[0].recipeTitle, "Solo Pasta");
  });
});
