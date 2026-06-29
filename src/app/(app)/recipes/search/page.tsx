import Link from "next/link";
import { CalendarPlus, Clock, Search, Sparkles, Star, Utensils } from "lucide-react";
import { importRecipeAction, importRecipeToWeekAction } from "@/features/recipes/actions";
import { recipeSearchSchema } from "@/features/recipes/schemas";
import { RecipeService } from "@/features/recipes/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";

type RecipeSearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const recipeService = new RecipeService();

const cuisineOptions = ["Mediterranean", "Mexican", "Asian", "Italian"];
const dietOptions = ["Vegetarian", "Pescatarian", "Dairy-Free"];

function getArrayParam(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getStringParam(value: string | string[] | undefined) {
  if (!value || Array.isArray(value)) {
    return "";
  }

  return value;
}

function totalTime(prepMinutes: number | null, cookMinutes: number | null) {
  const total = (prepMinutes ?? 0) + (cookMinutes ?? 0);
  return total > 0 ? `${total} min` : "Time varies";
}

export default async function RecipeSearchPage({
  searchParams
}: RecipeSearchPageProps) {
  const context = await getCurrentHouseholdOrRedirect();
  const params = await searchParams;
  const parsedSearch = recipeSearchSchema.parse({
    query: getStringParam(params.query),
    cuisines: getArrayParam(params.cuisines),
    diets: getArrayParam(params.diets),
    maxCookTimeMinutes: getStringParam(params.maxCookTimeMinutes),
    servings: getStringParam(params.servings)
  });
  const hasSearch =
    Boolean(parsedSearch.query) ||
    parsedSearch.cuisines.length > 0 ||
    parsedSearch.diets.length > 0 ||
    Boolean(parsedSearch.maxCookTimeMinutes) ||
    Boolean(parsedSearch.servings);
  const [providers, results] = await Promise.all([
    recipeService.getRecipeProviders(),
    recipeService.searchImportableRecipes(context, parsedSearch)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <PageHeader
          title="Find Recipes"
          description="Search provider results, then save an editable copy to your recipe library."
        />
        <div className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
          {providers.map((provider) => provider.name).join(", ")}
          <span className="mx-2 text-border">|</span>
          <Link href="/favorite-sources" className="font-medium text-primary">
            Favorite sources
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="size-5" />
            Search filters
          </CardTitle>
          <CardDescription>
            Results come from provider APIs or the local demo provider. Saved
            recipes keep source attribution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_160px_160px_auto] lg:items-end">
              <div className="space-y-2">
                <Label htmlFor="query">Keyword</Label>
                <Input
                  id="query"
                  name="query"
                  placeholder="salmon, tacos, pasta..."
                  defaultValue={parsedSearch.query ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCookTimeMinutes">Max time</Label>
                <Input
                  id="maxCookTimeMinutes"
                  name="maxCookTimeMinutes"
                  type="number"
                  min="1"
                  placeholder="45"
                  defaultValue={parsedSearch.maxCookTimeMinutes ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  name="servings"
                  type="number"
                  min="1"
                  placeholder="4"
                  defaultValue={parsedSearch.servings ?? ""}
                />
              </div>
              <Button type="submit">
                <Search className="size-4" />
                Search
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Cuisine</legend>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map((cuisine) => (
                    <label
                      key={cuisine}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="cuisines"
                        value={cuisine}
                        defaultChecked={parsedSearch.cuisines.includes(cuisine)}
                        className="size-4 accent-primary"
                      />
                      {cuisine}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Dietary</legend>
                <div className="flex flex-wrap gap-2">
                  {dietOptions.map((diet) => (
                    <label
                      key={diet}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="diets"
                        value={diet}
                        defaultChecked={parsedSearch.diets.includes(diet)}
                        className="size-4 accent-primary"
                      />
                      {diet}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </form>
        </CardContent>
      </Card>

      {!hasSearch ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5" />
              Start with a search
            </CardTitle>
            <CardDescription>
              Try a keyword, cuisine, dietary filter, or time limit. The demo
              provider has several realistic recipes ready to import.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No matching recipes</CardTitle>
            <CardDescription>
              Loosen a filter or try a broader keyword.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((recipe) => (
            <Card
              key={`${recipe.providerId}:${recipe.externalId}`}
              className="flex h-full flex-col overflow-hidden"
            >
              <div className="aspect-[4/3] bg-secondary">
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Utensils className="size-10" />
                  </div>
                )}
              </div>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge>{recipe.providerName}</Badge>
                  {recipe.favoriteSource ? (
                    <Badge className="gap-1 bg-amber-600 text-white">
                      <Star className="size-3" />
                      Favorite: {recipe.favoriteSource.name}
                    </Badge>
                  ) : null}
                  {recipe.cuisines.slice(0, 1).map((cuisine) => (
                    <Badge key={cuisine} variant="outline">
                      {cuisine}
                    </Badge>
                  ))}
                  {recipe.diets.slice(0, 1).map((diet) => (
                    <Badge key={diet} variant="outline">
                      {diet}
                    </Badge>
                  ))}
                </div>
                <div>
                  <CardTitle className="text-xl">{recipe.title}</CardTitle>
                  <CardDescription>
                    {recipe.sourceName}
                    {recipe.authorName ? ` by ${recipe.authorName}` : ""}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {totalTime(recipe.prepMinutes, recipe.cookMinutes)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Utensils className="size-4" />
                    {recipe.servings ?? "Flexible"} servings
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <form action={importRecipeAction}>
                    <input type="hidden" name="providerId" value={recipe.providerId} />
                    <input type="hidden" name="externalId" value={recipe.externalId} />
                    <Button type="submit" className="w-full">
                      Save to My Recipes
                    </Button>
                  </form>
                  <form action={importRecipeToWeekAction}>
                    <input type="hidden" name="providerId" value={recipe.providerId} />
                    <input type="hidden" name="externalId" value={recipe.externalId} />
                    <input type="hidden" name="servings" value={recipe.servings ?? ""} />
                    <Button type="submit" variant="outline" className="w-full">
                      <CalendarPlus className="size-4" />
                      Add to Week
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
