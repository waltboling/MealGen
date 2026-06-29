import type {
  ManualGroceryItemInput
} from "@/features/grocery-lists/types";
import type { CurrentHousehold } from "@/lib/auth/current-household";
import { GroceryListRepository } from "@/server/repositories/grocery-list-repository";

const groceryListRepository = new GroceryListRepository();

export class GroceryListService {
  getOrCreateForWeek(context: CurrentHousehold, weekStartDate: string) {
    return groceryListRepository.getOrCreateForWeek(
      context.householdId,
      weekStartDate,
      context.isDemo
    );
  }

  regenerateForWeek(context: CurrentHousehold, weekStartDate: string) {
    return groceryListRepository.regenerateForWeek(
      context.householdId,
      weekStartDate,
      context.isDemo
    );
  }

  addManualItem(context: CurrentHousehold, input: ManualGroceryItemInput) {
    return groceryListRepository.addManualItem(
      context.householdId,
      input,
      context.isDemo
    );
  }

  setItemChecked(
    context: CurrentHousehold,
    groceryItemId: string,
    checked: boolean
  ) {
    return groceryListRepository.setItemChecked(
      context.householdId,
      groceryItemId,
      checked,
      context.isDemo
    );
  }
}
