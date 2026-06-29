import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  GroceryListItemView,
  GroceryListView,
  ManualGroceryItemInput
} from "@/features/grocery-lists/types";
import { generateGroceryItems } from "@/features/grocery-lists/grocery-generation";
import { BasicGroceryNormalizer } from "@/server/grocery-normalization/basic-grocery-normalizer";

type DemoRecipeRecord = {
  id: string;
  title: string;
  servings: number;
  ingredients: Array<{
    displayText: string;
    name: string;
    quantity: number | null;
    unit: string | null;
  }>;
};

type DemoMealPlanRecord = {
  id: string;
  weekStartDate: string;
  meals: Array<{
    id: string;
    recipeId: string;
    mealType?: string;
    plannedForDate?: string;
    servings: number;
  }>;
};

type DemoGroceryListRecord = {
  id: string;
  name: string;
  weekStartDate: string;
  mealPlanId: string | null;
  items: Array<GroceryListItemView>;
};

const demoRecipesPath = path.join(process.cwd(), "data", "demo-recipes.json");
const demoMealPlansPath = path.join(process.cwd(), "data", "demo-meal-plans.json");
const demoGroceryListsPath = path.join(
  process.cwd(),
  "data",
  "demo-grocery-lists.json"
);

const normalizer = new BasicGroceryNormalizer();

async function readDemoRecipes() {
  const raw = await readFile(demoRecipesPath, "utf8");
  return JSON.parse(raw) as DemoRecipeRecord[];
}

async function readDemoMealPlans() {
  const raw = await readFile(demoMealPlansPath, "utf8");
  return JSON.parse(raw) as DemoMealPlanRecord[];
}

async function readDemoGroceryLists() {
  const raw = await readFile(demoGroceryListsPath, "utf8");
  return JSON.parse(raw) as DemoGroceryListRecord[];
}

async function writeDemoGroceryLists(lists: DemoGroceryListRecord[]) {
  await writeFile(demoGroceryListsPath, `${JSON.stringify(lists, null, 2)}\n`);
}

function emptyList(weekStartDate: string, mealPlanId: string | null) {
  return {
    id: randomUUID(),
    name: `Groceries for ${weekStartDate}`,
    weekStartDate,
    mealPlanId,
    items: []
  };
}

function normalizeItemView(item: GroceryListItemView): GroceryListItemView {
  return {
    ...item,
    sourceRecipeNames: item.sourceRecipeNames ?? [],
    sourceSummary: item.sourceSummary ?? null
  };
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function getDemoList(weekStartDate: string) {
  const lists = await readDemoGroceryLists();
  const mealPlans = await readDemoMealPlans();
  const mealPlanId =
    mealPlans.find((mealPlan) => mealPlan.weekStartDate === weekStartDate)?.id ??
    null;
  let list = lists.find((item) => item.weekStartDate === weekStartDate);

  if (!list) {
    list = emptyList(weekStartDate, mealPlanId);
    lists.push(list);
    await writeDemoGroceryLists(lists);
  }

  return { list, lists };
}

function toView(record: DemoGroceryListRecord): GroceryListView {
  return {
    ...record,
    items: record.items.map(normalizeItemView).sort((first, second) => {
      if (first.checked !== second.checked) {
        return first.checked ? 1 : -1;
      }

      const categoryCompare = (first.category ?? "").localeCompare(
        second.category ?? ""
      );

      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      return first.name.localeCompare(second.name);
    })
  };
}

export class GroceryListRepository {
  async getOrCreateForWeek(
    householdId: string,
    weekStartDate: string,
    isDemo: boolean
  ): Promise<GroceryListView> {
    if (isDemo) {
      const { list } = await getDemoList(weekStartDate);
      return toView(list);
    }

    const weekStart = new Date(`${weekStartDate}T00:00:00.000Z`);
    const mealPlan = await prisma.mealPlan
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
          }
        });
      });
    const groceryList = await prisma.groceryList.upsert({
      where: { mealPlanId: mealPlan.id },
      update: {},
      create: {
        householdId,
        mealPlanId: mealPlan.id,
        name: `Groceries for ${weekStartDate}`
      },
      include: { items: true }
    });

    return {
      id: groceryList.id,
      name: groceryList.name,
      weekStartDate,
      mealPlanId: groceryList.mealPlanId,
      items: groceryList.items
        .map((item) => ({
          id: item.id,
          name: item.name,
          normalizedName: item.normalizedName,
          quantity: item.quantity == null ? null : Number(item.quantity),
          unit: item.unit,
          category: item.category,
          checked: item.checked,
          source: item.source,
          sourceRecipeNames: item.sourceRecipeNames,
          sourceSummary: item.sourceSummary
        }))
        .sort((first, second) => first.name.localeCompare(second.name))
    };
  }

  async regenerateForWeek(
    householdId: string,
    weekStartDate: string,
    isDemo: boolean
  ): Promise<GroceryListView> {
    if (isDemo) {
      const { list, lists } = await getDemoList(weekStartDate);
      const recipes = await readDemoRecipes();
      const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));
      const mealPlans = await readDemoMealPlans();
      const mealPlan = mealPlans.find(
        (plan) => plan.weekStartDate === weekStartDate
      );
      const ingredients =
        mealPlan?.meals.flatMap((meal) => {
          const recipe = recipeMap.get(meal.recipeId);

          if (!recipe) {
            return [];
          }

          return recipe.ingredients.map((ingredient) => ({
            name: ingredient.name,
            displayText: ingredient.displayText,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            recipeServings: recipe.servings,
            plannedServings: meal.servings,
            recipeTitle: recipe.title,
            mealId: meal.id,
            mealType: meal.mealType ?? null,
            plannedForDate: meal.plannedForDate ?? null
          }));
        }) ?? [];
      list.items = generateGroceryItems({
        ingredients,
        existingItems: list.items.map((item) => ({
          ...item,
          sourceRecipeNames: item.sourceRecipeNames ?? [],
          sourceSummary: item.sourceSummary ?? null
        })),
        idFactory: randomUUID
      });
      await writeDemoGroceryLists(lists);

      return toView(list);
    }

    const weekStart = new Date(`${weekStartDate}T00:00:00.000Z`);
    const mealPlan = await prisma.mealPlan
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
              recipe: {
                include: {
                  ingredients: true
                }
              }
            }
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
                recipe: {
                  include: {
                    ingredients: true
                  }
                }
              }
            }
          }
        });
      });
    const groceryList = await prisma.groceryList.upsert({
      where: { mealPlanId: mealPlan.id },
      update: {},
      create: {
        householdId,
        mealPlanId: mealPlan.id,
        name: `Groceries for ${weekStartDate}`
      },
      include: { items: true }
    });
    const existingGenerated = groceryList.items
      .filter((item) => item.source === "GENERATED")
      .map((item) => ({
        id: item.id,
        name: item.name,
        normalizedName: item.normalizedName,
        quantity: item.quantity == null ? null : Number(item.quantity),
        unit: item.unit,
        category: item.category,
        checked: item.checked,
        source: item.source,
        sourceRecipeNames: item.sourceRecipeNames,
        sourceSummary: item.sourceSummary
      }));
    const ingredients = mealPlan.meals.flatMap((meal) =>
      meal.recipe.ingredients.map((ingredient) => ({
        name: ingredient.name,
        displayText: ingredient.displayText,
        quantity: ingredient.quantity == null ? null : Number(ingredient.quantity),
        unit: ingredient.unit,
        recipeServings: meal.recipe.servings,
        plannedServings: meal.servings,
        recipeTitle: meal.recipe.title,
        mealId: meal.id,
        mealType: meal.mealType,
        plannedForDate: meal.plannedForDate
          ? meal.plannedForDate.toISOString().slice(0, 10)
          : null
      }))
    );
    const manualItems = groceryList.items
      .filter((item) => item.source === "MANUAL")
      .map((item) => ({
        id: item.id,
        name: item.name,
        normalizedName: item.normalizedName,
        quantity: item.quantity == null ? null : Number(item.quantity),
        unit: item.unit,
        category: item.category,
        checked: item.checked,
        source: item.source,
        sourceRecipeNames: item.sourceRecipeNames,
        sourceSummary: item.sourceSummary
      }));
    const generatedItems = generateGroceryItems({
      ingredients,
      existingItems: [...existingGenerated, ...manualItems],
      idFactory: randomUUID
    }).filter((item) => item.source === "GENERATED");

    await prisma.$transaction([
      prisma.groceryListItem.deleteMany({
        where: {
          groceryListId: groceryList.id,
          source: "GENERATED"
        }
      }),
      ...(generatedItems.length > 0
        ? [
            prisma.groceryListItem.createMany({
              data: generatedItems.map((item) => ({
                groceryListId: groceryList.id,
                name: item.name,
                normalizedName: item.normalizedName,
                quantity:
                  item.quantity == null ? undefined : new Prisma.Decimal(item.quantity),
                unit: item.unit,
                category: item.category,
                checked: item.checked,
                source: "GENERATED",
                sourceRecipeNames: item.sourceRecipeNames,
                sourceSummary: item.sourceSummary
              }))
            })
          ]
        : [])
    ]);

    return this.getOrCreateForWeek(householdId, weekStartDate, isDemo);
  }

  async addManualItem(
    householdId: string,
    input: ManualGroceryItemInput,
    isDemo: boolean
  ) {
    const normalized = normalizer.normalize({ name: input.name });

    if (isDemo) {
      const { list, lists } = await getDemoList(input.weekStartDate);
      list.items.push({
        id: randomUUID(),
        name: input.name,
        normalizedName: normalized.normalizedName,
        quantity: input.quantity ?? null,
        unit: input.unit ?? null,
        category: input.category ?? normalized.category ?? "Other",
        checked: false,
        source: "MANUAL",
        sourceRecipeNames: [],
        sourceSummary: null
      });
      await writeDemoGroceryLists(lists);
      return;
    }

    const list = await this.getOrCreateForWeek(
      householdId,
      input.weekStartDate,
      isDemo
    );

    await prisma.groceryListItem.create({
      data: {
        groceryListId: list.id,
        name: input.name,
        normalizedName: normalized.normalizedName,
        quantity:
          input.quantity == null ? undefined : new Prisma.Decimal(input.quantity),
        unit: input.unit,
        category: input.category ?? normalized.category ?? "Other",
        checked: false,
        source: "MANUAL",
        sourceRecipeNames: [],
        sourceSummary: null
      }
    });
  }

  async setItemChecked(
    householdId: string,
    groceryItemId: string,
    checked: boolean,
    isDemo: boolean
  ) {
    if (isDemo) {
      const lists = await readDemoGroceryLists();
      const item = lists.flatMap((list) => list.items).find(
        (candidate) => candidate.id === groceryItemId
      );

      if (item) {
        item.checked = checked;
        await writeDemoGroceryLists(lists);
      }

      return;
    }

    await prisma.groceryListItem.updateMany({
      where: {
        id: groceryItemId,
        groceryList: {
          householdId
        }
      },
      data: { checked }
    });
  }
}
