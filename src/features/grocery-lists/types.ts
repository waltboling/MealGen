export type GroceryItemSource = "GENERATED" | "MANUAL";

export type GroceryListItemView = {
  id: string;
  name: string;
  normalizedName: string | null;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  checked: boolean;
  source: GroceryItemSource;
  sourceRecipeNames: string[];
  sourceSummary: string | null;
};

export type GroceryListView = {
  id: string;
  name: string;
  weekStartDate: string;
  mealPlanId: string | null;
  items: GroceryListItemView[];
};

export type ManualGroceryItemInput = {
  weekStartDate: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  category?: string | null;
};
