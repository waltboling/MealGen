import { FileUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { RecipeImageImportForm } from "@/components/recipes/recipe-image-import-form";
import {
  createRecipeAction,
  importRecipeImageAction
} from "@/features/recipes/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

type CreateRecipePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function CreateRecipePage({
  searchParams
}: CreateRecipePageProps) {
  const params = await searchParams;
  const importError = getString(params.importError);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Recipe"
        description="Add ingredients, instructions, notes, and tags for a recipe your household can plan from."
      />
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileUp className="size-5 text-primary" />
            Start from a photo or PDF
          </CardTitle>
          <CardDescription>
            Upload a handwritten recipe, recipe photo, or multi-page PDF to
            create an editable draft faster.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {importError}
            </div>
          ) : null}
          <RecipeImageImportForm
            action={importRecipeImageAction}
            returnPath="/recipes/new"
          />
          <p className="text-sm text-muted-foreground">
            The imported recipe opens in edit mode so you can review quantities,
            steps, and any handwriting or PDF parsing uncertainty before saving
            it into regular use.
          </p>
        </CardContent>
      </Card>
      <RecipeForm action={createRecipeAction} submitLabel="Save Recipe" />
    </div>
  );
}
