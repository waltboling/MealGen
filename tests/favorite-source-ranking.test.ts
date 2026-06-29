import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FavoriteSource } from "../src/features/favorite-sources/types.ts";
import { rankRecipeSearchResults } from "../src/server/recipe-ranking/favorite-source-ranking.ts";

const baseResult = {
  providerId: "demo",
  imageUrl: null,
  sourceUrl: null,
  authorName: null,
  prepMinutes: 10,
  cookMinutes: 20,
  servings: 4,
  cuisines: [],
  diets: [],
  tags: [],
  providerName: "Demo Recipes"
};

const favoriteSources: FavoriteSource[] = [
  {
    id: "70000000-0000-4000-8000-000000000001",
    type: "WEBSITE",
    name: "Demo Kitchen",
    url: "https://example.com",
    rankingBoost: 30,
    notes: null
  },
  {
    id: "70000000-0000-4000-8000-000000000002",
    type: "CREATOR",
    name: "Nico Rivera",
    url: null,
    rankingBoost: 15,
    notes: null
  }
];

describe("favorite source ranking", () => {
  it("boosts and annotates results matching a favorite domain", () => {
    const ranked = rankRecipeSearchResults(
      [
        {
          ...baseResult,
          externalId: "plain",
          title: "Plain Pasta",
          sourceName: "Other Site",
          sourceUrl: "https://other.example/recipe"
        },
        {
          ...baseResult,
          externalId: "favorite",
          title: "Favorite Tacos",
          sourceName: "Demo Kitchen",
          sourceUrl: "https://example.com/recipes/tacos"
        }
      ],
      favoriteSources
    );

    assert.equal(ranked[0].externalId, "favorite");
    assert.equal(ranked[0].favoriteSource?.name, "Demo Kitchen");
  });

  it("can match creator names when provider source URLs are unavailable", () => {
    const ranked = rankRecipeSearchResults(
      [
        {
          ...baseResult,
          externalId: "creator",
          title: "Creator Pasta",
          sourceName: "Other Site",
          authorName: "Nico Rivera"
        }
      ],
      favoriteSources
    );

    assert.equal(ranked[0].favoriteSource?.name, "Nico Rivera");
    assert.equal(ranked[0].favoriteSource?.rankingBoost, 15);
  });
});
