import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  MealPlanMealInput,
  MealType,
  WeeklyMealPlan
} from "@/features/meal-planning/types";

type DemoMealPlanRecord = {
  id: string;
  weekStartDate: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  notes: string | null;
  meals: Array<{
    id: string;
    recipeId: string;
    mealStrategyId?: string | null;
    mealType: MealType;
    plannedForDate: string | null;
    servings: number;
    notes: string | null;
    participantMemberIds: string[];
  }>;
};

type DemoRecipeSummary = {
  id: string;
  title: string;
  imageUrl: string | null;
};

const demoMealPlansPath = path.join(process.cwd(), "data", "demo-meal-plans.json");
const demoRecipesPath = path.join(process.cwd(), "data", "demo-recipes.json");
const demoHouseholdPath = path.join(process.cwd(), "data", "demo-household.json");

function toDateOnly(value: Date | string) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

async function readDemoPlans() {
  const raw = await readFile(demoMealPlansPath, "utf8");
  return JSON.parse(raw) as DemoMealPlanRecord[];
}

async function writeDemoPlans(plans: DemoMealPlanRecord[]) {
  await writeFile(demoMealPlansPath, `${JSON.stringify(plans, null, 2)}\n`);
}

async function readDemoRecipes() {
  const raw = await readFile(demoRecipesPath, "utf8");
  return JSON.parse(raw) as DemoRecipeSummary[];
}

async function readDemoProfileNames() {
  const raw = await readFile(demoHouseholdPath, "utf8");
  const household = JSON.parse(raw) as {
    profiles: Array<{ id: string; name: string }>;
  };

  return new Map(household.profiles.map((profile) => [profile.id, profile.name]));
}

async function hydrateDemoPlan(plan: DemoMealPlanRecord): Promise<WeeklyMealPlan> {
  const recipes = await readDemoRecipes();
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const memberMap = await readDemoProfileNames();

  return {
    ...plan,
    meals: plan.meals.map((meal) => {
      const recipe = recipeMap.get(meal.recipeId);

      return {
        ...meal,
        recipeTitle: recipe?.title ?? "Unknown recipe",
        recipeImageUrl: recipe?.imageUrl ?? null,
        participantNames: meal.participantMemberIds.map(
          (memberId) => memberMap.get(memberId) ?? "Unknown profile"
        )
      };
    })
  };
}

function emptyDemoPlan(weekStartDate: string): DemoMealPlanRecord {
  return {
    id: randomUUID(),
    weekStartDate,
    status: "DRAFT",
    notes: null,
    meals: []
  };
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export class MealPlanRepository {
  async getWeekStartForMeal(
    householdId: string,
    mealPlanMealId: string,
    isDemo: boolean
  ) {
    if (isDemo) {
      const plans = await readDemoPlans();
      const plan = plans.find((item) =>
        item.meals.some((meal) => meal.id === mealPlanMealId)
      );

      return plan?.weekStartDate ?? null;
    }

    const meal = await prisma.mealPlanMeal.findFirst({
      where: {
        id: mealPlanMealId,
        mealPlan: {
          householdId
        }
      },
      include: {
        mealPlan: true
      }
    });

    return meal ? toDateOnly(meal.mealPlan.weekStartDate) : null;
  }

  async getOrCreateWeeklyPlan(
    householdId: string,
    weekStartDate: string,
    isDemo: boolean
  ): Promise<WeeklyMealPlan> {
    if (isDemo) {
      const plans = await readDemoPlans();
      let plan = plans.find((item) => item.weekStartDate === weekStartDate);

      if (!plan) {
        plan = emptyDemoPlan(weekStartDate);
        plans.push(plan);
        await writeDemoPlans(plans);
      }

      return hydrateDemoPlan(plan);
    }

    const weekStart = new Date(`${weekStartDate}T00:00:00.000Z`);
    const plan = await prisma.mealPlan
      .upsert({
        where: {
          householdId_weekStartDate: {
            householdId,
            weekStartDate: weekStart
          }
        },
        update: {},
        create: {
          householdId,
          weekStartDate: weekStart
        },
        include: {
          meals: {
            include: {
              recipe: true,
              participants: {
                include: {
                  householdMember: true
                }
              }
            },
            orderBy: [{ plannedForDate: "asc" }, { createdAt: "asc" }]
          }
        }
      })
      .catch(async (error: unknown) => {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }

        return prisma.mealPlan.findUniqueOrThrow({
          where: {
            householdId_weekStartDate: {
              householdId,
              weekStartDate: weekStart
            }
          },
          include: {
            meals: {
              include: {
                recipe: true,
                participants: {
                  include: {
                    householdMember: true
                  }
                }
              },
              orderBy: [{ plannedForDate: "asc" }, { createdAt: "asc" }]
            }
          }
        });
      });

    return {
      id: plan.id,
      weekStartDate: toDateOnly(plan.weekStartDate),
      status: plan.status,
      notes: plan.notes,
      meals: plan.meals.map((meal) => ({
        id: meal.id,
        recipeId: meal.recipeId,
        mealStrategyId: meal.mealStrategyId ?? null,
        recipeTitle: meal.recipe.title,
        recipeImageUrl: meal.recipe.imageUrl,
        mealType: meal.mealType,
        plannedForDate: meal.plannedForDate
          ? toDateOnly(meal.plannedForDate)
          : null,
        servings: meal.servings,
        notes: meal.notes,
        participantMemberIds: meal.participants.map(
          (participant) => participant.householdMemberId
        ),
        participantNames: meal.participants.map(
          (participant) => participant.householdMember.name
        )
      }))
    };
  }

  async addMeal(
    householdId: string,
    input: MealPlanMealInput & { weekStartDate: string },
    isDemo: boolean
  ) {
    if (isDemo) {
      const plans = await readDemoPlans();
      let plan = plans.find((item) => item.weekStartDate === input.weekStartDate);

      if (!plan) {
        plan = emptyDemoPlan(input.weekStartDate);
        plans.push(plan);
      }

      const mealId = randomUUID();

      plan.meals.push({
        id: mealId,
        recipeId: input.recipeId,
        mealStrategyId: input.mealStrategyId ?? null,
        mealType: input.mealType,
        plannedForDate: input.plannedForDate,
        servings: input.servings,
        notes: input.notes ?? null,
        participantMemberIds: input.participantMemberIds
      });

      await writeDemoPlans(plans);
      return mealId;
    }

    const plan = await prisma.mealPlan.upsert({
      where: {
        householdId_weekStartDate: {
          householdId,
          weekStartDate: new Date(`${input.weekStartDate}T00:00:00.000Z`)
        }
      },
      update: {},
      create: {
        householdId,
        weekStartDate: new Date(`${input.weekStartDate}T00:00:00.000Z`)
      }
    });

    const meal = await prisma.mealPlanMeal.create({
      data: {
        mealPlanId: plan.id,
        recipeId: input.recipeId,
        mealStrategyId: input.mealStrategyId ?? null,
        mealType: input.mealType,
        plannedForDate: input.plannedForDate
          ? new Date(`${input.plannedForDate}T00:00:00.000Z`)
          : null,
        servings: input.servings,
        notes: input.notes,
        participants: {
          create: input.participantMemberIds.map((householdMemberId) => ({
            householdMemberId
          }))
        }
      }
    });

    return meal.id;
  }

  async moveMeal(
    householdId: string,
    mealPlanMealId: string,
    plannedForDate: string,
    isDemo: boolean
  ) {
    if (isDemo) {
      const plans = await readDemoPlans();
      const meal = plans.flatMap((plan) => plan.meals).find(
        (item) => item.id === mealPlanMealId
      );

      if (meal) {
        meal.plannedForDate = plannedForDate;
        await writeDemoPlans(plans);
      }

      return;
    }

    await prisma.mealPlanMeal.updateMany({
      where: {
        id: mealPlanMealId,
        mealPlan: {
          householdId
        }
      },
      data: {
        plannedForDate: new Date(`${plannedForDate}T00:00:00.000Z`)
      }
    });
  }

  async removeMeal(householdId: string, mealPlanMealId: string, isDemo: boolean) {
    if (isDemo) {
      const plans = await readDemoPlans();

      for (const plan of plans) {
        plan.meals = plan.meals.filter((meal) => meal.id !== mealPlanMealId);
      }

      await writeDemoPlans(plans);
      return;
    }

    await prisma.mealPlanMeal.deleteMany({
      where: {
        id: mealPlanMealId,
        mealPlan: {
          householdId
        }
      }
    });
  }
}
