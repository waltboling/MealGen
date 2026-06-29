import type { CurrentHousehold } from "@/lib/auth/current-household";
import type { MealPlanMealInput } from "@/features/meal-planning/types";
import { MealPlanRepository } from "@/server/repositories/meal-plan-repository";

const mealPlanRepository = new MealPlanRepository();

export class MealPlanningService {
  getWeekStartForMeal(context: CurrentHousehold, mealPlanMealId: string) {
    return mealPlanRepository.getWeekStartForMeal(
      context.householdId,
      mealPlanMealId,
      context.isDemo
    );
  }

  getOrCreateWeeklyPlan(context: CurrentHousehold, weekStartDate: string) {
    return mealPlanRepository.getOrCreateWeeklyPlan(
      context.householdId,
      weekStartDate,
      context.isDemo
    );
  }

  addMeal(
    context: CurrentHousehold,
    input: MealPlanMealInput & { weekStartDate: string }
  ) {
    return mealPlanRepository.addMeal(
      context.householdId,
      input,
      context.isDemo
    );
  }

  moveMeal(
    context: CurrentHousehold,
    mealPlanMealId: string,
    plannedForDate: string
  ) {
    return mealPlanRepository.moveMeal(
      context.householdId,
      mealPlanMealId,
      plannedForDate,
      context.isDemo
    );
  }

  removeMeal(context: CurrentHousehold, mealPlanMealId: string) {
    return mealPlanRepository.removeMeal(
      context.householdId,
      mealPlanMealId,
      context.isDemo
    );
  }
}
