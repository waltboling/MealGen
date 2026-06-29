import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractOpenAiRecipeImageText,
  parseRecipeFileWithOpenAi
} from "../src/server/recipe-image-parser/openai-recipe-image-parser.ts";

describe("recipe file parser helpers", () => {
  it("extracts text from nested Responses API output", () => {
    const text = extractOpenAiRecipeImageText({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: "{\"title\":\"Grandma's Pancakes\"}"
            }
          ]
        }
      ]
    });

    assert.equal(text, "{\"title\":\"Grandma's Pancakes\"}");
  });

  it("prefers output_text when present", () => {
    const text = extractOpenAiRecipeImageText({
      output_text: "{\"title\":\"Photo Recipe\"}",
      output: [
        {
          content: [{ text: "{\"title\":\"Nested\"}" }]
        }
      ]
    });

    assert.equal(text, "{\"title\":\"Photo Recipe\"}");
  });

  it("sends PDFs as file inputs for multi-page parsing", async () => {
    const originalFetch = globalThis.fetch;
    const originalApiKey = process.env.OPENAI_API_KEY;
    let requestBodyJson = "";

    process.env.OPENAI_API_KEY = "test-key";
    globalThis.fetch = async (_url, init) => {
      requestBodyJson = String(init?.body ?? "");

      return new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            title: "Scanned Lasagna",
            description: null,
            prepMinutes: null,
            cookMinutes: null,
            servings: 6,
            tags: ["dinner"],
            ingredients: [
              {
                displayText: "1 lb noodles",
                name: "noodles",
                quantity: 1,
                unit: "lb"
              }
            ],
            instructions: ["Layer and bake."],
            notes: []
          })
        }),
        { status: 200 }
      );
    };

    try {
      const recipe = await parseRecipeFileWithOpenAi(
        new File([Buffer.from("%PDF-1.7")], "recipe.pdf", {
          type: "application/pdf"
        })
      );
      const requestBody = JSON.parse(requestBodyJson) as {
        input: Array<{
          content?: Array<{
            type?: string;
            filename?: string;
            file_data?: string;
          }>;
        }>;
      };
      const filePart = requestBody.input[1].content?.[1];

      assert.ok(filePart);
      assert.equal(filePart.type, "input_file");
      assert.equal(filePart.filename, "recipe.pdf");
      assert.match(filePart.file_data ?? "", /^data:application\/pdf;base64,/);
      assert.equal(recipe.sourceName, "PDF import");
      assert.ok(recipe.tags.includes("pdf import"));
    } finally {
      globalThis.fetch = originalFetch;

      if (originalApiKey == null) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = originalApiKey;
      }
    }
  });
});
