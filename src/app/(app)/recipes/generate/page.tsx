import Link from "next/link";
import { ChefHat, FileUp, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { saveGeneratedRecipeAction } from "@/features/ai-planning/actions";
import { importRecipeImageAction } from "@/features/recipes/actions";
import { aiPlanningRequestSchema } from "@/features/ai-planning/schemas";
import { AiPlanningService } from "@/features/ai-planning/service";
import { HouseholdService } from "@/features/household/service";
import { GenerateRecipeRequestForm } from "@/components/ai-planning/generate-recipe-request-form";
import { RecipeImageImportForm } from "@/components/recipes/recipe-image-import-form";
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
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";
import { getCurrentWeekStart } from "@/lib/date/week";

type GenerateRecipePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const aiPlanningService = new AiPlanningService();
const householdService = new HouseholdService();

function getString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function ingredientLines(values: Array<{ displayText: string }>) {
  return values.map((ingredient) => ingredient.displayText).join("\n");
}

export default async function GenerateRecipePage({
  searchParams
}: GenerateRecipePageProps) {
  const params = await searchParams;
  const context = await getCurrentHouseholdOrRedirect();
  const weekStartDate = getCurrentWeekStart();
  const [profiles, members] = await Promise.all([
    householdService.listProfiles(context),
    householdService.listMembers(context, weekStartDate)
  ]);
  const prompt = getString(params.prompt);
  const importError = getString(params.importError) || getString(params.imageError);
  const hasPrompt = Boolean(prompt);
  const request = aiPlanningRequestSchema.parse({
    prompt: prompt || "Generate a reliable dinner recipe.",
    sourceTypes: ["ai_generated"],
    generationSeed: getString(params.generationSeed),
    mealType: getString(params.mealType) || "DINNER",
    numberOfMeals: 1,
    weekStartDate,
    participantMemberIds: members.map((member) => member.id),
    servings: getString(params.servings) || "4",
    maxCookTimeMinutes: getString(params.maxCookTimeMinutes),
    calorieTarget: getString(params.calorieTarget),
    proteinGoal: getString(params.proteinGoal),
    preferredProteins: getString(params.preferredProteins),
    preferredBaseCarbs: getString(params.preferredBaseCarbs),
    vegetables: getString(params.vegetables),
    avoidIngredients: getString(params.avoidIngredients),
    useHouseholdPreferences: params.useHouseholdPreferences !== "false",
    usePantryStaples: true,
    useSavedRecipes: false
  });
  let suggestion = null;
  let generationError = null;

  if (hasPrompt) {
    try {
      const result = await aiPlanningService.generateSuggestions(
        request,
        profiles,
        context
      );
      suggestion = result.suggestions[0] ?? null;
    } catch (error) {
      generationError =
        error instanceof Error
          ? error.message
          : "The recipe could not be generated.";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <PageHeader
          title="Generate Recipe"
          description="Create a specific AI recipe, review it, then save it to My Recipes."
        />
        <Button asChild variant="outline">
          <Link href="/recipes">Back to Recipes</Link>
        </Button>
      </div>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ChefHat className="size-6 text-primary" />
            Recipe brief
          </CardTitle>
          <CardDescription>
            Ask for a specific cuisine, dish, nutrition target, or ingredient
            set. The generated recipe will be editable before saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenerateRecipeRequestForm restoreDraft={!hasPrompt}>
            <input type="hidden" name="sourceTypes" value="ai_generated" />
            <input
              type="hidden"
              name="generationSeed"
              value={request.generationSeed ?? ""}
            />
            <input type="hidden" name="numberOfMeals" value="1" />
            <Label className="space-y-2 text-sm font-medium">
              <span>What should the recipe be?</span>
              <Textarea
                name="prompt"
                rows={5}
                defaultValue={prompt}
                placeholder="Generate a reliable Korean beef rice bowl with vegetables, high protein, under 700 calories, for 4 servings."
                required
              />
            </Label>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Label className="space-y-2 text-sm font-medium">
                <span>Servings</span>
                <Input name="servings" type="number" min="1" max="24" defaultValue={request.servings} />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Max cooking time</span>
                <Input name="maxCookTimeMinutes" type="number" min="1" defaultValue={request.maxCookTimeMinutes ?? ""} placeholder="40" />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Calories</span>
                <Input name="calorieTarget" type="number" min="1" defaultValue={request.calorieTarget ?? ""} placeholder="700" />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Protein goal</span>
                <Input name="proteinGoal" type="number" min="1" defaultValue={request.proteinGoal ?? ""} placeholder="45" />
              </Label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Label className="space-y-2 text-sm font-medium">
                <span>Preferred proteins</span>
                <Input name="preferredProteins" defaultValue={request.preferredProteins.join(", ")} placeholder="beef, chicken, tofu" />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Base carbs</span>
                <Input name="preferredBaseCarbs" defaultValue={request.preferredBaseCarbs.join(", ")} placeholder="rice, potatoes, noodles" />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Vegetables</span>
                <Input name="vegetables" defaultValue={request.vegetables.join(", ")} placeholder="broccoli, carrots, spinach" />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Avoid</span>
                <Input name="avoidIngredients" defaultValue={request.avoidIngredients.join(", ")} placeholder="tree nuts, raw onion" />
              </Label>
            </div>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="useHouseholdPreferences"
                value="true"
                defaultChecked={request.useHouseholdPreferences}
                className="size-4 accent-primary"
              />
              Use household preferences and allergies
            </label>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" data-generate-button>
                <Sparkles className="size-4 group-data-[generating=true]:hidden" />
                <Loader2 className="hidden size-4 animate-spin group-data-[generating=true]:block" />
                <span className="group-data-[generating=true]:hidden">
                  Generate Recipe
                </span>
                <span className="hidden group-data-[generating=true]:inline">
                  Generating...
                </span>
              </Button>
              <Button asChild variant="outline">
                <Link href="/recipes/generate">
                  <RotateCcw className="size-4" />
                  Reset
                </Link>
              </Button>
            </div>
          </GenerateRecipeRequestForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileUp className="size-5 text-primary" />
            Import from photo or PDF
          </CardTitle>
          <CardDescription>
            Upload a photo, handwritten recipe, or multi-page PDF. The app will
            extract the recipe text into an editable saved recipe.
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
            returnPath="/recipes/generate"
          />
          <p className="text-sm text-muted-foreground">
            Best results come from a clear, well-lit photo or a readable PDF
            export. Review the imported recipe before cooking.
          </p>
        </CardContent>
      </Card>

      {generationError ? (
        <Card>
          <CardHeader>
            <CardTitle>Recipe could not be generated</CardTitle>
            <CardDescription>{generationError}</CardDescription>
          </CardHeader>
        </Card>
      ) : suggestion ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge>{suggestion.sourceType}</Badge>
              {suggestion.cuisine ? <Badge variant="outline">{suggestion.cuisine}</Badge> : null}
              {suggestion.estimatedCalories ? <Badge variant="outline">~{suggestion.estimatedCalories} cal</Badge> : null}
              {suggestion.estimatedProteinGrams ? <Badge variant="outline">~{suggestion.estimatedProteinGrams}g protein</Badge> : null}
            </div>
            <CardTitle>{suggestion.title}</CardTitle>
            <CardDescription>{suggestion.whyItMatches}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveGeneratedRecipeAction} className="space-y-4">
              <input type="hidden" name="weekStartDate" value={weekStartDate} />
              <input type="hidden" name="plannedForDate" value={weekStartDate} />
              <input type="hidden" name="mealType" value={suggestion.mealType} />
              <input type="hidden" name="sourceType" value={suggestion.sourceType} />
              <input type="hidden" name="whyItMatches" value={suggestion.whyItMatches} />
              <input type="hidden" name="estimatedCalories" value={suggestion.estimatedCalories ?? ""} />
              <input type="hidden" name="estimatedProteinGrams" value={suggestion.estimatedProteinGrams ?? ""} />
              <input type="hidden" name="estimatedCookTimeMinutes" value={suggestion.estimatedCookTimeMinutes ?? ""} />
              <input type="hidden" name="cuisine" value={suggestion.cuisine ?? ""} />
              <input type="hidden" name="nutritionEstimateNote" value={suggestion.nutritionEstimateNote} />
              <input type="hidden" name="tagsText" value={suggestion.tags.join(", ")} />
              {members.map((member) => (
                <input key={member.id} type="hidden" name="participantMemberIds" value={member.id} />
              ))}

              <Label className="space-y-2 text-sm font-medium">
                <span>Title</span>
                <Input name="title" defaultValue={suggestion.title} />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Description</span>
                <Textarea name="shortDescription" defaultValue={suggestion.shortDescription} />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Servings</span>
                <Input name="servings" type="number" min="1" max="24" defaultValue={suggestion.servings} />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Ingredients</span>
                <Textarea name="ingredientsText" rows={7} defaultValue={ingredientLines(suggestion.ingredients)} />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Instructions</span>
                <Textarea name="instructionsText" rows={6} defaultValue={suggestion.instructions.join("\n")} />
              </Label>
              <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                {suggestion.nutritionEstimateNote}
              </div>
              <Button type="submit">Save to My Recipes</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Generate a specific recipe</CardTitle>
            <CardDescription>
              Try asking for a cuisine, dish style, ingredient list, or nutrition target.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
