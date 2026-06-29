import {
  CalendarPlus,
  Check,
  Sparkles,
  Trash2,
  Users,
  Utensils
} from "lucide-react";
import {
  acceptAiMealAction,
  removeAcceptedAiMealAction
} from "@/features/ai-planning/actions";
import {
  createMealStrategyAction,
  deactivateMealStrategyAction,
  updateMealStrategyAction
} from "@/features/meal-strategies/actions";
import { aiPlanningRequestSchema } from "@/features/ai-planning/schemas";
import { AiPlanningService } from "@/features/ai-planning/service";
import type {
  AiMealSuggestion,
  AiPlanningResult
} from "@/features/ai-planning/types";
import { HouseholdService } from "@/features/household/service";
import { MealPlanningService } from "@/features/meal-planning/service";
import { MealStrategyService } from "@/features/meal-strategies/service";
import { mealTypeSchema } from "@/features/meal-planning/schemas";
import { MealStrategyCard } from "@/components/ai-planning/meal-strategy-card";
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
import { getCurrentWeekStart, getWeekDays } from "@/lib/date/week";

type PlanWithAiPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const aiPlanningService = new AiPlanningService();
const householdService = new HouseholdService();
const mealPlanningService = new MealPlanningService();
const mealStrategyService = new MealStrategyService();
const mealTypes = mealTypeSchema.options;

function getString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function getArray(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function checked(params: Record<string, string | string[] | undefined>, key: string) {
  return params[key] === "true" || params[key] === "on";
}

function linesFromSuggestion(values: string[]) {
  return values.join("\n");
}

function ingredientLines(suggestion: AiMealSuggestion) {
  return suggestion.ingredients
    .map((ingredient) => ingredient.displayText)
    .join("\n");
}

function formatMealType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function buildReturnTo(params: Record<string, string | string[] | undefined>) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (key === "added") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => nextParams.append(key, item));
      return;
    }

    if (value) {
      nextParams.set(key, value);
    }
  });

  const query = nextParams.toString();
  return query
    ? `/plan-with-ai?${query}#review-suggestions`
    : "/plan-with-ai#review-suggestions";
}

function hiddenPlanningInputs(
  params: Record<string, string | string[] | undefined>
) {
  return Object.entries(params)
    .filter(
      ([key]) =>
        ![
          "added",
          "addedMealId",
          "addedSuggestionId",
          "revisionSuggestionId",
          "revisionInstructions",
          "revised",
          "revisionError"
        ].includes(key)
    )
    .flatMap(([key, value]) => {
      if (!value) {
        return [];
      }

      if (Array.isArray(value)) {
        return value.map((item) => ({ key, value: item }));
      }

      return [{ key, value }];
    });
}

function getAddedEntries(params: Record<string, string | string[] | undefined>) {
  const titles = getArray(params.added);
  const mealIds = getArray(params.addedMealId);
  const suggestionIds = getArray(params.addedSuggestionId);

  return mealIds.map((mealId, index) => ({
    mealId,
    title: titles[index] ?? "",
    suggestionId: suggestionIds[index] ?? ""
  }));
}

export default async function PlanWithAiPage({
  searchParams
}: PlanWithAiPageProps) {
  const params = await searchParams;
  const context = await getCurrentHouseholdOrRedirect();
  const weekStartDate = getString(params.weekStartDate) || getCurrentWeekStart();
  const days = getWeekDays(weekStartDate);
  const [members, profiles, strategies, weeklyPlan] = await Promise.all([
    householdService.listMembers(context, weekStartDate),
    householdService.listProfiles(context),
    mealStrategyService.listOrSeed(context),
    mealPlanningService.getOrCreateWeeklyPlan(context, weekStartDate)
  ]);
  const strategyProgress = mealStrategyService.progressForWeek(
    strategies,
    weeklyPlan
  );
  const selectedStrategyId = getString(params.strategyId);
  const selectedStrategyProgress =
    strategyProgress.find((item) => item.strategy.id === selectedStrategyId) ??
    null;
  const selectedStrategy = selectedStrategyProgress?.strategy ?? null;
  const hasPrompt = Boolean(getString(params.prompt) || selectedStrategy);
  const addedTitle = getString(params.added);
  const revisionSuggestionId = getString(params.revisionSuggestionId);
  const revisionInstructions = getString(params.revisionInstructions);
  const returnTo = buildReturnTo(params);
  const addedEntries = getAddedEntries(params);
  const planningHiddenInputs = hiddenPlanningInputs(params);
  const selectedSourceTypes =
    getArray(params.sourceTypes).length > 0
      ? getArray(params.sourceTypes)
      : ["ai_generated"];
  const selectedTasteProfiles =
    getArray(params.participantMemberIds).length > 0
      ? getArray(params.participantMemberIds)
      : members.map((member) => member.id);
  const selectedTasteProfileNames = members
    .filter((member) => selectedTasteProfiles.includes(member.id))
    .map((member) => member.name);
  const request = selectedStrategy
    ? mealStrategyService.buildAiRequest({
        strategy: selectedStrategy,
        profiles: profiles.filter((profile) =>
          selectedTasteProfiles.includes(profile.id)
        ),
        weekStartDate,
        participantMemberIds: selectedTasteProfiles,
        generationSeed: getString(params.generationSeed),
        numberOfMeals:
          selectedStrategyProgress?.remainingCount &&
          selectedStrategyProgress.remainingCount > 0
            ? selectedStrategyProgress.remainingCount
            : selectedStrategy.weeklyTarget
      })
    : aiPlanningRequestSchema.parse({
        prompt:
          getString(params.prompt) ||
          "Plan healthy, protein-heavy meals for this week.",
        sourceTypes: selectedSourceTypes,
        generationSeed: getString(params.generationSeed),
        mealType: getString(params.mealType) || "DINNER",
        numberOfMeals: 5,
        weekStartDate,
        participantMemberIds: selectedTasteProfiles,
        servings: getString(params.servings) || "4",
        maxCookTimeMinutes: getString(params.maxCookTimeMinutes),
        calorieTarget: getString(params.calorieTarget),
        calorieMin: getString(params.calorieMin),
        calorieMax: getString(params.calorieMax),
        proteinGoal: getString(params.proteinGoal),
        preferredProteins: getString(params.preferredProteins),
        preferredBaseCarbs: getString(params.preferredBaseCarbs),
        vegetables: getString(params.vegetables),
        avoidIngredients: getString(params.avoidIngredients),
        useHouseholdPreferences: hasPrompt
          ? checked(params, "useHouseholdPreferences")
          : true,
        usePantryStaples: hasPrompt ? checked(params, "usePantryStaples") : true,
        useSavedRecipes: hasPrompt ? checked(params, "useSavedRecipes") : true
      });
  let result: AiPlanningResult | null = null;
  let generationError: string | null = null;
  let revisionError = getString(params.revisionError) || null;

  if (hasPrompt) {
    try {
      result = await aiPlanningService.generateSuggestions(
        request,
        profiles,
        context
      );
    } catch (error) {
      generationError =
        error instanceof Error
          ? error.message
          : "Meal suggestions could not be generated.";
    }
  }

  if (result && revisionSuggestionId && revisionInstructions) {
    const suggestionIndex = result.suggestions.findIndex(
      (suggestion) => suggestion.id === revisionSuggestionId
    );

    if (suggestionIndex >= 0) {
      try {
        const revisedSuggestion = await aiPlanningService.reviseSuggestion(
          request,
          profiles,
          context,
          result.suggestions[suggestionIndex],
          revisionInstructions
        );

        result = {
          ...result,
          warnings: [...result.warnings],
          suggestions: result.suggestions.map((suggestion, index) =>
            index === suggestionIndex ? revisedSuggestion : suggestion
          )
        };
      } catch (error) {
        revisionError =
          error instanceof Error
            ? error.message
            : "The recipe could not be revised.";
      }
    } else {
      revisionError = "The recipe to revise was not found in these suggestions.";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <PageHeader
          title="Household meal strategy"
          description="Use household meal strategies to generate flexible options for the week."
        />
      </div>

      {params.strategyCreated ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Meal strategy saved.
        </div>
      ) : null}

      {params.strategyUpdated ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Meal strategy updated.
        </div>
      ) : null}

      <Card id="meal-strategies" className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Utensils className="size-6 text-primary" />
            Weekly meal strategies
          </CardTitle>
          <CardDescription>
            Set the meal buckets you want for the week, then generate options
            for each one. Suggestions use household taste profiles by default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4" />
              Include taste profiles
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Currently using{" "}
              {selectedTasteProfileNames.length > 0
                ? selectedTasteProfileNames.join(", ")
                : "all household profiles"}
              . These shape suggestions without assigning meals to specific
              people yet.
            </p>
          </div>

          <div className="grid gap-4">
            {strategyProgress.map(({ strategy, acceptedCount }) => (
              <MealStrategyCard
                key={strategy.id}
                strategy={strategy}
                acceptedCount={acceptedCount}
                isSelected={selectedStrategy?.id === strategy.id}
                mealTypes={mealTypes}
                weekStartDate={weekStartDate}
                selectedTasteProfiles={selectedTasteProfiles}
                updateAction={updateMealStrategyAction}
                deactivateAction={deactivateMealStrategyAction}
              />
            ))}
          </div>

          <details className="rounded-md border border-border bg-background">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Add another strategy
            </summary>
            <form
              action={createMealStrategyAction}
              className="grid gap-4 border-t border-border p-4"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Label className="space-y-2 text-sm font-medium">
                  <span>Name</span>
                  <Input name="name" placeholder="Quick weeknight meals" required />
                </Label>
                <Label className="space-y-2 text-sm font-medium">
                  <span>Meal type</span>
                  <select
                    name="mealType"
                    defaultValue="DINNER"
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                  >
                    {mealTypes.map((mealType) => (
                      <option key={mealType} value={mealType}>
                        {formatMealType(mealType)}
                      </option>
                    ))}
                  </select>
                </Label>
                <Label className="space-y-2 text-sm font-medium">
                  <span>Weekly target</span>
                  <Input name="weeklyTarget" type="number" min="1" max="14" defaultValue="5" />
                </Label>
                <Label className="space-y-2 text-sm font-medium">
                  <span>Servings</span>
                  <Input name="defaultServings" type="number" min="1" max="24" defaultValue="4" />
                </Label>
              </div>
              <Label className="space-y-2 text-sm font-medium">
                <span>Strategy guidance</span>
                <Textarea
                  name="prompt"
                  rows={3}
                  placeholder="500-700 calorie protein-focused lunches with a healthy carb base, preferred protein, and vegetable side."
                  required
                />
              </Label>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Label className="space-y-2 text-sm font-medium">
                  <span>Calorie min</span>
                  <Input name="calorieMin" type="number" min="1" placeholder="500" />
                </Label>
                <Label className="space-y-2 text-sm font-medium">
                  <span>Calorie max</span>
                  <Input name="calorieMax" type="number" min="1" placeholder="700" />
                </Label>
                <Label className="space-y-2 text-sm font-medium">
                  <span>Protein goal</span>
                  <Input name="proteinGoal" type="number" min="1" placeholder="35" />
                </Label>
                <Label className="space-y-2 text-sm font-medium">
                  <span>Max cook time</span>
                  <Input name="maxCookTimeMinutes" type="number" min="1" placeholder="40" />
                </Label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="space-y-2 text-sm font-medium">
                  <span>Preferred proteins</span>
                  <Input name="preferredProteins" placeholder="chicken, beef, salmon" />
                </Label>
                <Label className="space-y-2 text-sm font-medium">
                  <span>Carb bases</span>
                  <Input name="preferredBaseCarbs" placeholder="rice, quinoa, potatoes" />
                </Label>
                <Label className="space-y-2 text-sm font-medium">
                  <span>Vegetables</span>
                  <Input name="vegetables" placeholder="broccoli, peppers, spinach" />
                </Label>
                <Label className="space-y-2 text-sm font-medium">
                  <span>Avoid</span>
                  <Input name="avoidIngredients" placeholder="raw onion, tree nuts" />
                </Label>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="sourceTypes"
                    value="ai_generated"
                    defaultChecked
                    className="size-4 accent-primary"
                  />
                  AI generated
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="sourceTypes"
                    value="recipe_catalog"
                    className="size-4 accent-primary"
                  />
                  Recipe catalog
                </label>
              </div>
              <Button type="submit" className="w-fit">Save Strategy</Button>
            </form>
          </details>
        </CardContent>
      </Card>

      {addedTitle ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {addedTitle} was added to this week. You can keep adding suggestions
          here or change the details before accepting another meal.
        </div>
      ) : null}

      {revisionInstructions && !revisionError ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Updated the suggestion using: {revisionInstructions}
        </div>
      ) : null}

      {revisionError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {revisionError}
        </div>
      ) : null}

      {result ? (
        <section
          id="review-suggestions"
          className="scroll-mt-6 space-y-4 rounded-lg border border-primary/20 bg-card p-4"
        >
          <div>
            <h2 className="text-2xl font-semibold">Review suggestions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedStrategy
                ? `Generated for ${selectedStrategy.name}. Accepting adds meals to this week and counts toward that strategy.`
                : "Edit anything you want. Accepting creates a saved recipe and adds it to this week without requiring a day assignment."}
            </p>
          </div>
          {result.warnings.length > 0 ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {result.warnings.join(" ")}
            </div>
          ) : null}
          <div className="grid gap-5 xl:grid-cols-2">
            {result.suggestions.map((suggestion) => (
              (() => {
                const addedEntry = addedEntries.find(
                  (entry) =>
                    entry.suggestionId === suggestion.id ||
                    entry.title === suggestion.title
                );

                return (
              <Card key={suggestion.id}>
                <CardHeader>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{suggestion.sourceType}</Badge>
                    {suggestion.estimatedCookTimeMinutes ? (
                      <Badge variant="outline">{suggestion.estimatedCookTimeMinutes} min</Badge>
                    ) : null}
                    {suggestion.estimatedCalories ? (
                      <Badge variant="outline">~{suggestion.estimatedCalories} cal</Badge>
                    ) : null}
                    {suggestion.estimatedProteinGrams ? (
                      <Badge variant="outline">~{suggestion.estimatedProteinGrams}g protein</Badge>
                    ) : null}
                  </div>
                  <CardTitle>{suggestion.title}</CardTitle>
                  <CardDescription>{suggestion.whyItMatches}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={acceptAiMealAction} className="space-y-4">
                    <input type="hidden" name="weekStartDate" value={weekStartDate} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <input
                      type="hidden"
                      name="mealStrategyId"
                      value={selectedStrategy?.id ?? ""}
                    />
                    <input type="hidden" name="suggestionId" value={suggestion.id} />
                    <input type="hidden" name="sourceType" value={suggestion.sourceType} />
                    <input type="hidden" name="whyItMatches" value={suggestion.whyItMatches} />
                    <input type="hidden" name="estimatedCalories" value={suggestion.estimatedCalories ?? ""} />
                    <input type="hidden" name="estimatedProteinGrams" value={suggestion.estimatedProteinGrams ?? ""} />
                    <input type="hidden" name="cuisine" value={suggestion.cuisine ?? ""} />
                    <input type="hidden" name="nutritionEstimateNote" value={suggestion.nutritionEstimateNote} />
                    <input type="hidden" name="tagsText" value={suggestion.tags.join(", ")} />
                    {selectedTasteProfiles.map((memberId) => (
                      <input
                        key={memberId}
                        type="hidden"
                        name="participantMemberIds"
                        value={memberId}
                      />
                    ))}

                    <Label className="space-y-2 text-sm font-medium">
                      <span>Title</span>
                      <Input name="title" defaultValue={suggestion.title} />
                    </Label>
                    <Label className="space-y-2 text-sm font-medium">
                      <span>Description</span>
                      <Textarea name="shortDescription" defaultValue={suggestion.shortDescription} />
                    </Label>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Label className="space-y-2 text-sm font-medium">
                        <span>Day</span>
                        <select
                          name="plannedForDate"
                          defaultValue=""
                          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                        >
                          <option value="">No specific day yet</option>
                          {days.map((day) => (
                            <option key={day.dateKey} value={day.dateKey}>
                              {day.label} {day.dateLabel}
                            </option>
                          ))}
                        </select>
                      </Label>
                      <Label className="space-y-2 text-sm font-medium">
                        <span>Meal type</span>
                        <select
                          name="mealType"
                          defaultValue={suggestion.mealType}
                          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                        >
                          {mealTypes.map((mealType) => (
                            <option key={mealType} value={mealType}>
                              {formatMealType(mealType)}
                            </option>
                          ))}
                        </select>
                      </Label>
                      <Label className="space-y-2 text-sm font-medium">
                        <span>Servings</span>
                        <Input name="servings" type="number" min="1" defaultValue={suggestion.servings} />
                      </Label>
                    </div>
                    <input type="hidden" name="estimatedCookTimeMinutes" value={suggestion.estimatedCookTimeMinutes ?? ""} />
                    <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      Taste profiles used:{" "}
                      {selectedTasteProfileNames.length > 0
                        ? selectedTasteProfileNames.join(", ")
                        : "none selected"}
                    </div>
                    <Label className="space-y-2 text-sm font-medium">
                      <span>Ingredients</span>
                      <Textarea name="ingredientsText" rows={6} defaultValue={ingredientLines(suggestion)} />
                    </Label>
                    <Label className="space-y-2 text-sm font-medium">
                      <span>Instructions</span>
                      <Textarea name="instructionsText" rows={5} defaultValue={linesFromSuggestion(suggestion.instructions)} />
                    </Label>
                    {suggestion.matchedHouseholdPreferences.length > 0 ? (
                      <div className="flex flex-wrap gap-2 text-sm">
                        {suggestion.matchedHouseholdPreferences.map((preference) => (
                          <Badge key={preference} variant="outline">
                            {preference}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    {addedEntry ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="gap-1 bg-emerald-700 text-white">
                          <Check className="size-3" />
                          Added to week
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit">
                          <CalendarPlus className="size-4" />
                          Save and Add to Week
                        </Button>
                        <Button type="button" variant="outline">
                          Reject
                        </Button>
                      </div>
                    )}
                  </form>
                  {!addedEntry ? (
                    <form
                      action="/plan-with-ai#review-suggestions"
                      method="get"
                      className="mt-4 space-y-3 rounded-md border border-border bg-muted/30 p-3"
                    >
                      {planningHiddenInputs.map((input, index) => (
                        <input
                          key={`${input.key}-${input.value}-${index}`}
                          type="hidden"
                          name={input.key}
                          value={input.value}
                        />
                      ))}
                      <input
                        type="hidden"
                        name="revisionSuggestionId"
                        value={suggestion.id}
                      />
                      <Label className="space-y-2 text-sm font-medium">
                        <span>Request a change to this recipe</span>
                        <Textarea
                          name="revisionInstructions"
                          rows={3}
                          placeholder="Keep the coastal Italian feel, but make it chicken instead of seafood and use farro instead of risotto rice."
                          required
                        />
                      </Label>
                      <Button type="submit" variant="outline" size="sm">
                        <Sparkles className="size-4" />
                        Update This Suggestion
                      </Button>
                    </form>
                  ) : null}
                  {addedEntry ? (
                    <form action={removeAcceptedAiMealAction} className="mt-3">
                      <input
                        type="hidden"
                        name="mealPlanMealId"
                        value={addedEntry.mealId}
                      />
                      <input
                        type="hidden"
                        name="weekStartDate"
                        value={weekStartDate}
                      />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <Button type="submit" variant="outline" size="sm">
                        <Trash2 className="size-4" />
                        Remove from Week
                      </Button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
                );
              })()
            ))}
          </div>
        </section>
      ) : generationError ? (
        <Card>
          <CardHeader>
            <CardTitle>Suggestions could not be generated</CardTitle>
            <CardDescription>{generationError}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Adjust a strategy above and generate suggestions again.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
