import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { Edit, ExternalLink, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { DeleteRecipeButton } from "@/components/recipes/delete-recipe-button";
import { RecipeService } from "@/features/recipes/service";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";

type RecipeDetailPageProps = {
  params: Promise<{
    recipeId: string;
  }>;
};

const recipeService = new RecipeService();

export default async function RecipeDetailPage({
  params
}: RecipeDetailPageProps) {
  const { recipeId } = await params;
  const context = await getCurrentHouseholdOrRedirect();
  const recipe = await recipeService.getRecipe(context, recipeId);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt=""
              className="aspect-[16/10] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center bg-secondary text-muted-foreground">
              <Utensils className="size-12" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between gap-6">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {recipe.origin === "IMPORTED" ? (
                <Badge variant="outline">Imported source copy</Badge>
              ) : recipe.importedRecipeId ? (
                <Badge variant="outline">Edited imported recipe</Badge>
              ) : null}
              {recipe.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <h1 className="text-4xl font-semibold tracking-normal">
              {recipe.title}
            </h1>
            {recipe.description ? (
              <p className="mt-3 text-lg text-muted-foreground">
                {recipe.description}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-card p-4 text-sm">
            <div>
              <div className="text-muted-foreground">Prep</div>
              <div className="mt-1 font-medium">{recipe.prepMinutes ?? 0} min</div>
            </div>
            <div>
              <div className="text-muted-foreground">Cook</div>
              <div className="mt-1 font-medium">{recipe.cookMinutes ?? 0} min</div>
            </div>
            <div>
              <div className="text-muted-foreground">Serves</div>
              <div className="mt-1 font-medium">{recipe.servings}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/recipes/${recipe.id}/edit` as Route}>
                <Edit className="size-4" />
                Edit
              </Link>
            </Button>
            <DeleteRecipeButton recipeId={recipe.id} />
          </div>

          {recipe.sourceName || recipe.sourceUrl ? (
            <div className="text-sm text-muted-foreground">
              Source:{" "}
              {recipe.sourceUrl ? (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary"
                >
                  {recipe.sourceName || recipe.sourceUrl}
                  <ExternalLink className="size-3" />
                </a>
              ) : (
                <span>{recipe.sourceName}</span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
            <CardDescription>
              {recipe.ingredients.length} items for {recipe.servings} servings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recipe.ingredients.map((ingredient) => (
                <li
                  key={ingredient.id}
                  className="rounded-md border border-border bg-background p-3"
                >
                  <div className="font-medium">{ingredient.displayText}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Grocery key: {ingredient.name}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>
              Cook directly from the saved version of this recipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction) => (
                <li key={instruction.id} className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-medium">
                    {instruction.step}
                  </div>
                  <p className="pt-1 text-sm leading-6">{instruction.text}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>
            Substitutions, timing details, and household feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recipe.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recipe.notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-md border border-border bg-background p-4 text-sm leading-6"
                >
                  {note.text}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
