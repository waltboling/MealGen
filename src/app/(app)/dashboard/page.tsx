import Link from "next/link";
import type { Route } from "next";
import {
  CalendarDays,
  ChefHat,
  ClipboardList,
  NotebookTabs,
  ShoppingBasket,
  Sparkles,
  Utensils
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickAddToday } from "@/components/dashboard/quick-add-today";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { aiPlanningRequestSchema } from "@/features/ai-planning/schemas";
import { AiPlanningService } from "@/features/ai-planning/service";
import type { AiMealSuggestion } from "@/features/ai-planning/types";
import { regenerateGroceryListAction } from "@/features/grocery-lists/actions";
import { GroceryListService } from "@/features/grocery-lists/service";
import type { GroceryListItemView } from "@/features/grocery-lists/types";
import { MealPlanningService } from "@/features/meal-planning/service";
import type { PlannedMeal } from "@/features/meal-planning/types";
import { mealTypeSchema } from "@/features/meal-planning/schemas";
import { HouseholdService } from "@/features/household/service";
import { RecipeService } from "@/features/recipes/service";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";
import { getCurrentWeekStart, getWeekDays, toDateKey } from "@/lib/date/week";

const mealPlanningService = new MealPlanningService();
const groceryListService = new GroceryListService();
const householdService = new HouseholdService();
const recipeService = new RecipeService();
const aiPlanningService = new AiPlanningService();
const mealTypes = mealTypeSchema.options;

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function mealTypeLabel(mealType: string) {
  return mealType
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function formatWeekRange(weekStartDate: string) {
  const days = getWeekDays(weekStartDate);
  return `${days[0].dateLabel} - ${days[6].dateLabel}`;
}

function formatQuantity(item: GroceryListItemView) {
  if (item.quantity == null) {
    return "";
  }

  return `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`;
}

function mealHref(recipeId: string) {
  return `/recipes/${recipeId}` as Route;
}

function getString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function MealLink({ meal }: { meal: PlannedMeal }) {
  return (
    <Link
      href={mealHref(meal.recipeId)}
      className="group block rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            {mealTypeLabel(meal.mealType)}
          </div>
          <div className="mt-1 font-medium leading-snug group-hover:text-primary">
            {meal.recipeTitle}
          </div>
        </div>
        <Badge variant="outline">{meal.servings}</Badge>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {meal.participantNames.length > 0
          ? meal.participantNames.join(", ")
          : "No participants selected"}
      </div>
    </Link>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const context = await getCurrentHouseholdOrRedirect();
  const weekStartDate = getCurrentWeekStart();
  const todayKey = toDateKey(new Date());
  const dashboardPrompt = getString(params.dashboardPrompt);
  const dashboardMealType = getString(params.dashboardMealType) || "DINNER";
  const dashboardServings = getString(params.dashboardServings) || "4";
  const days = getWeekDays(weekStartDate);
  const plan = await mealPlanningService.getOrCreateWeeklyPlan(
    context,
    weekStartDate
  );
  const [groceryList, members, savedRecipes] = await Promise.all([
    groceryListService.regenerateForWeek(context, weekStartDate),
    householdService.listMembers(context, weekStartDate),
    recipeService.listRecipes(context)
  ]);
  const mealsByDay = new Map(
    days.map((day) => [
      day.dateKey,
      plan.meals.filter((meal) => meal.plannedForDate === day.dateKey)
    ])
  );
  const todayMeals = mealsByDay.get(todayKey) ?? [];
  const uncheckedGroceries = groceryList.items.filter((item) => !item.checked);
  const checkedCount = groceryList.items.length - uncheckedGroceries.length;
  const weeklyRecipeIds = new Set(plan.meals.map((meal) => meal.recipeId));
  const weeklyRecipeOptions = savedRecipes.filter((recipe) =>
    weeklyRecipeIds.has(recipe.id)
  );
  const participantMemberIds = members.map((member) => member.id);
  let generatedSuggestion: AiMealSuggestion | null = null;
  let generationError: string | null = null;

  if (dashboardPrompt) {
    try {
      const request = aiPlanningRequestSchema.parse({
        prompt: dashboardPrompt,
        sourceTypes: ["ai_generated"],
        generationSeed: getString(params.generationSeed),
        mealType: dashboardMealType,
        numberOfMeals: 1,
        weekStartDate,
        participantMemberIds,
        servings: dashboardServings,
        maxCookTimeMinutes: null,
        calorieTarget: null,
        calorieMin: null,
        calorieMax: null,
        proteinGoal: null,
        preferredProteins: "",
        preferredBaseCarbs: "",
        vegetables: "",
        avoidIngredients: "",
        useHouseholdPreferences: true,
        usePantryStaples: true,
        useSavedRecipes: true
      });
      const result = await aiPlanningService.generateSuggestions(
        request,
        await householdService.listProfiles(context),
        context
      );

      generatedSuggestion = result.suggestions[0] ?? null;
    } catch (error) {
      generationError =
        error instanceof Error
          ? error.message
          : "A quick idea could not be generated.";
    }
  }
  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              <CalendarDays className="size-4" />
              Week of {formatWeekRange(weekStartDate)}
            </div>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              What are we eating this week?
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              A calm home base for this week&apos;s meals, today&apos;s plan,
              and the grocery list that keeps it all moving.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-96">
            <Button asChild>
              <Link href={`/plan-with-ai?weekStartDate=${weekStartDate}`}>
                <Sparkles className="size-4" />
                Plan with AI
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/recipes">
                <NotebookTabs className="size-4" />
                Browse Recipes
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/grocery-lists?week=${weekStartDate}`}>
                <ShoppingBasket className="size-4" />
                Open Grocery List
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Today</CardTitle>
                <CardDescription>
                  {new Date(`${todayKey}T00:00:00.000Z`).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC"
                    }
                  )}
                </CardDescription>
              </div>
              <ChefHat className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {todayMeals.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {todayMeals.map((meal) => (
                  <MealLink key={meal.id} meal={meal} />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-background p-5">
                <div className="flex items-start gap-3">
                  <Utensils className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Nothing planned today</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add lunch, dinner, a snack, or anything else you want to
                      keep visible for today.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <QuickAddToday
              weekStartDate={weekStartDate}
              todayKey={todayKey}
              participantMemberIds={participantMemberIds}
              weeklyRecipeOptions={weeklyRecipeOptions.map((recipe) => ({
                id: recipe.id,
                title: recipe.title
              }))}
              mealTypes={mealTypes}
              dashboardPrompt={dashboardPrompt}
              dashboardMealType={dashboardMealType}
              dashboardServings={dashboardServings}
              generatedSuggestion={generatedSuggestion}
              generationError={generationError}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Grocery Preview</CardTitle>
                <CardDescription>
                  {checkedCount} of {groceryList.items.length} checked off
                </CardDescription>
              </div>
              <ShoppingBasket className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {groceryList.items.length > 0 ? (
              <div className="space-y-3">
                {uncheckedGroceries.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground">
                        {item.category ?? "Other"}
                      </div>
                    </div>
                    {formatQuantity(item) ? (
                      <Badge variant="outline">{formatQuantity(item)}</Badge>
                    ) : null}
                  </div>
                ))}
                {uncheckedGroceries.length === 0 ? (
                  <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                    Everything is checked off.
                  </div>
                ) : null}
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/grocery-lists?week=${weekStartDate}`}>
                    Open Full List
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-background p-5">
                <div className="font-medium">No grocery list yet</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generate one after you add meals to the week.
                </p>
                <form
                  action={regenerateGroceryListAction.bind(null, weekStartDate)}
                  className="mt-4"
                >
                  <Button type="submit" variant="outline">
                    Generate Grocery List
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>This Week</CardTitle>
              <CardDescription>
                Planned meals by day, with open space where the week still needs
                attention.
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href={`/weekly-planner?week=${weekStartDate}`}>
                <ClipboardList className="size-4" />
                Open Planner
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            {days.map((day) => {
              const meals = mealsByDay.get(day.dateKey) ?? [];
              const isToday = day.dateKey === todayKey;

              return (
                <section
                  key={day.dateKey}
                  className={
                    isToday
                      ? "rounded-lg border border-primary/50 bg-primary/5 p-3"
                      : "rounded-lg border border-border bg-background p-3"
                  }
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{day.label}</h2>
                      <p className="text-sm text-muted-foreground">
                        {day.dateLabel}
                      </p>
                    </div>
                    {isToday ? <Badge>Today</Badge> : null}
                  </div>

                  <div className="space-y-3">
                    {meals.length > 0 ? (
                      meals.map((meal) => <MealLink key={meal.id} meal={meal} />)
                    ) : (
                      <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                        No meals planned.
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
