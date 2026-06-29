import Link from "next/link";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
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
import { PageHeader } from "@/components/layout/page-header";
import { CopyGroceryListButton } from "@/components/grocery-lists/copy-grocery-list-button";
import { GroceryItemCheckbox } from "@/components/grocery-lists/grocery-item-checkbox";
import {
  addManualGroceryItemAction,
  regenerateGroceryListAction
} from "@/features/grocery-lists/actions";
import { GroceryListService } from "@/features/grocery-lists/service";
import type { GroceryListItemView } from "@/features/grocery-lists/types";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";
import { addDays, getCurrentWeekStart } from "@/lib/date/week";

type GroceryListsPageProps = {
  searchParams: Promise<{
    week?: string;
  }>;
};

const groceryListService = new GroceryListService();

function formatQuantity(item: GroceryListItemView) {
  if (item.quantity == null) {
    return "";
  }

  return `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`;
}

function categoryLabel(category: string | null) {
  return category === "Meat" ? "Meat & Seafood" : category ?? "Other";
}

function groupItems(items: GroceryListItemView[]) {
  return items.reduce<Record<string, GroceryListItemView[]>>((groups, item) => {
    const category = categoryLabel(item.category);
    groups[category] = groups[category] ?? [];
    groups[category].push(item);
    return groups;
  }, {});
}

export default async function GroceryListsPage({
  searchParams
}: GroceryListsPageProps) {
  const params = await searchParams;
  const weekStartDate = params.week ?? getCurrentWeekStart();
  const previousWeek = addDays(weekStartDate, -7);
  const nextWeek = addDays(weekStartDate, 7);
  const context = await getCurrentHouseholdOrRedirect();
  let groceryList;
  let loadError: string | null = null;

  try {
    groceryList = await groceryListService.regenerateForWeek(
      context,
      weekStartDate
    );
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "The grocery list could not be loaded.";
    groceryList = {
      id: "",
      name: `Groceries for ${weekStartDate}`,
      weekStartDate,
      mealPlanId: null,
      items: []
    };
  }
  const groups = groupItems(groceryList.items);
  const checkedCount = groceryList.items.filter((item) => item.checked).length;

  return (
    <>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <PageHeader
          title="Grocery Lists"
          description="Generate a merged shopping list from the weekly meal plan, then check items off as you shop."
        />
        <div className="flex flex-wrap gap-2">
          <CopyGroceryListButton
            items={groceryList.items}
            weekStartDate={weekStartDate}
          />
          <Button asChild variant="outline">
            <Link href={`/grocery-lists?week=${previousWeek}`}>
              <ChevronLeft className="size-4" />
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/grocery-lists?week=${nextWeek}`}>
              Next
              <ChevronRight className="size-4" />
            </Link>
          </Button>
          <form action={regenerateGroceryListAction.bind(null, weekStartDate)}>
            <Button type="submit">
              <RefreshCw className="size-4" />
              Regenerate
            </Button>
          </form>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{groceryList.name}</CardTitle>
            <CardDescription>Week of {weekStartDate}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{groceryList.items.length}</CardTitle>
            <CardDescription>Total items</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{checkedCount}</CardTitle>
            <CardDescription>Checked off</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {loadError ? (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {groceryList.items.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No grocery items yet</CardTitle>
                <CardDescription>
                  Add meals to the weekly planner, then regenerate this list.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={`/weekly-planner?week=${weekStartDate}`}>
                    Open Weekly Planner
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groups).map(([category, items]) => (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>{category}</CardTitle>
                      <CardDescription>
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{items.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 rounded-md border border-border bg-background p-3"
                    >
                      <GroceryItemCheckbox
                        itemId={item.id}
                        checked={item.checked}
                        label={`Check ${item.name}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={
                            item.checked
                              ? "font-medium text-muted-foreground line-through"
                              : "font-medium"
                          }
                        >
                          {item.name}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          {formatQuantity(item) ? (
                            <span>{formatQuantity(item)}</span>
                          ) : null}
                          <Badge variant={item.source === "MANUAL" ? "outline" : "secondary"}>
                            {item.source === "MANUAL" ? "Manual" : "Generated"}
                          </Badge>
                        </div>
                        {item.sourceSummary ? (
                          <div className="mt-2 text-xs leading-5 text-muted-foreground">
                            From {item.sourceSummary}
                          </div>
                        ) : null}
                        {item.sourceRecipeNames.length > 1 ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Merged from {item.sourceRecipeNames.length} recipes
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manual Addition</CardTitle>
            <CardDescription>
              Add one-off items without losing them on regeneration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={addManualGroceryItemAction} className="space-y-4">
              <input type="hidden" name="weekStartDate" value={weekStartDate} />
              <div className="space-y-2">
                <Label htmlFor="name">Item</Label>
                <Input id="name" name="name" placeholder="Coffee beans" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Qty</Label>
                  <Input id="quantity" name="quantity" type="number" min="0" step="0.001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input id="unit" name="unit" placeholder="bag" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="Pantry" />
              </div>
              <Button type="submit" className="w-full">
                Add Item
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
