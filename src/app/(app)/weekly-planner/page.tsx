import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  ShoppingCart,
  Sparkles,
  Trash2,
  Users,
  Utensils
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { HouseholdService } from "@/features/household/service";
import { groupMealsByPerson } from "@/features/meal-planning/group-meals-by-person";
import {
  addMealToPlanAction,
  moveMealAction,
  removeMealFromPlanAction
} from "@/features/meal-planning/actions";
import type {
  MealType,
  PlannedMeal,
  WeeklyMealPlan
} from "@/features/meal-planning/types";
import { MealPlanningService } from "@/features/meal-planning/service";
import { RecipeService } from "@/features/recipes/service";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";
import { addDays, getCurrentWeekStart, getWeekDays } from "@/lib/date/week";

type WeeklyPlannerPageProps = {
  searchParams: Promise<{
    week?: string;
    view?: string;
    action?: string;
  }>;
};

const mealPlanningService = new MealPlanningService();
const recipeService = new RecipeService();
const householdService = new HouseholdService();
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

function formatWeekRange(days: ReturnType<typeof getWeekDays>) {
  const first = days[0];
  const last = days[days.length - 1];

  return `${first.dateLabel} - ${last.dateLabel}`;
}

function weekStatus(weekStartDate: string) {
  const current = getCurrentWeekStart();

  if (weekStartDate === current) {
    return "Current";
  }

  return weekStartDate < current ? "Past" : "Future";
}

function dayName(days: ReturnType<typeof getWeekDays>, dateKey: string | null) {
  if (!dateKey) {
    return "Unassigned";
  }

  const day = days.find((item) => item.dateKey === dateKey);
  return day ? `${day.label}, ${day.dateLabel}` : dateKey;
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

function MealListCard({
  meal,
  days
}: {
  meal: PlannedMeal;
  days: ReturnType<typeof getWeekDays>;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge>{mealTypeLabel(meal.mealType)}</Badge>
            <Badge variant="outline">{dayName(days, meal.plannedForDate)}</Badge>
            <Badge variant="outline">
              <Utensils className="mr-1 size-3" />
              {meal.servings}
            </Badge>
            <Badge variant="outline">
              <Users className="mr-1 size-3" />
              <ParticipantSummary names={meal.participantNames} />
            </Badge>
          </div>
          <Link
            href={`/recipes/${meal.recipeId}`}
            className="mt-3 block text-lg font-semibold leading-snug hover:text-primary"
          >
            {meal.recipeTitle}
          </Link>
          {meal.notes ? (
            <p className="mt-1 text-sm text-muted-foreground">{meal.notes}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/recipes/${meal.recipeId}`}>
              <ExternalLink className="size-4" />
              View
            </Link>
          </Button>
          <form action={removeMealFromPlanAction.bind(null, meal.id)}>
            <Button type="submit" variant="outline" size="sm">
              <Trash2 className="size-4" />
              Remove
            </Button>
          </form>
        </div>
      </div>

      <form
        action={async (formData: FormData) => {
          "use server";
          const plannedForDate = String(formData.get("plannedForDate") ?? "");

          if (plannedForDate) {
            await moveMealAction(meal.id, plannedForDate);
          }
        }}
        className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <Label className="flex-1 space-y-2 text-sm font-medium">
          <span>Assign to day</span>
          <select
            name="plannedForDate"
            defaultValue={meal.plannedForDate ?? ""}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="">Choose a day</option>
            {days.map((day) => (
              <option key={day.dateKey} value={day.dateKey}>
                {day.label}, {day.dateLabel}
              </option>
            ))}
          </select>
        </Label>
        <Button type="submit" variant="outline">
          Save Day
        </Button>
      </form>
    </div>
  );
}

function AddFromRecipesSection({
  weekStartDate,
  days,
  recipes,
  members
}: {
  weekStartDate: string;
  days: ReturnType<typeof getWeekDays>;
  recipes: Awaited<ReturnType<RecipeService["listRecipes"]>>;
  members: Awaited<ReturnType<HouseholdService["listMembers"]>>;
}) {
  return (
    <Card id="add-from-recipes" className="border-primary/30">
      <CardHeader>
        <CardTitle>Add from recipes</CardTitle>
        <CardDescription>
          Add a saved recipe to this week. Day assignment is optional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={addMealToPlanAction} className="space-y-4">
          <input type="hidden" name="weekStartDate" value={weekStartDate} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Label className="space-y-2 text-sm font-medium">
              <span>Recipe</span>
              <select
                name="recipeId"
                required
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.title}
                  </option>
                ))}
              </select>
            </Label>
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
                    {day.label}, {day.dateLabel}
                  </option>
                ))}
              </select>
            </Label>
            <Label className="space-y-2 text-sm font-medium">
              <span>Meal type</span>
              <select
                name="mealType"
                defaultValue="DINNER"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                {mealTypes.map((type) => (
                  <option key={type} value={type}>
                    {mealTypeLabel(type)}
                  </option>
                ))}
              </select>
            </Label>
            <Label className="space-y-2 text-sm font-medium">
              <span>Servings</span>
              <input
                name="servings"
                type="number"
                min="1"
                defaultValue="4"
                required
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </Label>
          </div>
          <Label className="space-y-2 text-sm font-medium">
            <span>Notes</span>
            <input
              name="notes"
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              placeholder="Optional"
            />
          </Label>
          <fieldset className="space-y-3 rounded-md border border-border bg-background p-3">
            <legend className="px-1 text-sm font-medium">Participants</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="participantMemberIds"
                    value={member.id}
                    defaultChecked
                    className="size-4"
                  />
                  <span className="min-w-0 flex-1 truncate">{member.name}</span>
                  {member.profileType === "GUEST" ? (
                    <Badge variant="outline">Guest</Badge>
                  ) : null}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit">
            <Plus className="size-4" />
            Add to Week
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ThisWeeksMealsSection({
  plan,
  days
}: {
  plan: WeeklyMealPlan;
  days: ReturnType<typeof getWeekDays>;
}) {
  const sortedMeals = [...plan.meals].sort((first, second) => {
    const firstDate = first.plannedForDate ?? "9999-99-99";
    const secondDate = second.plannedForDate ?? "9999-99-99";
    const dateCompare = firstDate.localeCompare(secondDate);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return first.mealType.localeCompare(second.mealType);
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">This week&apos;s meals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything selected for the week, whether or not it has a specific day.
          </p>
        </div>
        <Badge variant="outline">{plan.meals.length} meals</Badge>
      </div>
      {sortedMeals.length > 0 ? (
        <div className="grid gap-3">
          {sortedMeals.map((meal) => (
            <MealListCard key={meal.id} meal={meal} days={days} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No meals selected yet</CardTitle>
            <CardDescription>
              Generate suggestions with AI or add something from your saved recipes.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  );
}

function CalendarViewSection({
  plan,
  days
}: {
  plan: WeeklyMealPlan;
  days: ReturnType<typeof getWeekDays>;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div>
        <h2 className="text-xl font-semibold">Calendar view</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Meals assigned to days. Unassigned meals stay in the main weekly list.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {days.map((day) => {
          const meals = plan.meals.filter(
            (meal) => meal.plannedForDate === day.dateKey
          );

          return (
            <div
              key={day.dateKey}
              className="min-h-36 rounded-md border border-border bg-background p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">{day.label}</div>
                  <div className="text-sm text-muted-foreground">{day.dateLabel}</div>
                </div>
                <Badge variant="outline">{meals.length}</Badge>
              </div>
              <div className="space-y-2">
                {meals.map((meal) => (
                  <Link
                    key={meal.id}
                    href={`/recipes/${meal.recipeId}`}
                    className="block rounded-md border border-border bg-card px-3 py-2 text-sm hover:border-primary/40"
                  >
                    <span className="block font-medium">{meal.recipeTitle}</span>
                    <span className="text-xs text-muted-foreground">
                      {mealTypeLabel(meal.mealType)}
                    </span>
                  </Link>
                ))}
                {meals.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                    No assigned meals
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MealsByPersonSection({
  plan,
  days,
  profiles
}: {
  plan: Awaited<ReturnType<MealPlanningService["getOrCreateWeeklyPlan"]>>;
  days: ReturnType<typeof getWeekDays>;
  profiles: Awaited<ReturnType<HouseholdService["listProfiles"]>>;
}) {
  const groups = groupMealsByPerson(
    plan.meals,
    profiles,
    days.map((day) => day.dateKey)
  );
  const dayLabel = new Map(days.map((day) => [day.dateKey, day.label.slice(0, 3)]));

  return (
    <section className="space-y-5 rounded-lg border border-border bg-card p-5">
      <div>
        <h2 className="text-xl font-semibold">Meals by Person</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Check who is covered this week, where guests are included, and where someone may be missing.
        </p>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.profileId ?? "unnamed"} className="rounded-md border border-border bg-background p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{group.name}</h3>
              {group.profileType === "GUEST" ? <Badge variant="outline">Guest</Badge> : null}
              {!group.active ? <Badge variant="outline">Inactive</Badge> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {group.mealsByDay.map((day) => (
                <div key={day.dateKey} className="min-h-24 rounded-md border border-border bg-card p-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    {dayLabel.get(day.dateKey)}
                  </div>
                  <div className="mt-2 space-y-1">
                    {day.meals.map((meal) => (
                      <Link
                        key={meal.id}
                        href={`/recipes/${meal.recipeId}`}
                        className="block rounded-sm text-sm leading-5 hover:text-primary"
                      >
                        {meal.recipeTitle}
                      </Link>
                    ))}
                    {day.meals.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No meal</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function WeeklyPlannerPage({
  searchParams
}: WeeklyPlannerPageProps) {
  const params = await searchParams;
  const weekStartDate = params.week ?? getCurrentWeekStart();
  const activeView = params.view === "calendar" || params.view === "people"
    ? params.view
    : "none";
  const showAddFromRecipes = params.action === "add";
  const days = getWeekDays(weekStartDate);
  const context = await getCurrentHouseholdOrRedirect();
  const [plan, recipes, members, profiles] = await Promise.all([
    mealPlanningService.getOrCreateWeeklyPlan(context, weekStartDate),
    recipeService.listRecipes(context),
    householdService.listMembers(context, weekStartDate),
    householdService.listProfiles(context)
  ]);

  const previousWeek = addDays(weekStartDate, -7);
  const nextWeek = addDays(weekStartDate, 7);
  const status = weekStatus(weekStartDate);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <PageHeader
            title="Weekly Planner"
            description="Choose the meals for the week first. Assign days or people only when it helps."
          />
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/plan-with-ai?weekStartDate=${weekStartDate}`}>
                <Sparkles className="size-4" />
                Generate Meal from AI
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/weekly-planner?week=${weekStartDate}&action=add#add-from-recipes`}>
                <Plus className="size-4" />
                Add from Recipes
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

        <Card>
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold">
                  Week of {formatWeekRange(days)}
                </h2>
                <Badge
                  variant={status === "Current" ? "secondary" : "outline"}
                >
                  {status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {weekStartDate}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/weekly-planner?week=${previousWeek}`}>
                  <ChevronLeft className="size-4" />
                  Previous
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/weekly-planner?week=${nextWeek}`}>
                  Next
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant={activeView === "none" ? "secondary" : "outline"}
          >
            <Link href={`/weekly-planner?week=${weekStartDate}`}>
              This Week&apos;s Meals
            </Link>
          </Button>
          <Button
            asChild
            variant={activeView === "calendar" ? "secondary" : "outline"}
          >
            <Link href={`/weekly-planner?week=${weekStartDate}&view=calendar`}>
              <CalendarDays className="size-4" />
              Calendar
            </Link>
          </Button>
          <Button
            asChild
            variant={activeView === "people" ? "secondary" : "outline"}
          >
            <Link href={`/weekly-planner?week=${weekStartDate}&view=people`}>
              <Users className="size-4" />
              Meals by Person
            </Link>
          </Button>
        </div>
      </div>

      {showAddFromRecipes && recipes.length > 0 ? (
        <AddFromRecipesSection
          weekStartDate={weekStartDate}
          days={days}
          recipes={recipes}
          members={members}
        />
      ) : null}

      {recipes.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Add recipes first</h2>
          <p className="mt-2 text-muted-foreground">
            The planner uses your saved recipe library. Create a recipe, then
            come back to plan the week.
          </p>
          <Button asChild className="mt-4">
            <Link href="/recipes/new">Create Recipe</Link>
          </Button>
        </div>
      ) : null}

      <ThisWeeksMealsSection plan={plan} days={days} />

      {activeView === "calendar" ? (
        <CalendarViewSection plan={plan} days={days} />
      ) : null}

      {activeView === "people" ? (
        <MealsByPersonSection plan={plan} days={days} profiles={profiles} />
      ) : null}
    </div>
  );
}
