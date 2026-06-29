import { aiPlanningResultSchema } from "../../features/ai-planning/schemas.ts";
import { z } from "zod";
import type {
  AiPlanningProvider,
  AiPlanningProviderInput
} from "./types.ts";

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

export function extractOpenAiOutputText(data: OpenAiResponse) {
  if (data.output_text) {
    return data.output_text;
  }

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter((text): text is string => Boolean(text))
      .join("\n") ?? ""
  );
}

export class OpenAiPlanningProvider implements AiPlanningProvider {
  id = "openai";

  async generate(input: AiPlanningProviderInput) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MEAL_PLANNER_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              [
                "You are a meal-planning engine for a household meal planner.",
                "Return only valid JSON with this exact shape:",
                "{ providerId: string, warnings: string[], suggestions: Array<{ id: string, title: string, mealType: BREAKFAST|LUNCH|DINNER|SNACK|MEAL_PREP|OTHER, cuisine: string|null, shortDescription: string, whyItMatches: string, estimatedCookTimeMinutes: number|null, estimatedCalories: number|null, estimatedProteinGrams: number|null, servings: number, ingredients: Array<{ displayText: string, name: string, quantity: number|null, unit: string|null }>, instructions: string[], tags: string[], matchedHouseholdPreferences: string[], warnings: string[], assumptions: string[], nutritionEstimateNote: string, sourceType: generated|saved_recipe|imported_recipe, sourceRecipeId: string|null, sourceUrl: string|null }> }.",
                "Do not invent external source attribution.",
                "Use sourceType generated unless reusing a saved recipe from the provided savedRecipes list.",
                "Treat nutrition as estimates and explain the estimate basis in nutritionEstimateNote.",
                "When a cuisine is requested, use ingredients, seasonings, techniques, and names that are plausible for that cuisine.",
                "Ingredient amounts must be realistic for the requested servings and must include quantity/unit wherever practical.",
                "Avoid vague ingredients like 'vegetables' when specific vegetables are requested.",
                "Avoid allergy conflicts and mention warnings when assumptions are made."
              ].join(" ")
          },
          {
            role: "user",
            content: JSON.stringify(input)
          }
        ],
        text: {
          format: { type: "json_object" }
        }
      })
    });

    if (!response.ok) {
      throw new Error("The AI provider could not generate suggestions.");
    }

    const data = (await response.json()) as OpenAiResponse;
    const outputText = extractOpenAiOutputText(data);
    let parsed: unknown;

    try {
      parsed = JSON.parse(outputText || "{}") as unknown;
    } catch {
      throw new Error("The AI provider returned text that was not valid JSON.");
    }

    const parsedResult = aiPlanningResultSchema.safeParse(parsed);

    if (!parsedResult.success) {
      const firstIssue = z.treeifyError(parsedResult.error).errors[0];

      throw new Error(
        firstIssue
          ? `The AI provider returned incomplete recipe data: ${firstIssue}`
          : "The AI provider returned incomplete recipe data."
      );
    }

    const result = parsedResult.data;

    return {
      ...result,
      providerId: this.id
    };
  }
}
