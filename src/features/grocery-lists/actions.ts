"use server";

import { revalidatePath } from "next/cache";
import {
  manualGroceryItemSchema,
  toggleGroceryItemSchema,
  weekStartSchema
} from "@/features/grocery-lists/schemas";
import { GroceryListService } from "@/features/grocery-lists/service";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";

const groceryListService = new GroceryListService();

export async function regenerateGroceryListAction(weekStartDate: string) {
  const week = weekStartSchema.parse(weekStartDate);
  const context = await getCurrentHouseholdOrRedirect();

  await groceryListService.regenerateForWeek(context, week);
  revalidatePath("/grocery-lists");
}

export async function addManualGroceryItemAction(formData: FormData) {
  const input = manualGroceryItemSchema.parse({
    weekStartDate: formData.get("weekStartDate"),
    name: formData.get("name"),
    quantity: formData.get("quantity") ?? "",
    unit: formData.get("unit") ?? "",
    category: formData.get("category") ?? ""
  });
  const context = await getCurrentHouseholdOrRedirect();

  await groceryListService.addManualItem(context, input);
  revalidatePath("/grocery-lists");
}

export async function toggleGroceryItemAction(
  groceryItemId: string,
  checked: boolean
) {
  const input = toggleGroceryItemSchema.parse({ groceryItemId, checked });
  const context = await getCurrentHouseholdOrRedirect();

  await groceryListService.setItemChecked(
    context,
    input.groceryItemId,
    input.checked
  );
  revalidatePath("/grocery-lists");
}
