import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import type {
  MealStrategy,
  MealStrategyInput,
  MealStrategySourceType
} from "@/features/meal-strategies/types";

const demoMealStrategiesPath = path.join(
  process.cwd(),
  "data",
  "demo-meal-strategies.json"
);

const defaultStrategies: MealStrategyInput[] = [
  {
    name: "Breakfasts",
    mealType: "BREAKFAST",
    weeklyTarget: 5,
    defaultServings: 4,
    prompt:
      "Generate practical breakfasts for the week. Favor balanced meals with protein, fiber, and enough variety that the week does not feel repetitive.",
    maxCookTimeMinutes: 25,
    calorieMin: null,
    calorieMax: null,
    proteinGoal: 25,
    preferredProteins: ["eggs", "greek yogurt", "turkey sausage", "cottage cheese"],
    preferredBaseCarbs: ["oats", "whole grain toast", "potatoes", "fruit"],
    vegetables: ["spinach", "peppers", "tomatoes"],
    avoidIngredients: [],
    sourceTypes: ["ai_generated"]
  },
  {
    name: "Lunches",
    mealType: "LUNCH",
    weeklyTarget: 5,
    defaultServings: 2,
    prompt:
      "Generate weekday lunches that are 500-700 calories, protein-focused, include a healthy carb base, a preferred protein, and a vegetable side. Keep them interesting and practical for meal prep.",
    maxCookTimeMinutes: 40,
    calorieMin: 500,
    calorieMax: 700,
    proteinGoal: 35,
    preferredProteins: ["chicken", "beef", "pork", "salmon"],
    preferredBaseCarbs: ["rice", "quinoa", "potatoes", "couscous"],
    vegetables: ["broccoli", "peppers", "cauliflower", "spinach", "green beans"],
    avoidIngredients: [],
    sourceTypes: ["ai_generated"]
  },
  {
    name: "Dinners",
    mealType: "DINNER",
    weeklyTarget: 5,
    defaultServings: 4,
    prompt:
      "Generate reliable weekday dinners with balanced protein, vegetables, and satisfying carbs. Favor meals that feel fresh but are realistic after work.",
    maxCookTimeMinutes: 45,
    calorieMin: null,
    calorieMax: null,
    proteinGoal: 35,
    preferredProteins: ["chicken", "beef", "pork", "fish"],
    preferredBaseCarbs: ["rice", "pasta", "potatoes", "quinoa"],
    vegetables: ["broccoli", "salads", "roasted vegetables", "green beans"],
    avoidIngredients: [],
    sourceTypes: ["ai_generated"]
  }
];

const legacyDefaultNames = new Set(["Weekday Lunches", "Weekday Dinners"]);

async function readDemoStrategies() {
  try {
    const raw = await readFile(demoMealStrategiesPath, "utf8");
    return JSON.parse(raw) as MealStrategy[];
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeDemoStrategies(strategies: MealStrategy[]) {
  await writeFile(
    demoMealStrategiesPath,
    `${JSON.stringify(strategies, null, 2)}\n`
  );
}

function createDefaultStrategy(input: MealStrategyInput): MealStrategy {
  return {
    id: randomUUID(),
    ...input,
    active: true
  };
}

function shouldReplaceLegacyDefaults(strategies: MealStrategy[]) {
  const activeStrategies = strategies.filter((strategy) => strategy.active);

  return (
    activeStrategies.length > 0 &&
    activeStrategies.length <= 2 &&
    activeStrategies.every((strategy) => legacyDefaultNames.has(strategy.name))
  );
}

function mapSourceTypes(values: string[]): MealStrategySourceType[] {
  const allowed = new Set(["ai_generated", "recipe_catalog"]);
  const sourceTypes = values.filter((value): value is MealStrategySourceType =>
    allowed.has(value)
  );

  return sourceTypes.length > 0 ? sourceTypes : ["ai_generated"];
}

function mapStrategy(strategy: {
  id: string;
  name: string;
  mealType: MealStrategy["mealType"];
  weeklyTarget: number;
  defaultServings: number;
  prompt: string;
  maxCookTimeMinutes: number | null;
  calorieMin: number | null;
  calorieMax: number | null;
  proteinGoal: number | null;
  preferredProteins: string[];
  preferredBaseCarbs: string[];
  vegetables: string[];
  avoidIngredients: string[];
  sourceTypes: string[];
  active: boolean;
}): MealStrategy {
  return {
    ...strategy,
    sourceTypes: mapSourceTypes(strategy.sourceTypes)
  };
}

export class MealStrategyRepository {
  async listOrSeed(householdId: string, isDemo: boolean) {
    if (isDemo) {
      let strategies = await readDemoStrategies();

      if (strategies.length === 0 || shouldReplaceLegacyDefaults(strategies)) {
        strategies = defaultStrategies.map(createDefaultStrategy);
        await writeDemoStrategies(strategies);
      }

      return strategies.filter((strategy) => strategy.active);
    }

    const activeStrategies = await prisma.mealStrategy.findMany({
      where: { householdId, active: true },
      orderBy: { createdAt: "asc" }
    });

    if (
      activeStrategies.length > 0 &&
      activeStrategies.length <= 2 &&
      activeStrategies.every((strategy) => legacyDefaultNames.has(strategy.name))
    ) {
      await prisma.$transaction([
        prisma.mealStrategy.updateMany({
          where: { householdId, active: true },
          data: { active: false }
        }),
        prisma.mealStrategy.createMany({
          data: defaultStrategies.map((strategy) => ({
            householdId,
            ...strategy
          }))
        })
      ]);
    }

    const count = await prisma.mealStrategy.count({
      where: { householdId }
    });

    if (count === 0) {
      await prisma.mealStrategy.createMany({
        data: defaultStrategies.map((strategy) => ({
          householdId,
          ...strategy
        }))
      });
    }

    const strategies = await prisma.mealStrategy.findMany({
      where: { householdId, active: true },
      orderBy: { createdAt: "asc" }
    });

    return strategies.map(mapStrategy);
  }

  async getById(householdId: string, isDemo: boolean, id: string) {
    if (isDemo) {
      const strategies = await this.listOrSeed(householdId, isDemo);
      return strategies.find((strategy) => strategy.id === id) ?? null;
    }

    const strategy = await prisma.mealStrategy.findFirst({
      where: { householdId, id, active: true }
    });

    return strategy ? mapStrategy(strategy) : null;
  }

  async create(householdId: string, isDemo: boolean, input: MealStrategyInput) {
    if (isDemo) {
      const strategies = await readDemoStrategies();
      strategies.push(createDefaultStrategy({ ...input, active: true }));
      await writeDemoStrategies(strategies);
      return;
    }

    await prisma.mealStrategy.create({
      data: {
        householdId,
        ...input,
        active: true
      }
    });
  }

  async update(
    householdId: string,
    isDemo: boolean,
    id: string,
    input: MealStrategyInput
  ) {
    if (isDemo) {
      const strategies = await readDemoStrategies();
      const index = strategies.findIndex((item) => item.id === id);

      if (index >= 0) {
        strategies[index] = {
          ...strategies[index],
          ...input,
          id,
          active: strategies[index].active
        };
        await writeDemoStrategies(strategies);
      }

      return;
    }

    await prisma.mealStrategy.updateMany({
      where: { householdId, id },
      data: input
    });
  }

  async deactivate(householdId: string, isDemo: boolean, id: string) {
    if (isDemo) {
      const strategies = await readDemoStrategies();
      const strategy = strategies.find((item) => item.id === id);

      if (strategy) {
        strategy.active = false;
        await writeDemoStrategies(strategies);
      }

      return;
    }

    await prisma.mealStrategy.updateMany({
      where: { householdId, id },
      data: { active: false }
    });
  }
}
