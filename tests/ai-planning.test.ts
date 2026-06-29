import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aiPlanningRequestSchema } from "../src/features/ai-planning/schemas.ts";
import { MockAiPlanningProvider } from "../src/server/ai-planning/mock-provider.ts";
import { extractOpenAiOutputText } from "../src/server/ai-planning/openai-provider.ts";
import type { HouseholdProfile } from "../src/features/household/types.ts";

const profiles: HouseholdProfile[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    name: "Jon",
    active: true,
    linkedUserId: "00000000-0000-4000-8000-000000000002",
    profileType: "USER_LINKED",
    temporary: false,
    activeFrom: null,
    activeUntil: null,
    color: null,
    initials: "JB",
    avatarUrl: null,
    preferredSpiceLevel: 3,
    likes: ["broccoli", "peppers"],
    dislikes: ["raw onion"],
    allergies: ["tree nuts"],
    dietaryPreferences: [],
    favoriteCuisines: ["Mexican"],
    notes: null
  }
];

describe("AI planning request validation", () => {
  it("parses optional structured controls around a primary prompt", () => {
    const parsed = aiPlanningRequestSchema.parse({
      prompt: "Plan healthy high protein lunches for the week",
      mealType: "LUNCH",
      numberOfMeals: "3",
      weekStartDate: "2026-06-22",
      participantMemberIds: ["00000000-0000-4000-8000-000000000101"],
      servings: "4",
      maxCookTimeMinutes: "40",
      calorieTarget: "700",
      proteinGoal: "45",
      preferredProteins: "chicken, beef",
      preferredBaseCarbs: "rice, quinoa",
      vegetables: "broccoli, peppers",
      avoidIngredients: "tree nuts",
      useHouseholdPreferences: true,
      usePantryStaples: true,
      useSavedRecipes: true
    });

    assert.equal(parsed.mealType, "LUNCH");
    assert.deepEqual(parsed.preferredProteins, ["chicken", "beef"]);
    assert.equal(parsed.maxCookTimeMinutes, 40);
  });
});

describe("OpenAI planning provider helpers", () => {
  it("extracts output text from nested Responses API content", () => {
    const text = extractOpenAiOutputText({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: "{\"providerId\":\"openai\"}"
            }
          ]
        }
      ]
    });

    assert.equal(text, "{\"providerId\":\"openai\"}");
  });
});

describe("mock AI planning provider", () => {
  it("returns structured suggestions compatible with recipe creation", async () => {
    const request = aiPlanningRequestSchema.parse({
      prompt: "Plan protein-heavy lunches with chicken, rice, and vegetables",
      mealType: "LUNCH",
      numberOfMeals: 2,
      weekStartDate: "2026-06-22",
      participantMemberIds: ["00000000-0000-4000-8000-000000000101"],
      servings: 4,
      maxCookTimeMinutes: 40,
      calorieTarget: 700,
      proteinGoal: 45,
      preferredProteins: "chicken",
      preferredBaseCarbs: "rice",
      vegetables: "broccoli, peppers",
      avoidIngredients: "tree nuts",
      useHouseholdPreferences: true,
      usePantryStaples: true,
      useSavedRecipes: false
    });
    const result = await new MockAiPlanningProvider().generate({
      request,
      profiles,
      savedRecipes: []
    });

    assert.equal(result.providerId, "mock");
    assert.equal(result.suggestions.length, 2);
    assert.equal(result.suggestions[0].mealType, "LUNCH");
    assert.equal(result.suggestions[0].cuisine, "Mexican");
    assert.ok(result.suggestions[0].ingredients.length > 0);
    assert.ok(result.suggestions[0].ingredients.some((ingredient) => ingredient.quantity != null));
    assert.ok(result.suggestions[0].nutritionEstimateNote.includes("estimated"));
    assert.ok(result.suggestions[0].warnings.some((warning) => warning.includes("tree nuts")));
  });

  it("respects cuisine requests in generated recipe structure", async () => {
    const request = aiPlanningRequestSchema.parse({
      prompt: "Generate a Korean beef rice bowl with vegetables",
      mealType: "DINNER",
      numberOfMeals: 1,
      weekStartDate: "2026-06-22",
      participantMemberIds: ["00000000-0000-4000-8000-000000000101"],
      servings: 4,
      maxCookTimeMinutes: 40,
      calorieTarget: null,
      proteinGoal: null,
      preferredProteins: "beef",
      preferredBaseCarbs: "rice",
      vegetables: "spinach, carrots",
      avoidIngredients: "",
      useHouseholdPreferences: true,
      usePantryStaples: true,
      useSavedRecipes: false
    });
    const result = await new MockAiPlanningProvider().generate({
      request,
      profiles,
      savedRecipes: []
    });

    assert.equal(result.suggestions[0].cuisine, "Korean");
    assert.ok(result.suggestions[0].ingredients.some((ingredient) => ingredient.name === "gochujang"));
  });
});
