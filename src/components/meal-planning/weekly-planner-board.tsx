"use client";

import { startTransition, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GripVertical,
  Plus,
  ShoppingCart,
  Trash2,
  Users,
  Utensils,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HouseholdMemberOption } from "@/features/household/types";
import {
  addMealToPlanAction,
  moveMealAction,
  removeMealFromPlanAction
} from "@/features/meal-planning/actions";
import type { MealType, PlannedMeal, WeeklyMealPlan } from "@/features/meal-planning/types";
import type { RecipeListItem } from "@/features/recipes/types";

type WeekDay = {
  dateKey: string;
  label: string;
  dateLabel: string;
};

type WeeklyPlannerBoardProps = {
  weekStartDate: string;
  days: WeekDay[];
  plan: WeeklyMealPlan;
  recipes: RecipeListItem[];
  members: HouseholdMemberOption[];
  currentUserId: string;
};

const mealTypes: MealType[] = [
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACK",
  "MEAL_PREP",
  "OTHER"
];

function mealTypeLabel(mealType: string) {
  return mealType
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function recipeMeta(recipe: RecipeListItem) {
  const time = [recipe.prepMinutes, recipe.cookMinutes]
    .filter((value): value is number => value != null && value > 0)
    .reduce((total, value) => total + value, 0);

  return [
    recipe.sourceName,
    time > 0 ? `${time} min` : null,
    `${recipe.servings} servings`
  ].filter(Boolean);
}

function RecipeThumb({ recipe }: { recipe: RecipeListItem }) {
  return (
    <div
      className="size-14 shrink-0 rounded-md border border-border bg-secondary bg-cover bg-center"
      style={recipe.imageUrl ? { backgroundImage: `url(${recipe.imageUrl})` } : undefined}
      aria-hidden="true"
    />
  );
}

function ParticipantSummary({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <>No named participants</>;
  }

  if (names.length <= 2) {
    return <>{names.join(", ")}</>;
  }

  return (
    <>
      {names.slice(0, 2).join(", ")} +{names.length - 2}
    </>
  );
}

function MealCard({
  meal,
  days,
  currentDayIndex
}: {
  meal: PlannedMeal;
  days: WeekDay[];
  currentDayIndex: number;
}) {
  const previousDay = days[currentDayIndex - 1];
  const nextDay = days[currentDayIndex + 1];
  const currentDate = meal.plannedForDate ?? "";

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", meal.id);
      }}
      className="rounded-md border border-border bg-card p-3 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GripVertical className="size-3" />
            <span className="hidden sm:inline">Drag to move</span>
            <span className="sm:hidden">Move below</span>
            <span aria-hidden="true">·</span>
            {mealTypeLabel(meal.mealType)}
          </div>
          <Link
            href={`/recipes/${meal.recipeId}`}
            className="mt-1 block font-medium leading-snug hover:text-primary"
          >
            {meal.recipeTitle}
          </Link>
        </div>
        <form action={removeMealFromPlanAction.bind(null, meal.id)}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${meal.recipeTitle}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </form>
      </div>

      {meal.notes ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{meal.notes}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline">
          <Utensils className="mr-1 size-3" />
          {meal.servings}
        </Badge>
        <Badge variant="outline">
          <Users className="mr-1 size-3" />
          <ParticipantSummary names={meal.participantNames} />
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <form action={moveMealAction.bind(null, meal.id, previousDay?.dateKey ?? currentDate)}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={!previousDay}
            className="w-full px-2"
            aria-label={`Move ${meal.recipeTitle} to previous day`}
          >
            <ChevronLeft className="size-4" />
          </Button>
        </form>
        <Button asChild variant="outline" size="sm" className="w-full px-2">
          <Link href={`/recipes/${meal.recipeId}`} aria-label={`View ${meal.recipeTitle}`}>
            <ExternalLink className="size-4" />
          </Link>
        </Button>
        <form action={moveMealAction.bind(null, meal.id, nextDay?.dateKey ?? currentDate)}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={!nextDay}
            className="w-full px-2"
            aria-label={`Move ${meal.recipeTitle} to next day`}
          >
            <ChevronRight className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function WeeklyPlannerBoard({
  weekStartDate,
  days,
  plan,
  recipes,
  members,
  currentUserId
}: WeeklyPlannerBoardProps) {
  const router = useRouter();
  const allActiveIds = useMemo(() => members.map((member) => member.id), [members]);
  const firstRecipe = recipes[0];
  const [panelOpen, setPanelOpen] = useState(plan.meals.length === 0);
  const [selectedRecipeId, setSelectedRecipeId] = useState(firstRecipe?.id ?? "");
  const [selectedDay, setSelectedDay] = useState("");
  const [mealType, setMealType] = useState<MealType>("DINNER");
  const [servings, setServings] = useState("4");
  const [notes, setNotes] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>(allActiveIds);
  const [pendingDay, setPendingDay] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const mealsByDay = useMemo(() => {
    return new Map(
      days.map((day) => [
        day.dateKey,
        plan.meals.filter((meal) => meal.plannedForDate === day.dateKey)
      ])
    );
  }, [days, plan.meals]);
  const unscheduledMeals = useMemo(
    () => plan.meals.filter((meal) => !meal.plannedForDate),
    [plan.meals]
  );

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) ?? firstRecipe;
  const plannedCount = plan.meals.length;
  const emptyDayCount = days.filter(
    (day) => (mealsByDay.get(day.dateKey) ?? []).length === 0
  ).length;

  function openAddMeal(dayKey?: string, recipeId?: string) {
    if (dayKey) {
      setSelectedDay(dayKey);
    }

    if (recipeId) {
      setSelectedRecipeId(recipeId);
    }

    setLastAdded(null);
    setPanelOpen(true);
  }

  function applyPreset(preset: "all" | "me" | "partner" | "guests") {
    const me = members.find((member) => member.linkedUserId === currentUserId);
    const linkedProfiles = members.filter(
      (member) => member.profileType === "USER_LINKED"
    );
    const guests = members.filter((member) => member.profileType === "GUEST");

    if (preset === "all") {
      setParticipantIds(allActiveIds);
      return;
    }

    if (preset === "me") {
      setParticipantIds(me ? [me.id] : []);
      return;
    }

    if (preset === "partner") {
      const partner = linkedProfiles.find((member) => member.id !== me?.id);
      setParticipantIds([me?.id, partner?.id].filter(Boolean) as string[]);
      return;
    }

    setParticipantIds(
      Array.from(new Set([...allActiveIds, ...guests.map((guest) => guest.id)]))
    );
  }

  function toggleParticipant(memberId: string) {
    setParticipantIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  }

  async function handleAddMeal(formData: FormData) {
    setIsAdding(true);
    setLastAdded(null);

    try {
      await addMealToPlanAction(formData);
      setNotes("");
      setLastAdded("Meal added. Pick another recipe or day to keep planning.");
      router.refresh();
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{plannedCount} planned</Badge>
              <Badge variant={emptyDayCount > 0 ? "outline" : "secondary"}>
                {emptyDayCount} open {emptyDayCount === 1 ? "day" : "days"}
              </Badge>
            </div>
            <h2 className="mt-3 text-xl font-semibold">Plan this week</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Add meals to the week first, then assign specific days only when
              you want that level of detail.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => openAddMeal()}>
              <Plus className="size-4" />
              Add Meal
            </Button>
            <Button asChild variant="outline">
              <Link href="/recipes">
                <ExternalLink className="size-4" />
                Browse Recipes
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/grocery-lists?week=${weekStartDate}`}>
                <ShoppingCart className="size-4" />
                Open Grocery List
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Quick-add from recipes</h2>
            <p className="text-sm text-muted-foreground">
              Choose a saved recipe, then confirm the meal type and people eating.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {recipes.slice(0, 8).map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => openAddMeal(undefined, recipe.id)}
              className="flex min-h-24 gap-3 rounded-md border border-border bg-card p-3 text-left transition-colors hover:bg-secondary/60"
            >
              <RecipeThumb recipe={recipe} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{recipe.title}</span>
                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {recipeMeta(recipe).join(" · ")}
                </span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <CalendarPlus className="size-3" />
                  Add to week
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {panelOpen ? (
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Add meal</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The panel stays open after adding so you can plan several meals quickly.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setPanelOpen(false)}
              aria-label="Close add meal panel"
            >
              <X className="size-4" />
            </Button>
          </div>

          <form action={handleAddMeal} className="space-y-4">
            <input type="hidden" name="weekStartDate" value={weekStartDate} />

            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <label className="space-y-2 text-sm font-medium">
                  Recipe
                  <select
                    name="recipeId"
                    required
                    value={selectedRecipeId}
                    onChange={(event) => setSelectedRecipeId(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                  >
                    {recipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.title}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedRecipe ? (
                  <div className="flex gap-3 rounded-md border border-border bg-background p-3">
                    <RecipeThumb recipe={selectedRecipe} />
                    <div className="min-w-0">
                      <div className="font-medium">{selectedRecipe.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {recipeMeta(selectedRecipe).join(" · ")}
                      </div>
                      <Button asChild variant="link" className="mt-1 h-auto p-0">
                        <Link href={`/recipes/${selectedRecipe.id}`}>
                          View recipe
                          <ExternalLink className="size-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2 text-sm font-medium">
                    Day
                    <select
                      name="plannedForDate"
                      value={selectedDay}
                      onChange={(event) => setSelectedDay(event.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                    >
                      <option value="">No specific day yet</option>
                      {days.map((day) => (
                        <option key={day.dateKey} value={day.dateKey}>
                          {day.label}, {day.dateLabel}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm font-medium">
                    Meal
                    <select
                      name="mealType"
                      value={mealType}
                      onChange={(event) => setMealType(event.target.value as MealType)}
                      className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                    >
                      {mealTypes.map((type) => (
                        <option key={type} value={type}>
                          {mealTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm font-medium">
                    Servings
                    <input
                      name="servings"
                      type="number"
                      min="1"
                      value={servings}
                      onChange={(event) => setServings(event.target.value)}
                      required
                      className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                    />
                  </label>
                </div>

                <label className="space-y-2 text-sm font-medium">
                  Notes
                  <input
                    name="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                    placeholder="Optional"
                  />
                </label>
              </div>

              <fieldset className="space-y-3 rounded-md border border-border bg-background p-3">
                <div>
                  <legend className="text-sm font-medium">Participants</legend>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Presets keep repeat planning fast.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("all")}
                  >
                    All active
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("me")}
                  >
                    Just me
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("partner")}
                  >
                    Me + partner
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("guests")}
                  >
                    Include guests
                  </Button>
                </div>
                <div className="space-y-2">
                  {members.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          name="participantMemberIds"
                          value={member.id}
                          checked={participantIds.includes(member.id)}
                          onChange={() => toggleParticipant(member.id)}
                          className="size-4"
                        />
                        <span className="truncate">{member.name}</span>
                      </span>
                      {member.profileType === "GUEST" ? (
                        <Badge variant="outline">Guest</Badge>
                      ) : null}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {lastAdded ? (
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
                {lastAdded}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Tip: use recipe cards above or day buttons below to prefill this panel.
              </p>
              <Button type="submit" disabled={isAdding || participantIds.length === 0}>
                <Plus className="size-4" />
                {isAdding ? "Adding..." : "Add to Week"}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {unscheduledMeals.length > 0 ? (
        <section
          onDragOver={(event) => event.preventDefault()}
          className="rounded-lg border border-primary/20 bg-card p-4"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">This week, not assigned to a day</h2>
              <p className="text-sm text-muted-foreground">
                These meals are planned for the week. Drag them onto a day or
                use the move controls when you are ready.
              </p>
            </div>
            <Badge variant="outline">{unscheduledMeals.length}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {unscheduledMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                days={days}
                currentDayIndex={-1}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {days.map((day, dayIndex) => {
          const dayMeals = mealsByDay.get(day.dateKey) ?? [];
          const isPending = pendingDay === day.dateKey;

          return (
            <section
              key={day.dateKey}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const mealId = event.dataTransfer.getData("text/plain");

                if (!mealId) {
                  return;
                }

                setPendingDay(day.dateKey);
                startTransition(async () => {
                  await moveMealAction(mealId, day.dateKey);
                  setPendingDay(null);
                  router.refresh();
                });
              }}
              className="min-h-72 rounded-lg border border-border bg-background p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{day.label}</h2>
                  <p className="text-sm text-muted-foreground">{day.dateLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{dayMeals.length}</Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-2"
                    onClick={() => openAddMeal(day.dateKey)}
                    aria-label={`Add meal to ${day.label}`}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {dayMeals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    days={days}
                    currentDayIndex={dayIndex}
                  />
                ))}
                {dayMeals.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => openAddMeal(day.dateKey)}
                    className="w-full rounded-md border border-dashed border-border p-4 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-card"
                  >
                    <span className="block font-medium text-foreground">Nothing planned</span>
                    <span className="mt-1 block">
                      Add dinner here, or drag a meal from another day.
                    </span>
                  </button>
                ) : null}
                {isPending ? (
                  <div className="text-xs text-muted-foreground">Moving meal...</div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
