import type { CurrentHousehold } from "@/lib/auth/current-household";
import type { HouseholdProfile } from "@/features/household/types";
import type { AiPlanningRequest } from "@/features/ai-planning/types";
import type {
  MealStrategy,
  MealStrategyInput
} from "@/features/meal-strategies/types";
import type { WeeklyMealPlan } from "@/features/meal-planning/types";
import { MealStrategyRepository } from "@/server/repositories/meal-strategy-repository";

const mealStrategyRepository = new MealStrategyRepository();

function listText(label: string, values: string[]) {
  return values.length > 0 ? `${label}: ${values.join(", ")}.` : null;
}

function numberText(label: string, value: number | null) {
  return value ? `${label}: ${value}.` : null;
}

function calorieText(strategy: MealStrategy) {
  if (strategy.calorieMin && strategy.calorieMax) {
    return `Target calories: ${strategy.calorieMin}-${strategy.calorieMax} per serving.`;
  }

  if (strategy.calorieMin) {
    return `Target calories: at least ${strategy.calorieMin} per serving.`;
  }

  if (strategy.calorieMax) {
    return `Target calories: no more than ${strategy.calorieMax} per serving.`;
  }

  return null;
}

export class MealStrategyService {
  listOrSeed(context: CurrentHousehold) {
    return mealStrategyRepository.listOrSeed(
      context.householdId,
      context.isDemo
    );
  }

  getById(context: CurrentHousehold, id: string) {
    return mealStrategyRepository.getById(
      context.householdId,
      context.isDemo,
      id
    );
  }

  create(context: CurrentHousehold, input: MealStrategyInput) {
    return mealStrategyRepository.create(context.householdId, context.isDemo, input);
  }

  update(context: CurrentHousehold, id: string, input: MealStrategyInput) {
    return mealStrategyRepository.update(
      context.householdId,
      context.isDemo,
      id,
      input
    );
  }

  deactivate(context: CurrentHousehold, id: string) {
    return mealStrategyRepository.deactivate(
      context.householdId,
      context.isDemo,
      id
    );
  }

  progressForWeek(strategies: MealStrategy[], plan: WeeklyMealPlan) {
    return strategies.map((strategy) => {
      const acceptedCount = plan.meals.filter(
        (meal) => meal.mealStrategyId === strategy.id
      ).length;

      return {
        strategy,
        acceptedCount,
        remainingCount: Math.max(0, strategy.weeklyTarget - acceptedCount)
      };
    });
  }

  buildPrompt(strategy: MealStrategy, profiles: HouseholdProfile[]) {
    const profileContext = profiles
      .map((profile) => {
        const pieces = [
          profile.likes.length > 0 ? `likes ${profile.likes.join(", ")}` : null,
          profile.dislikes.length > 0
            ? `dislikes ${profile.dislikes.join(", ")}`
            : null,
          profile.allergies.length > 0
            ? `allergies: ${profile.allergies.join(", ")}`
            : null,
          profile.dietaryPreferences.length > 0
            ? `dietary preferences: ${profile.dietaryPreferences.join(", ")}`
            : null,
          profile.favoriteCuisines.length > 0
            ? `favorite cuisines: ${profile.favoriteCuisines.join(", ")}`
            : null,
          profile.notes ? `notes: ${profile.notes}` : null
        ].filter(Boolean);

        return pieces.length > 0 ? `${profile.name}: ${pieces.join("; ")}.` : null;
      })
      .filter(Boolean)
      .join("\n");

    return [
      `Meal strategy: ${strategy.name}.`,
      strategy.prompt,
      "Treat the strategy guidance and structured fields as the weekly source of truth. Household taste profiles are constraints and inspiration, not instructions to reuse favorite cuisines or previous meal themes.",
      `Meal type: ${strategy.mealType}.`,
      `Create options that help fill ${strategy.weeklyTarget} meals for the week.`,
      calorieText(strategy),
      numberText("Protein goal in grams", strategy.proteinGoal),
      numberText("Maximum cooking time in minutes", strategy.maxCookTimeMinutes),
      listText("Preferred proteins", strategy.preferredProteins),
      listText("Preferred carb bases", strategy.preferredBaseCarbs),
      listText("Vegetables or sides to include", strategy.vegetables),
      listText("Avoid ingredients", strategy.avoidIngredients),
      profileContext ? `Household taste profiles:\n${profileContext}` : null,
      "Only use favorite cuisines when they support this strategy or the current prompt. Do not prioritize them over preferred proteins, carb bases, vegetables, avoid ingredients, calories, protein, or cook time.",
      "Return varied meals. Avoid near-duplicates. Keep portions, calories, protein estimates, ingredient quantities, and instructions internally consistent."
    ]
      .filter(Boolean)
      .join("\n");
  }

  buildAiRequest(input: {
    strategy: MealStrategy;
    profiles: HouseholdProfile[];
    weekStartDate: string;
    participantMemberIds: string[];
    generationSeed: string | null;
    numberOfMeals: number;
  }): AiPlanningRequest {
    return {
      prompt: this.buildPrompt(input.strategy, input.profiles),
      sourceTypes: input.strategy.sourceTypes,
      generationSeed: input.generationSeed,
      mealType: input.strategy.mealType,
      numberOfMeals: Math.min(7, Math.max(1, input.numberOfMeals)),
      weekStartDate: input.weekStartDate,
      participantMemberIds: input.participantMemberIds,
      servings: input.strategy.defaultServings,
      maxCookTimeMinutes: input.strategy.maxCookTimeMinutes,
      calorieTarget: null,
      calorieMin: input.strategy.calorieMin,
      calorieMax: input.strategy.calorieMax,
      proteinGoal: input.strategy.proteinGoal,
      preferredProteins: input.strategy.preferredProteins,
      preferredBaseCarbs: input.strategy.preferredBaseCarbs,
      vegetables: input.strategy.vegetables,
      avoidIngredients: input.strategy.avoidIngredients,
      useHouseholdPreferences: true,
      usePantryStaples: true,
      useSavedRecipes: false
    };
  }
}
