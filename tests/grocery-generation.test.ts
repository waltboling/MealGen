import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateGroceryItems } from "../src/features/grocery-lists/grocery-generation.ts";
import type { GroceryListItemView } from "../src/features/grocery-lists/types.ts";

function generatedItem(overrides: Partial<GroceryListItemView>): GroceryListItemView {
  return {
    id: "existing-generated",
    name: "Olive Oil",
    normalizedName: "olive oil",
    quantity: 2,
    unit: "tbsp",
    category: "Pantry",
    checked: false,
    source: "GENERATED",
    sourceRecipeNames: [],
    sourceSummary: null,
    ...overrides
  };
}

function ids() {
  let id = 0;
  return () => `generated-${++id}`;
}

describe("grocery generation", () => {
  it("merges duplicate ingredients after scaling servings", () => {
    const items = generateGroceryItems({
      idFactory: ids(),
      existingItems: [],
      ingredients: [
        {
          name: "olive oil",
          quantity: 2,
          unit: "tbsp",
          recipeServings: 4,
          plannedServings: 8,
          recipeTitle: "Pasta",
          mealId: "meal-1"
        },
        {
          name: "olive oil",
          quantity: 1,
          unit: "tbsp",
          recipeServings: 2,
          plannedServings: 2,
          recipeTitle: "Chicken",
          mealId: "meal-2"
        }
      ]
    });

    const oil = items.find((item) => item.normalizedName === "olive oil");

    assert.ok(oil);
    assert.equal(oil.quantity, 5);
    assert.equal(oil.unit, "tbsp");
    assert.deepEqual(oil.sourceRecipeNames.sort(), ["Chicken", "Pasta"]);
  });

  it("converts common volume units before merging", () => {
    const items = generateGroceryItems({
      idFactory: ids(),
      existingItems: [],
      ingredients: [
        {
          name: "lime juice",
          quantity: 1,
          unit: "tbsp",
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Tacos",
          mealId: "meal-1"
        },
        {
          name: "lime juice",
          quantity: 3,
          unit: "tsp",
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Rice",
          mealId: "meal-2"
        }
      ]
    });

    const juice = items.find((item) => item.normalizedName === "lime");

    assert.ok(juice);
    assert.equal(juice.quantity, 2);
    assert.equal(juice.unit, "tbsp");
  });

  it("converts common weight units before merging", () => {
    const items = generateGroceryItems({
      idFactory: ids(),
      existingItems: [],
      ingredients: [
        {
          name: "chicken",
          quantity: 8,
          unit: "oz",
          recipeServings: 2,
          plannedServings: 2,
          recipeTitle: "Bowls",
          mealId: "meal-1"
        },
        {
          name: "chicken",
          quantity: 1,
          unit: "lb",
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Soup",
          mealId: "meal-2"
        }
      ]
    });

    const chicken = items.find((item) => item.normalizedName === "chicken");

    assert.ok(chicken);
    assert.equal(chicken.quantity, 1.5);
    assert.equal(chicken.unit, "lb");
  });

  it("keeps uncertain units separate to avoid bad merges", () => {
    const items = generateGroceryItems({
      idFactory: ids(),
      existingItems: [],
      ingredients: [
        {
          name: "basil",
          quantity: 1,
          unit: "bunch",
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Pasta",
          mealId: "meal-1"
        },
        {
          name: "basil",
          quantity: 1,
          unit: "cup",
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Pesto",
          mealId: "meal-2"
        }
      ]
    });

    assert.equal(items.filter((item) => item.normalizedName === "basil").length, 2);
  });

  it("handles quantity-less ingredients without inventing a quantity", () => {
    const items = generateGroceryItems({
      idFactory: ids(),
      existingItems: [],
      ingredients: [
        {
          name: "salt",
          quantity: null,
          unit: null,
          recipeServings: 4,
          plannedServings: 8,
          recipeTitle: "Soup",
          mealId: "meal-1"
        }
      ]
    });

    const salt = items.find((item) => item.normalizedName === "salt");

    assert.ok(salt);
    assert.equal(salt.quantity, null);
    assert.equal(salt.unit, null);
  });

  it("includes meals that are added to the week without a day assignment", () => {
    const items = generateGroceryItems({
      idFactory: ids(),
      existingItems: [],
      ingredients: [
        {
          name: "chicken breast",
          quantity: 1,
          unit: "lb",
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Flexible Chicken Bowls",
          mealId: "meal-without-day",
          plannedForDate: null
        }
      ]
    });

    const chicken = items.find(
      (item) => item.normalizedName === "chicken breast"
    );

    assert.ok(chicken);
    assert.equal(chicken.quantity, 1);
    assert.equal(chicken.unit, "lb");
    assert.deepEqual(chicken.sourceRecipeNames, ["Flexible Chicken Bowls"]);
  });

  it("uses one meat category for chicken synonyms", () => {
    const items = generateGroceryItems({
      idFactory: ids(),
      existingItems: [],
      ingredients: [
        {
          name: "boneless chicken thighs",
          quantity: 1,
          unit: "lb",
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Chicken Dinner",
          mealId: "meal-1"
        }
      ]
    });

    const chicken = items.find((item) => item.normalizedName === "chicken thighs");

    assert.ok(chicken);
    assert.equal(chicken.category, "Meat & Seafood");
  });

  it("translates recipe prep language into grocery items", () => {
    const items = generateGroceryItems({
      idFactory: ids(),
      existingItems: [],
      ingredients: [
        {
          name: "brussels sprouts, halved",
          quantity: 1,
          unit: "lb",
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Sheet Pan Dinner",
          mealId: "meal-1"
        },
        {
          name: "juice of 1 large lemon",
          quantity: null,
          unit: null,
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Sheet Pan Dinner",
          mealId: "meal-1"
        },
        {
          name: "garlic, minced",
          quantity: 2,
          unit: "clove",
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Sheet Pan Dinner",
          mealId: "meal-1"
        },
        {
          name: "roasted red and yellow bell peppers",
          quantity: 2,
          unit: null,
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Sheet Pan Dinner",
          mealId: "meal-1"
        }
      ]
    });

    assert.ok(items.find((item) => item.normalizedName === "brussels sprouts"));
    assert.ok(items.find((item) => item.normalizedName === "lemon"));
    assert.ok(items.find((item) => item.normalizedName === "garlic"));
    assert.ok(items.find((item) => item.normalizedName === "bell pepper"));
    assert.equal(
      items.find((item) => item.normalizedName === "brussels sprouts")?.name,
      "Brussels Sprouts"
    );
  });

  it("preserves manual items during regeneration", () => {
    const manual = generatedItem({
      id: "manual-1",
      name: "Paper towels",
      normalizedName: "paper towels",
      quantity: 1,
      unit: "pack",
      category: "Household",
      checked: false,
      source: "MANUAL"
    });

    const items = generateGroceryItems({
      idFactory: ids(),
      existingItems: [manual],
      ingredients: []
    });

    assert.deepEqual(items, [manual]);
  });

  it("preserves checked state for regenerated matching generated items", () => {
    const items = generateGroceryItems({
      idFactory: ids(),
      existingItems: [
        generatedItem({
          checked: true,
          quantity: 2,
          unit: "tbsp"
        })
      ],
      ingredients: [
        {
          name: "olive oil",
          quantity: 2,
          unit: "tbsp",
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Pasta",
          mealId: "meal-1"
        }
      ]
    });

    const oil = items.find((item) => item.normalizedName === "olive oil");

    assert.ok(oil);
    assert.equal(oil.checked, true);
  });

  it("reflects meal plan changes on regeneration", () => {
    const firstRun = generateGroceryItems({
      idFactory: ids(),
      existingItems: [],
      ingredients: [
        {
          name: "rice",
          quantity: 1,
          unit: "cup",
          recipeServings: 4,
          plannedServings: 4,
          recipeTitle: "Bowls",
          mealId: "meal-1"
        }
      ]
    });

    const secondRun = generateGroceryItems({
      idFactory: ids(),
      existingItems: firstRun,
      ingredients: [
        {
          name: "rice",
          quantity: 1,
          unit: "cup",
          recipeServings: 4,
          plannedServings: 8,
          recipeTitle: "Bowls",
          mealId: "meal-1"
        }
      ]
    });

    const rice = secondRun.find((item) => item.normalizedName === "rice");

    assert.ok(rice);
    assert.equal(rice.quantity, 2);
    assert.equal(rice.unit, "cup");
  });
});
