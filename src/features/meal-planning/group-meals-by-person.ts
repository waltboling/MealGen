import type { HouseholdProfile } from "@/features/household/types";
import type { PlannedMeal } from "@/features/meal-planning/types";

export type MealsByPersonGroup = {
  profileId: string | null;
  name: string;
  profileType: "USER_LINKED" | "MANAGED" | "GUEST" | null;
  active: boolean;
  mealsByDay: Array<{
    dateKey: string;
    meals: PlannedMeal[];
  }>;
};

export function groupMealsByPerson(
  meals: PlannedMeal[],
  profiles: HouseholdProfile[],
  dayKeys: string[]
): MealsByPersonGroup[] {
  const referencedProfileIds = new Set<string>();
  let hasUnnamedMeals = false;

  for (const meal of meals) {
    if (meal.participantMemberIds.length === 0) {
      hasUnnamedMeals = true;
    }

    for (const profileId of meal.participantMemberIds) {
      referencedProfileIds.add(profileId);
    }
  }

  const visibleProfiles = profiles.filter(
    (profile) => profile.active || referencedProfileIds.has(profile.id)
  );

  const groups: MealsByPersonGroup[] = visibleProfiles.map((profile) => ({
    profileId: profile.id,
    name: profile.name,
    profileType: profile.profileType,
    active: profile.active,
    mealsByDay: dayKeys.map((dateKey) => ({
      dateKey,
      meals: meals.filter(
        (meal) =>
          meal.plannedForDate === dateKey &&
          meal.participantMemberIds.includes(profile.id)
      )
    }))
  }));

  if (hasUnnamedMeals) {
    groups.push({
      profileId: null,
      name: "No named participants",
      profileType: null,
      active: true,
      mealsByDay: dayKeys.map((dateKey) => ({
        dateKey,
        meals: meals.filter(
          (meal) =>
            meal.plannedForDate === dateKey &&
            meal.participantMemberIds.length === 0
        )
      }))
    });
  }

  return groups.sort((a, b) => {
    if (a.profileType === "GUEST" && b.profileType !== "GUEST") {
      return 1;
    }

    if (b.profileType === "GUEST" && a.profileType !== "GUEST") {
      return -1;
    }

    return a.name.localeCompare(b.name);
  });
}
