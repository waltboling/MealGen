"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, CalendarPlus, Search } from "lucide-react";
import { acceptAiMealAction } from "@/features/ai-planning/actions";
import type { AiMealSuggestion } from "@/features/ai-planning/types";
import { addMealToPlanAction } from "@/features/meal-planning/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GenerateButton, GenerateForm } from "@/components/ui/generate-form";
import { cn } from "@/lib/utils";

type QuickAddPath = "week" | "search" | "ai";

type QuickAddRecipeOption = {
  id: string;
  title: string;
};

type QuickAddTodayProps = {
  weekStartDate: string;
  todayKey: string;
  participantMemberIds: string[];
  weeklyRecipeOptions: QuickAddRecipeOption[];
  mealTypes: string[];
  dashboardPrompt: string;
  dashboardMealType: string;
  dashboardServings: string;
  generatedSuggestion: AiMealSuggestion | null;
  generationError: string | null;
};

const pathOptions: Array<{
  id: QuickAddPath;
  label: string;
  description: string;
  icon: typeof CalendarPlus;
}> = [
  {
    id: "week",
    label: "This week",
    description: "Use a meal already planned this week.",
    icon: CalendarPlus
  },
  {
    id: "search",
    label: "Search recipes",
    description: "Look up a saved or provider recipe.",
    icon: Search
  },
  {
    id: "ai",
    label: "Generate idea",
    description: "Ask AI for one editable suggestion.",
    icon: Bot
  }
];

function mealTypeLabel(mealType: string) {
  return mealType
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function linesFromSuggestion(values: string[]) {
  return values.join("\n");
}

function ingredientLines(suggestion: AiMealSuggestion) {
  return suggestion.ingredients
    .map((ingredient) => ingredient.displayText)
    .join("\n");
}

export function QuickAddToday({
  weekStartDate,
  todayKey,
  participantMemberIds,
  weeklyRecipeOptions,
  mealTypes,
  dashboardPrompt,
  dashboardMealType,
  dashboardServings,
  generatedSuggestion,
  generationError
}: QuickAddTodayProps) {
  const [isOpen, setIsOpen] = useState(
    Boolean(dashboardPrompt || generatedSuggestion || generationError)
  );
  const [selectedPath, setSelectedPath] = useState<QuickAddPath>(
    dashboardPrompt || generatedSuggestion || generationError ? "ai" : "week"
  );

  if (!isOpen) {
    return (
      <Button type="button" onClick={() => setIsOpen(true)}>
        Add Meal
      </Button>
    );
  }

  return (
    <section
      id="quick-add-today"
      className="scroll-mt-6 rounded-md border border-border bg-background"
    >
      <div className="flex flex-col justify-between gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
        <div>
          <div className="font-medium">Add a meal for today</div>
          <p className="text-sm text-muted-foreground">
            Choose one path, then complete the focused form.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
          Hide
        </Button>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {pathOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedPath === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedPath(option.id)}
                className={cn(
                  "rounded-md border px-3 py-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-white [&_*]:text-white"
                    : "border-border bg-card hover:border-primary/50"
                )}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4" />
                  {option.label}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        {selectedPath === "week" ? (
          <form
            action={addMealToPlanAction}
            className="rounded-md border border-border bg-card p-4"
          >
            <input type="hidden" name="weekStartDate" value={weekStartDate} />
            <input type="hidden" name="plannedForDate" value={todayKey} />
            <input type="hidden" name="notes" value="Added from dashboard" />
            {participantMemberIds.map((memberId) => (
              <input
                key={memberId}
                type="hidden"
                name="participantMemberIds"
                value={memberId}
              />
            ))}
            <div className="grid gap-3 lg:grid-cols-[1fr_160px_120px_auto] lg:items-end">
              <label className="block space-y-2 text-sm font-medium">
                <span>This week&apos;s meals</span>
                <select
                  name="recipeId"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                  disabled={weeklyRecipeOptions.length === 0}
                  required
                >
                  {weeklyRecipeOptions.length === 0 ? (
                    <option value="">No recipes in this week yet</option>
                  ) : null}
                  {weeklyRecipeOptions.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2 text-sm font-medium">
                <span>Meal</span>
                <select
                  name="mealType"
                  defaultValue="DINNER"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  {mealTypes.map((mealType) => (
                    <option key={mealType} value={mealType}>
                      {mealTypeLabel(mealType)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2 text-sm font-medium">
                <span>Servings</span>
                <input
                  name="servings"
                  type="number"
                  min="1"
                  defaultValue="4"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                />
              </label>
              <Button
                type="submit"
                disabled={
                  weeklyRecipeOptions.length === 0 ||
                  participantMemberIds.length === 0
                }
              >
                Add to Today
              </Button>
            </div>
          </form>
        ) : null}

        {selectedPath === "search" ? (
          <form
            action="/recipes/search"
            className="rounded-md border border-border bg-card p-4"
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block space-y-2 text-sm font-medium">
                <span>Search recipes</span>
                <input
                  name="query"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                  placeholder="chicken salad, tacos, pasta"
                  required
                />
              </label>
              <Button type="submit">Search Recipes</Button>
            </div>
          </form>
        ) : null}

        {selectedPath === "ai" ? (
          <div className="space-y-4 rounded-md border border-border bg-card p-4">
            <GenerateForm action="/dashboard#dashboard-idea" className="space-y-3">
              <input type="hidden" name="generationSeed" value="" />
              <input type="hidden" name="weekStartDate" value={weekStartDate} />
              <div className="grid gap-3 lg:grid-cols-[1fr_160px_120px_auto] lg:items-end">
                <label className="block space-y-2 text-sm font-medium">
                  <span>Generate from prompt</span>
                  <input
                    name="dashboardPrompt"
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                    placeholder="light lunch with chicken and herbs"
                    defaultValue={dashboardPrompt}
                    required
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium">
                  <span>Meal</span>
                  <select
                    name="dashboardMealType"
                    defaultValue={dashboardMealType}
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                  >
                    {mealTypes.map((mealType) => (
                      <option key={mealType} value={mealType}>
                        {mealTypeLabel(mealType)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2 text-sm font-medium">
                  <span>Servings</span>
                  <input
                    name="dashboardServings"
                    type="number"
                    min="1"
                    defaultValue={dashboardServings}
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                  />
                </label>
                <GenerateButton idleLabel="Generate 1 Idea" />
              </div>
            </GenerateForm>

            {generationError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {generationError}
              </div>
            ) : null}

            {generatedSuggestion ? (
              <div
                id="dashboard-idea"
                className="rounded-md border border-primary/30 bg-background p-4"
              >
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{mealTypeLabel(generatedSuggestion.mealType)}</Badge>
                      {generatedSuggestion.estimatedCookTimeMinutes ? (
                        <Badge variant="outline">
                          {generatedSuggestion.estimatedCookTimeMinutes} min
                        </Badge>
                      ) : null}
                      {generatedSuggestion.estimatedCalories ? (
                        <Badge variant="outline">
                          ~{generatedSuggestion.estimatedCalories} cal
                        </Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold">
                      {generatedSuggestion.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {generatedSuggestion.whyItMatches}
                    </p>
                  </div>
                  <GenerateForm action="/dashboard#dashboard-idea">
                    <input type="hidden" name="generationSeed" value="" />
                    <input
                      type="hidden"
                      name="dashboardPrompt"
                      value={dashboardPrompt}
                    />
                    <input
                      type="hidden"
                      name="dashboardMealType"
                      value={dashboardMealType}
                    />
                    <input
                      type="hidden"
                      name="dashboardServings"
                      value={dashboardServings}
                    />
                    <GenerateButton
                      variant="outline"
                      size="sm"
                      idleLabel="Another Option"
                    />
                  </GenerateForm>
                </div>

                <form action={acceptAiMealAction} className="space-y-4">
                  <input type="hidden" name="weekStartDate" value={weekStartDate} />
                  <input type="hidden" name="plannedForDate" value={todayKey} />
                  <input type="hidden" name="returnTo" value="/dashboard" />
                  <input
                    type="hidden"
                    name="suggestionId"
                    value={generatedSuggestion.id}
                  />
                  <input
                    type="hidden"
                    name="sourceType"
                    value={generatedSuggestion.sourceType}
                  />
                  <input
                    type="hidden"
                    name="mealType"
                    value={generatedSuggestion.mealType}
                  />
                  <input
                    type="hidden"
                    name="whyItMatches"
                    value={generatedSuggestion.whyItMatches}
                  />
                  <input
                    type="hidden"
                    name="estimatedCalories"
                    value={generatedSuggestion.estimatedCalories ?? ""}
                  />
                  <input
                    type="hidden"
                    name="estimatedProteinGrams"
                    value={generatedSuggestion.estimatedProteinGrams ?? ""}
                  />
                  <input
                    type="hidden"
                    name="estimatedCookTimeMinutes"
                    value={generatedSuggestion.estimatedCookTimeMinutes ?? ""}
                  />
                  <input
                    type="hidden"
                    name="cuisine"
                    value={generatedSuggestion.cuisine ?? ""}
                  />
                  <input
                    type="hidden"
                    name="nutritionEstimateNote"
                    value={generatedSuggestion.nutritionEstimateNote}
                  />
                  <input
                    type="hidden"
                    name="tagsText"
                    value={generatedSuggestion.tags.join(", ")}
                  />
                  {participantMemberIds.map((memberId) => (
                    <input
                      key={memberId}
                      type="hidden"
                      name="participantMemberIds"
                      value={memberId}
                    />
                  ))}
                  <label className="block space-y-2 text-sm font-medium">
                    <span>Title</span>
                    <input
                      name="title"
                      defaultValue={generatedSuggestion.title}
                      className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                    />
                  </label>
                  <label className="block space-y-2 text-sm font-medium">
                    <span>Description</span>
                    <textarea
                      name="shortDescription"
                      defaultValue={generatedSuggestion.shortDescription}
                      className="min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="grid gap-3 md:grid-cols-[1fr_96px]">
                    <label className="block space-y-2 text-sm font-medium">
                      <span>Ingredients</span>
                      <textarea
                        name="ingredientsText"
                        rows={5}
                        defaultValue={ingredientLines(generatedSuggestion)}
                        className="min-h-28 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block space-y-2 text-sm font-medium">
                      <span>Servings</span>
                      <input
                        name="servings"
                        type="number"
                        min="1"
                        defaultValue={generatedSuggestion.servings}
                        className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                      />
                    </label>
                  </div>
                  <label className="block space-y-2 text-sm font-medium">
                    <span>Instructions</span>
                    <textarea
                      name="instructionsText"
                      rows={4}
                      defaultValue={linesFromSuggestion(
                        generatedSuggestion.instructions
                      )}
                      className="min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit">Add to Today</Button>
                    <Button asChild variant="outline">
                      <Link href="/dashboard">Dismiss</Link>
                    </Button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
