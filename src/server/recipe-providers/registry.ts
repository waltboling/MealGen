import { MockRecipeProvider } from "@/server/recipe-providers/mock-provider";
import { SpoonacularRecipeProvider } from "@/server/recipe-providers/spoonacular-provider";
import type { RecipeProvider } from "@/server/recipe-providers/types";

export function getRecipeProviders() {
  const providers: RecipeProvider[] = [new MockRecipeProvider()];

  if (process.env.SPOONACULAR_API_KEY) {
    providers.unshift(new SpoonacularRecipeProvider());
  }

  return providers;
}

export function getRecipeProvider(providerId: string) {
  return getRecipeProviders().find((provider) => provider.id === providerId) ?? null;
}
