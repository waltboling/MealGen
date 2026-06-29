import Link from "next/link";
import type { Route } from "next";
import { Bot, CalendarPlus, Clock, Eye, NotebookPen, Plus, Search, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { addRecipeToWeekAction } from "@/features/recipes/actions";
import { RecipeService } from "@/features/recipes/service";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";

const recipeService = new RecipeService();

export default async function RecipeLibraryPage() {
  const context = await getCurrentHouseholdOrRedirect();
  const recipes = await recipeService.listRecipes(context);

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <PageHeader
          title="Recipe Library"
          description="Your saved recipes, cooking notes, tags, ingredients, and instructions."
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/recipes/generate">
              <Bot className="size-4" />
              Generate Recipe
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/recipes/search">
              <Search className="size-4" />
              Find Recipes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/recipes/new">
              <Plus className="size-4" />
              New Recipe
            </Link>
          </Button>
        </div>
      </div>

      {recipes.length === 0 ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>No recipes yet</CardTitle>
            <CardDescription>
              Add a dependable weeknight dinner or a family favorite to start
              building the library.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/recipes/new">Create your first recipe</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="group flex h-full flex-col overflow-hidden transition-colors hover:border-primary/50"
            >
              <Link href={`/recipes/${recipe.id}` as Route} className="block">
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
              </Link>
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  {recipe.origin === "IMPORTED" ? (
                    <Badge variant="outline">Imported</Badge>
                  ) : null}
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
                <CardTitle className="text-xl">
                  <Link
                    href={`/recipes/${recipe.id}` as Route}
                    className="hover:text-primary"
                  >
                    {recipe.title}
                  </Link>
                </CardTitle>
                <CardDescription>{recipe.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {(recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)} min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Utensils className="size-4" />
                    {recipe.servings} servings
                  </span>
                  <span className="flex items-center gap-1.5">
                    <NotebookPen className="size-4" />
                    {recipe.noteCount} notes
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <form action={addRecipeToWeekAction}>
                    <input type="hidden" name="recipeId" value={recipe.id} />
                    <input type="hidden" name="servings" value={recipe.servings} />
                    <Button type="submit" variant="outline" className="w-full">
                      <CalendarPlus className="size-4" />
                      Add to Week
                    </Button>
                  </form>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/recipes/${recipe.id}` as Route}>
                      <Eye className="size-4" />
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
