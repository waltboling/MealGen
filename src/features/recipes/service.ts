import type {
  RecipeFormInput,
  RecipeImportInput
} from "@/features/recipes/types";
import type { CurrentHousehold } from "@/lib/auth/current-household";
import {
  getRecipeProvider,
  getRecipeProviders
} from "@/server/recipe-providers/registry";
import type { RecipeSearchInput } from "@/server/recipe-providers/types";
import { rankRecipeSearchResults } from "@/server/recipe-ranking/favorite-source-ranking";
import { FavoriteSourceRepository } from "@/server/repositories/favorite-source-repository";
import { RecipeRepository } from "@/server/repositories/recipe-repository";

const recipeRepository = new RecipeRepository();
const favoriteSourceRepository = new FavoriteSourceRepository();

export class RecipeService {
  listRecipes(context: CurrentHousehold) {
    return recipeRepository.list(context.householdId, context.isDemo);
  }

  getRecipe(context: CurrentHousehold, recipeId: string) {
    return recipeRepository.getById(
      context.householdId,
      recipeId,
      context.isDemo
    );
  }

  createRecipe(context: CurrentHousehold, input: RecipeFormInput) {
    return recipeRepository.create(
      context.householdId,
      context.userId,
      input,
      context.isDemo
    );
  }

  updateRecipe(
    context: CurrentHousehold,
    recipeId: string,
    input: RecipeFormInput
  ) {
    return recipeRepository.update(
      context.householdId,
      recipeId,
      input,
      context.isDemo
    );
  }

  deleteRecipe(context: CurrentHousehold, recipeId: string) {
    return recipeRepository.delete(
      context.householdId,
      recipeId,
      context.isDemo
    );
  }

  getRecipeProviders() {
    return getRecipeProviders().map((provider) => ({
      id: provider.id,
      name: provider.name
    }));
  }

  async searchImportableRecipes(
    context: CurrentHousehold,
    input: RecipeSearchInput
  ) {
    const providers = getRecipeProviders();
    const [favoriteSources, results] = await Promise.all([
      favoriteSourceRepository.list(context.householdId, context.isDemo),
      Promise.allSettled(
        providers.map(async (provider) => ({
          provider,
          results: await provider.search(input)
        }))
      )
    ]);

    const providerResults = results.flatMap((result) => {
      if (result.status !== "fulfilled") {
        return [];
      }

      const { provider, results: recipeResults } = result.value;

      return recipeResults.map((recipe) => ({
        ...recipe,
        providerName: provider.name
      }));
    });

    return rankRecipeSearchResults(providerResults, favoriteSources);
  }

  async searchImportableRecipesWithoutRanking(input: RecipeSearchInput) {
    const providers = getRecipeProviders();
    const results = await Promise.allSettled(
      providers.map(async (provider) => ({
        provider,
        results: await provider.search(input)
      }))
    );

    return results.flatMap((result) => {
      if (result.status !== "fulfilled") {
        return [];
      }

      const { provider, results: providerResults } = result.value;

      return providerResults.map((recipe) => ({
        ...recipe,
        providerName: provider.name
      }));
    });
  }

  async importRecipe(context: CurrentHousehold, input: RecipeImportInput) {
    const provider = getRecipeProvider(input.providerId);

    if (!provider) {
      throw new Error("Recipe provider is not available.");
    }

    const candidate = await provider.getRecipe({
      externalId: input.externalId
    });

    return recipeRepository.importRecipe(
      context.householdId,
      context.userId,
      input,
      candidate,
      context.isDemo
    );
  }

  async getImportableRecipeCandidate(input: RecipeImportInput) {
    const provider = getRecipeProvider(input.providerId);

    if (!provider) {
      throw new Error("Recipe provider is not available.");
    }

    return provider.getRecipe({
      externalId: input.externalId
    });
  }
}
