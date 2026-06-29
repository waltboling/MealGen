import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MockRecipeProvider } from "../src/server/recipe-providers/mock-provider.ts";
import { SpoonacularRecipeProvider } from "../src/server/recipe-providers/spoonacular-provider.ts";

describe("mock recipe provider", () => {
  it("searches by keyword and preserves provider attribution", async () => {
    const provider = new MockRecipeProvider();
    const results = await provider.search({ query: "salmon" });

    assert.equal(results.length, 1);
    assert.equal(results[0].providerId, "demo");
    assert.equal(results[0].sourceName, "Demo Kitchen");
    assert.equal(results[0].sourceUrl?.startsWith("https://example.com"), true);
  });

  it("filters by cuisine, diet, time, and serving count", async () => {
    const provider = new MockRecipeProvider();
    const results = await provider.search({
      cuisines: ["Mexican"],
      diets: ["Vegetarian"],
      maxCookTimeMinutes: 30,
      servings: 4
    });

    assert.equal(results.length, 1);
    assert.equal(results[0].externalId, "black-bean-tacos");
  });

  it("loads import details with structured ingredients and instructions", async () => {
    const provider = new MockRecipeProvider();
    const recipe = await provider.getRecipe({ externalId: "black-bean-tacos" });

    assert.equal(recipe.title, "Smoky Black Bean Tacos");
    assert.ok(recipe.ingredients.length > 0);
    assert.ok(recipe.instructions.length > 0);
    assert.equal(recipe.ingredients[0].displayText.length > 0, true);
  });
});

describe("spoonacular recipe provider", () => {
  it("requires an API key before making requests", async () => {
    const previousKey = process.env.SPOONACULAR_API_KEY;
    delete process.env.SPOONACULAR_API_KEY;

    await assert.rejects(
      () => new SpoonacularRecipeProvider().search({ query: "tacos" }),
      /SPOONACULAR_API_KEY/
    );

    if (previousKey) {
      process.env.SPOONACULAR_API_KEY = previousKey;
    } else {
      delete process.env.SPOONACULAR_API_KEY;
    }
  });
});
