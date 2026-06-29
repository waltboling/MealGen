import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { updateRecipeAction } from "@/features/recipes/actions";
import { RecipeService } from "@/features/recipes/service";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";

type EditRecipePageProps = {
  params: Promise<{
    recipeId: string;
  }>;
};

const recipeService = new RecipeService();

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { recipeId } = await params;
  const context = await getCurrentHouseholdOrRedirect();
  const recipe = await recipeService.getRecipe(context, recipeId);

  if (!recipe) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={`Edit ${recipe.title}`}
        description="Update your saved copy without affecting any original source version."
      />
      <RecipeForm
        action={updateRecipeAction.bind(null, recipe.id)}
        recipe={recipe}
        submitLabel="Save Changes"
      />
    </>
  );
}
