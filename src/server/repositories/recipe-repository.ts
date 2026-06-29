import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  RecipeImportInput,
  RecipeDetails,
  RecipeFormInput,
  RecipeListItem
} from "@/features/recipes/types";
import type { ImportedRecipeCandidate } from "@/server/recipe-providers/types";

type DemoRecipeRecord = Omit<RecipeDetails, "updatedAt" | "notes"> & {
  updatedAt: string;
  notes: Array<{ id: string; text: string; createdAt: string }>;
};

const demoRecipesPath = path.join(process.cwd(), "data", "demo-recipes.json");

function uniqueTags(tags: string[]) {
  return Array.from(
    new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))
  );
}

function toRecipeDetails(record: DemoRecipeRecord): RecipeDetails {
  return {
    ...record,
    origin: record.origin ?? "CUSTOM",
    importedRecipeId: record.importedRecipeId ?? null,
    providerId: record.providerId ?? null,
    externalId: record.externalId ?? null,
    updatedAt: new Date(record.updatedAt),
    notes: record.notes.map((note) => ({
      ...note,
      createdAt: new Date(note.createdAt)
    }))
  };
}

function toListItem(recipe: RecipeDetails): RecipeListItem {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    imageUrl: recipe.imageUrl,
    sourceName: recipe.sourceName,
    origin: recipe.origin,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    servings: recipe.servings,
    tags: recipe.tags,
    ingredientCount: recipe.ingredients.length,
    noteCount: recipe.notes.length,
    updatedAt: recipe.updatedAt
  };
}

function fromPrismaRecipe(recipe: Prisma.RecipeGetPayload<{
  include: {
    ingredients: true;
    instructions: true;
    notes: true;
    tags: true;
    importedRecipe: true;
  };
}>): RecipeDetails {
  const ingredients = [...recipe.ingredients].sort(
    (first, second) => first.position - second.position
  );
  const instructions = [...recipe.instructions].sort(
    (first, second) => first.step - second.step
  );
  const notes = [...recipe.notes].sort(
    (first, second) => second.createdAt.getTime() - first.createdAt.getTime()
  );

  return {
    id: recipe.id,
    importedRecipeId: recipe.importedRecipeId,
    title: recipe.title,
    description: recipe.description,
    imageUrl: recipe.imageUrl,
    sourceName: recipe.sourceName,
    sourceUrl: recipe.sourceUrl,
    authorName: recipe.authorName,
    origin: recipe.isCustom ? "CUSTOM" : "IMPORTED",
    providerId: recipe.importedRecipe?.providerId ?? null,
    externalId: recipe.importedRecipe?.externalId ?? null,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    servings: recipe.servings,
    tags: recipe.tags.map((tag) => tag.name).sort(),
    ingredientCount: ingredients.length,
    noteCount: notes.length,
    updatedAt: recipe.updatedAt,
    ingredients: ingredients.map((ingredient) => ({
      id: ingredient.id,
      displayText: ingredient.displayText,
      name: ingredient.name,
      quantity: ingredient.quantity ? Number(ingredient.quantity) : null,
      unit: ingredient.unit,
      position: ingredient.position
    })),
    instructions: instructions.map((instruction) => ({
      id: instruction.id,
      step: instruction.step,
      text: instruction.text
    })),
    notes: notes.map((note) => ({
      id: note.id,
      text: note.text,
      createdAt: note.createdAt
    }))
  };
}

async function readDemoRecipes() {
  const raw = await readFile(demoRecipesPath, "utf8");
  return JSON.parse(raw) as DemoRecipeRecord[];
}

async function writeDemoRecipes(recipes: DemoRecipeRecord[]) {
  await writeFile(demoRecipesPath, `${JSON.stringify(recipes, null, 2)}\n`);
}

function createDemoRecord(input: RecipeFormInput): DemoRecipeRecord {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    importedRecipeId: null,
    title: input.title,
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    sourceName: input.sourceName ?? null,
    sourceUrl: input.sourceUrl ?? null,
    authorName: input.authorName ?? null,
    origin: "CUSTOM",
    providerId: null,
    externalId: null,
    prepMinutes: input.prepMinutes ?? null,
    cookMinutes: input.cookMinutes ?? null,
    servings: input.servings,
    tags: uniqueTags(input.tags),
    ingredientCount: input.ingredients.length,
    noteCount: input.notes.length,
    ingredients: input.ingredients.map((ingredient, index) => ({
      id: randomUUID(),
      displayText: ingredient.displayText,
      name: ingredient.name,
      quantity: ingredient.quantity ?? null,
      unit: ingredient.unit ?? null,
      position: index + 1
    })),
    instructions: input.instructions.map((instruction, index) => ({
      id: randomUUID(),
      text: instruction.text,
      step: index + 1
    })),
    notes: input.notes.map((note) => ({
      id: randomUUID(),
      text: note.text,
      createdAt: now
    })),
    updatedAt: now
  };
}

function createImportedDemoRecord(
  candidate: ImportedRecipeCandidate
): DemoRecipeRecord {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    importedRecipeId: randomUUID(),
    title: candidate.title,
    description: candidate.description,
    imageUrl: candidate.imageUrl,
    sourceName: candidate.sourceName,
    sourceUrl: candidate.sourceUrl,
    authorName: candidate.authorName,
    origin: "IMPORTED",
    providerId: candidate.providerId,
    externalId: candidate.externalId,
    prepMinutes: candidate.prepMinutes,
    cookMinutes: candidate.cookMinutes,
    servings: candidate.servings ?? 4,
    tags: uniqueTags(candidate.tags),
    ingredientCount: candidate.ingredients.length,
    noteCount: 0,
    ingredients: candidate.ingredients.map((ingredient, index) => ({
      id: randomUUID(),
      displayText: ingredient.displayText,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      position: index + 1
    })),
    instructions: candidate.instructions.map((text, index) => ({
      id: randomUUID(),
      text,
      step: index + 1
    })),
    notes: [],
    updatedAt: now
  };
}

export class RecipeRepository {
  async list(householdId: string, isDemo: boolean): Promise<RecipeListItem[]> {
    if (isDemo) {
      const recipes = await readDemoRecipes();
      return recipes
        .map(toRecipeDetails)
        .map(toListItem)
        .sort((first, second) => second.updatedAt.getTime() - first.updatedAt.getTime());
    }

    const recipes = await prisma.recipe.findMany({
      where: { householdId },
      include: {
        ingredients: true,
        instructions: true,
        notes: true,
        tags: true,
        importedRecipe: true
      },
      orderBy: { updatedAt: "desc" }
    });

    return recipes.map(fromPrismaRecipe).map(toListItem);
  }

  async getById(
    householdId: string,
    recipeId: string,
    isDemo: boolean
  ): Promise<RecipeDetails | null> {
    if (isDemo) {
      const recipes = await readDemoRecipes();
      const recipe = recipes.find((item) => item.id === recipeId);
      return recipe ? toRecipeDetails(recipe) : null;
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, householdId },
      include: {
        ingredients: true,
        instructions: true,
        notes: true,
        tags: true,
        importedRecipe: true
      }
    });

    return recipe ? fromPrismaRecipe(recipe) : null;
  }

  async create(
    householdId: string,
    userId: string,
    input: RecipeFormInput,
    isDemo: boolean
  ) {
    if (isDemo) {
      const recipes = await readDemoRecipes();
      const recipe = createDemoRecord(input);
      await writeDemoRecipes([recipe, ...recipes]);
      return recipe.id;
    }

    const recipe = await prisma.recipe.create({
      data: {
        householdId,
        createdByUserId: userId,
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        authorName: input.authorName,
        prepMinutes: input.prepMinutes,
        cookMinutes: input.cookMinutes,
        servings: input.servings,
        isCustom: true,
        ingredients: {
          create: input.ingredients.map((ingredient, index) => ({
            displayText: ingredient.displayText,
            name: ingredient.name,
            normalizedName: ingredient.name.trim().toLowerCase(),
            quantity:
              ingredient.quantity == null
                ? undefined
                : new Prisma.Decimal(ingredient.quantity),
            unit: ingredient.unit,
            position: index + 1
          }))
        },
        instructions: {
          create: input.instructions.map((instruction, index) => ({
            text: instruction.text,
            step: index + 1
          }))
        },
        notes: {
          create: input.notes.map((note) => ({
            text: note.text
          }))
        },
        tags: {
          create: uniqueTags(input.tags).map((name) => ({ name }))
        }
      }
    });

    return recipe.id;
  }

  async importRecipe(
    householdId: string,
    userId: string,
    input: RecipeImportInput,
    candidate: ImportedRecipeCandidate,
    isDemo: boolean
  ) {
    if (isDemo) {
      const recipes = await readDemoRecipes();
      const existing = recipes.find(
        (recipe) =>
          recipe.providerId === input.providerId &&
          recipe.externalId === input.externalId
      );

      if (existing) {
        return existing.id;
      }

      const recipe = createImportedDemoRecord(candidate);
      await writeDemoRecipes([recipe, ...recipes]);
      return recipe.id;
    }

    const importedRecipe = await prisma.importedRecipe.upsert({
      where: {
        householdId_providerId_externalId: {
          householdId,
          providerId: input.providerId,
          externalId: input.externalId
        }
      },
      update: {
        title: candidate.title,
        imageUrl: candidate.imageUrl,
        sourceName: candidate.sourceName,
        authorName: candidate.authorName,
        sourceUrl: candidate.sourceUrl,
        ingredientsJson: candidate.ingredients,
        instructionsJson: candidate.instructions,
        prepMinutes: candidate.prepMinutes,
        cookMinutes: candidate.cookMinutes,
        servings: candidate.servings,
        tags: uniqueTags(candidate.tags),
        rawPayload: JSON.parse(JSON.stringify(candidate.rawPayload ?? candidate))
      },
      create: {
        householdId,
        providerId: input.providerId,
        externalId: input.externalId,
        title: candidate.title,
        imageUrl: candidate.imageUrl,
        sourceName: candidate.sourceName,
        authorName: candidate.authorName,
        sourceUrl: candidate.sourceUrl,
        ingredientsJson: candidate.ingredients,
        instructionsJson: candidate.instructions,
        prepMinutes: candidate.prepMinutes,
        cookMinutes: candidate.cookMinutes,
        servings: candidate.servings,
        tags: uniqueTags(candidate.tags),
        rawPayload: JSON.parse(JSON.stringify(candidate.rawPayload ?? candidate))
      }
    });

    const existingRecipe = await prisma.recipe.findFirst({
      where: {
        householdId,
        importedRecipeId: importedRecipe.id,
        isCustom: false
      },
      select: { id: true }
    });

    if (existingRecipe) {
      return existingRecipe.id;
    }

    const recipe = await prisma.recipe.create({
      data: {
        householdId,
        importedRecipeId: importedRecipe.id,
        createdByUserId: userId,
        title: candidate.title,
        description: candidate.description,
        imageUrl: candidate.imageUrl,
        sourceName: candidate.sourceName,
        sourceUrl: candidate.sourceUrl,
        authorName: candidate.authorName,
        prepMinutes: candidate.prepMinutes,
        cookMinutes: candidate.cookMinutes,
        servings: candidate.servings ?? 4,
        isCustom: false,
        ingredients: {
          create: candidate.ingredients.map((ingredient, index) => ({
            displayText: ingredient.displayText,
            name: ingredient.name,
            normalizedName: ingredient.name.trim().toLowerCase(),
            quantity:
              ingredient.quantity == null
                ? undefined
                : new Prisma.Decimal(ingredient.quantity),
            unit: ingredient.unit,
            position: index + 1
          }))
        },
        instructions: {
          create: candidate.instructions.map((text, index) => ({
            text,
            step: index + 1
          }))
        },
        tags: {
          create: uniqueTags(candidate.tags).map((name) => ({ name }))
        }
      }
    });

    return recipe.id;
  }

  async update(
    householdId: string,
    recipeId: string,
    input: RecipeFormInput,
    isDemo: boolean
  ) {
    if (isDemo) {
      const recipes = await readDemoRecipes();
      const recipeIndex = recipes.findIndex((recipe) => recipe.id === recipeId);

      if (recipeIndex === -1) {
        return false;
      }

      recipes[recipeIndex] = {
        ...createDemoRecord(input),
        id: recipeId
      };
      await writeDemoRecipes(recipes);
      return true;
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, householdId },
      select: { id: true }
    });

    if (!recipe) {
      return false;
    }

    await prisma.$transaction([
      prisma.recipeIngredient.deleteMany({ where: { recipeId } }),
      prisma.recipeInstruction.deleteMany({ where: { recipeId } }),
      prisma.recipeNote.deleteMany({ where: { recipeId } }),
      prisma.recipeTag.deleteMany({ where: { recipeId } }),
      prisma.recipe.update({
        where: { id: recipeId },
        data: {
          title: input.title,
          description: input.description,
          imageUrl: input.imageUrl,
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
          authorName: input.authorName,
          prepMinutes: input.prepMinutes,
          cookMinutes: input.cookMinutes,
          servings: input.servings,
          isCustom: true,
          ingredients: {
            create: input.ingredients.map((ingredient, index) => ({
              displayText: ingredient.displayText,
              name: ingredient.name,
              normalizedName: ingredient.name.trim().toLowerCase(),
              quantity:
                ingredient.quantity == null
                  ? undefined
                  : new Prisma.Decimal(ingredient.quantity),
              unit: ingredient.unit,
              position: index + 1
            }))
          },
          instructions: {
            create: input.instructions.map((instruction, index) => ({
              text: instruction.text,
              step: index + 1
            }))
          },
          notes: {
            create: input.notes.map((note) => ({
              text: note.text
            }))
          },
          tags: {
            create: uniqueTags(input.tags).map((name) => ({ name }))
          }
        }
      })
    ]);

    return true;
  }

  async delete(householdId: string, recipeId: string, isDemo: boolean) {
    if (isDemo) {
      const recipes = await readDemoRecipes();
      await writeDemoRecipes(recipes.filter((recipe) => recipe.id !== recipeId));
      return true;
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, householdId },
      select: { id: true }
    });

    if (!recipe) {
      return false;
    }

    await prisma.recipe.delete({ where: { id: recipeId } });
    return true;
  }
}
