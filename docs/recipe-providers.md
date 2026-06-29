# Recipe Provider Architecture

Recipe search/import is intentionally provider-neutral.

## Flow

1. `/recipes/search` collects keyword and filter input.
2. `RecipeService.searchImportableRecipes` asks every registered provider for results.
3. A result card posts `providerId` and `externalId` to `importRecipeAction`.
4. `RecipeService.importRecipe` asks the matching provider for import details.
5. `RecipeRepository.importRecipe` stores a provider snapshot in `ImportedRecipe`.
6. The app creates a normal editable `Recipe` linked to that import snapshot.

The saved recipe is what meal planning and grocery generation use. The imported snapshot keeps original source URL, provider ID, external ID, attribution, and raw provider payload.

## Current Providers

- `MockRecipeProvider`: local realistic results without API credentials.
- `SpoonacularRecipeProvider`: enabled when `SPOONACULAR_API_KEY` is present.

Spoonacular uses official API endpoints for search and recipe information. It preserves source name/source URL where the API provides them.

```env
SPOONACULAR_API_KEY="your-key"
```

If the key is missing, search still works through the demo provider.

## Adding Another Provider

1. Create a class that implements `RecipeProvider`.
2. Keep API keys server-side only.
3. Map provider search results into `RecipeSearchResult`.
4. Map provider import details into `ImportedRecipeCandidate`.
5. Register the provider in `src/server/recipe-providers/registry.ts`.
6. Add tests for search filtering, attribution, and import details.

Do not scrape recipe sites. Only import fields made available by a provider API or explicitly entered by the user.
