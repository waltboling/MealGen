"use client";

import { useState } from "react";
import type { MealType } from "@/features/meal-planning/types";
import type { MealStrategy } from "@/features/meal-strategies/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GenerateButton, GenerateForm } from "@/components/ui/generate-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type MealStrategyCardProps = {
  strategy: MealStrategy;
  acceptedCount: number;
  isSelected: boolean;
  mealTypes: MealType[];
  weekStartDate: string;
  selectedTasteProfiles: string[];
  updateAction: (formData: FormData) => void;
  deactivateAction: (formData: FormData) => void;
};

function formatMealType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function MealStrategyCard({
  strategy,
  acceptedCount,
  isSelected,
  mealTypes,
  weekStartDate,
  selectedTasteProfiles,
  updateAction,
  deactivateAction
}: MealStrategyCardProps) {
  const [name, setName] = useState(strategy.name);
  const [mealType, setMealType] = useState(strategy.mealType);
  const [weeklyTarget, setWeeklyTarget] = useState(strategy.weeklyTarget);
  const remainingCount = Math.max(0, weeklyTarget - acceptedCount);

  return (
    <div
      className={`space-y-4 rounded-md border p-4 ${
        isSelected ? "border-primary bg-primary/5" : "border-border bg-background"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{name || "Untitled strategy"}</h3>
        <Badge variant="outline">{formatMealType(mealType)}</Badge>
        <Badge>
          {acceptedCount} / {weeklyTarget} this week
        </Badge>
        <span className="text-sm text-muted-foreground">
          {remainingCount > 0
            ? `${remainingCount} more to fill.`
            : "Target met. Generate alternates if you want."}
        </span>
      </div>

      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="mealStrategyId" value={strategy.id} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Label className="space-y-2 text-sm font-medium">
            <span>Name</span>
            <Input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={(event) => setName(event.target.value.trim())}
              required
            />
          </Label>
          <Label className="space-y-2 text-sm font-medium">
            <span>Meal type</span>
            <select
              name="mealType"
              value={mealType}
              onChange={(event) => setMealType(event.target.value as MealType)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {mealTypes.map((type) => (
                <option key={type} value={type}>
                  {formatMealType(type)}
                </option>
              ))}
            </select>
          </Label>
          <Label className="space-y-2 text-sm font-medium">
            <span>Meals wanted this week</span>
            <Input
              name="weeklyTarget"
              type="number"
              min="1"
              max="14"
              value={weeklyTarget}
              onChange={(event) =>
                setWeeklyTarget(
                  Math.min(14, Math.max(1, Number(event.target.value) || 1))
                )
              }
            />
          </Label>
          <Label className="space-y-2 text-sm font-medium">
            <span>Servings</span>
            <Input
              name="defaultServings"
              type="number"
              min="1"
              max="24"
              defaultValue={strategy.defaultServings}
            />
          </Label>
        </div>
        <Label className="space-y-2 text-sm font-medium">
          <span>Prompt</span>
          <Textarea name="prompt" rows={4} defaultValue={strategy.prompt} required />
        </Label>
        <details className="rounded-md border border-border bg-muted/20">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
            Nutrition, source, and ingredient guidance
          </summary>
          <div className="space-y-4 border-t border-border p-3">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Label className="space-y-2 text-sm font-medium">
                <span>Calorie min</span>
                <Input
                  name="calorieMin"
                  type="number"
                  min="1"
                  placeholder="500"
                  defaultValue={strategy.calorieMin ?? ""}
                />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Calorie max</span>
                <Input
                  name="calorieMax"
                  type="number"
                  min="1"
                  placeholder="700"
                  defaultValue={strategy.calorieMax ?? ""}
                />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Protein goal</span>
                <Input
                  name="proteinGoal"
                  type="number"
                  min="1"
                  placeholder="35"
                  defaultValue={strategy.proteinGoal ?? ""}
                />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Max cook time</span>
                <Input
                  name="maxCookTimeMinutes"
                  type="number"
                  min="1"
                  placeholder="40"
                  defaultValue={strategy.maxCookTimeMinutes ?? ""}
                />
              </Label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Label className="space-y-2 text-sm font-medium">
                <span>Preferred proteins</span>
                <Input
                  name="preferredProteins"
                  defaultValue={strategy.preferredProteins.join(", ")}
                  placeholder="chicken, beef, salmon"
                />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Carb bases</span>
                <Input
                  name="preferredBaseCarbs"
                  defaultValue={strategy.preferredBaseCarbs.join(", ")}
                  placeholder="rice, quinoa, potatoes"
                />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Vegetables</span>
                <Input
                  name="vegetables"
                  defaultValue={strategy.vegetables.join(", ")}
                  placeholder="broccoli, peppers, spinach"
                />
              </Label>
              <Label className="space-y-2 text-sm font-medium">
                <span>Avoid</span>
                <Input
                  name="avoidIngredients"
                  defaultValue={strategy.avoidIngredients.join(", ")}
                  placeholder="raw onion, tree nuts"
                />
              </Label>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="sourceTypes"
                  value="ai_generated"
                  defaultChecked={strategy.sourceTypes.includes("ai_generated")}
                  className="size-4 accent-primary"
                />
                AI generated
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="sourceTypes"
                  value="recipe_catalog"
                  defaultChecked={strategy.sourceTypes.includes("recipe_catalog")}
                  className="size-4 accent-primary"
                />
                Recipe catalog
              </label>
            </div>
          </div>
        </details>
        <Button type="submit" variant="outline" size="sm">
          Save Strategy
        </Button>
      </form>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <GenerateForm
          action="/plan-with-ai#review-suggestions"
          method="get"
          className="inline-flex"
        >
          <input type="hidden" name="strategyId" value={strategy.id} />
          <input type="hidden" name="weekStartDate" value={weekStartDate} />
          <input type="hidden" name="generationSeed" value="" />
          {selectedTasteProfiles.map((memberId) => (
            <input
              key={memberId}
              type="hidden"
              name="participantMemberIds"
              value={memberId}
            />
          ))}
          <GenerateButton
            size="sm"
            variant="default"
            idleLabel="Generate Suggestions"
          />
        </GenerateForm>
        <form action={deactivateAction}>
          <input type="hidden" name="mealStrategyId" value={strategy.id} />
          <Button type="submit" variant="outline" size="sm">
            Remove
          </Button>
        </form>
      </div>
    </div>
  );
}
