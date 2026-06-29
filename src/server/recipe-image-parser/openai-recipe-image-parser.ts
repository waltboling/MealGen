import { z } from "zod";
import type { RecipeFormInput } from "@/features/recipes/types";

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

const parsedIngredientSchema = z.object({
  displayText: z.string().trim().min(1),
  name: z.string().trim().min(1),
  quantity: z.number().positive().nullable(),
  unit: z.string().trim().nullable()
});

const parsedRecipeSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().nullable(),
  prepMinutes: z.number().int().min(0).nullable(),
  cookMinutes: z.number().int().min(0).nullable(),
  servings: z.number().int().min(1).max(100),
  tags: z.array(z.string().trim().min(1).max(40)).max(16),
  ingredients: z.array(parsedIngredientSchema).min(1),
  instructions: z.array(z.string().trim().min(1)).min(1).max(40),
  notes: z.array(z.string().trim().min(1).max(500)).max(8)
});

const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);
const supportedPdfTypes = new Set(["application/pdf"]);
const supportedFileTypes = new Set([
  ...supportedImageTypes,
  ...supportedPdfTypes
]);
const maxImageBytes = 8 * 1024 * 1024;
const maxPdfBytes = 20 * 1024 * 1024;

export function extractOpenAiRecipeImageText(data: OpenAiResponse) {
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

function toRecipeInput(
  parsed: z.infer<typeof parsedRecipeSchema>,
  sourceKind: "image" | "pdf"
): RecipeFormInput {
  const sourceLabel = sourceKind === "pdf" ? "PDF import" : "Image import";
  const tag = sourceKind === "pdf" ? "pdf import" : "image import";

  return {
    title: parsed.title,
    description:
      parsed.description ??
      `Imported from an uploaded recipe ${sourceKind}. Review for transcription accuracy before cooking.`,
    imageUrl: null,
    sourceName: sourceLabel,
    sourceUrl: null,
    authorName: null,
    prepMinutes: parsed.prepMinutes,
    cookMinutes: parsed.cookMinutes,
    servings: parsed.servings,
    tags: Array.from(new Set([tag, ...parsed.tags])).slice(0, 16),
    ingredients: parsed.ingredients.map((ingredient) => ({
      displayText: ingredient.displayText,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit
    })),
    instructions: parsed.instructions.map((text) => ({ text })),
    notes: [
      {
        text: `Imported from an uploaded ${sourceKind}. Please review quantities, timing, and transcription before using.`
      },
      ...parsed.notes.map((text) => ({ text }))
    ]
  };
}

function getSourceKind(file: File) {
  if (supportedImageTypes.has(file.type)) {
    return "image" as const;
  }

  if (supportedPdfTypes.has(file.type)) {
    return "pdf" as const;
  }

  return null;
}

function getMaxFileBytes(sourceKind: "image" | "pdf") {
  return sourceKind === "pdf" ? maxPdfBytes : maxImageBytes;
}

function getUploadPrompt(sourceKind: "image" | "pdf") {
  if (sourceKind === "pdf") {
    return "Parse this uploaded multi-page recipe PDF into this exact JSON shape: { title, description, prepMinutes, cookMinutes, servings, tags, ingredients: [{ displayText, name, quantity, unit }], instructions, notes }. Use all pages that appear to belong to the recipe. Use null for unknown numbers. Keep ingredient displayText faithful to the PDF. Use concise cooking steps.";
  }

  return "Parse this uploaded recipe image into this exact JSON shape: { title, description, prepMinutes, cookMinutes, servings, tags, ingredients: [{ displayText, name, quantity, unit }], instructions, notes }. Use null for unknown numbers. Keep ingredient displayText faithful to the image. Use concise cooking steps.";
}

function getInputFilePart(file: File, fileUrl: string, sourceKind: "image" | "pdf") {
  if (sourceKind === "pdf") {
    return {
      type: "input_file",
      filename: file.name || "recipe.pdf",
      file_data: fileUrl
    };
  }

  return {
    type: "input_image",
    image_url: fileUrl
  };
}

export async function parseRecipeFileWithOpenAi(file: File) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to import a recipe file.");
  }

  const sourceKind = getSourceKind(file);

  if (!sourceKind || !supportedFileTypes.has(file.type)) {
    throw new Error("Upload a JPG, PNG, WebP, GIF, or PDF recipe file.");
  }

  if (file.size <= 0) {
    throw new Error("Upload a file that contains a recipe.");
  }

  const maxFileBytes = getMaxFileBytes(sourceKind);

  if (file.size > maxFileBytes) {
    const maxMb = Math.round(maxFileBytes / 1024 / 1024);

    throw new Error(`Upload a ${sourceKind.toUpperCase()} smaller than ${maxMb} MB.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const fileUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_RECIPE_IMAGE_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You convert uploaded recipe images and PDFs into structured recipe JSON. Transcribe visible recipe text carefully across all provided pages. Do not invent missing ingredients or steps. If a value is unclear, use a note explaining the uncertainty. Return only valid JSON."
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: getUploadPrompt(sourceKind)
            },
            getInputFilePart(file, fileUrl, sourceKind)
          ]
        }
      ],
      text: {
        format: { type: "json_object" }
      }
    })
  });

  if (!response.ok) {
    throw new Error("The recipe parser could not read this file.");
  }

  const data = (await response.json()) as OpenAiResponse;
  const outputText = extractOpenAiRecipeImageText(data);
  let parsed: unknown;

  try {
    parsed = JSON.parse(outputText || "{}") as unknown;
  } catch {
    throw new Error("The recipe parser returned text that was not valid JSON.");
  }

  const result = parsedRecipeSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error("The recipe parser could not find a complete recipe.");
  }

  return toRecipeInput(result.data, sourceKind);
}

export async function parseRecipeImageWithOpenAi(file: File) {
  return parseRecipeFileWithOpenAi(file);
}
