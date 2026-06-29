import type { GroceryListItemView } from "./types.ts";
import { BasicGroceryNormalizer } from "../../server/grocery-normalization/basic-grocery-normalizer.ts";
import type { GroceryNormalizer } from "../../server/grocery-normalization/types.ts";

export type GroceryIngredientInput = {
  name: string;
  displayText?: string | null;
  quantity: number | null;
  unit: string | null;
  recipeServings: number;
  plannedServings: number;
  recipeTitle: string;
  mealId: string;
  mealType?: string | null;
  plannedForDate?: string | null;
};

type ConvertedQuantity = {
  quantity: number | null;
  unit: string | null;
  conversionGroup: string;
  baseQuantity: number | null;
};

type GroceryGenerationInput = {
  ingredients: GroceryIngredientInput[];
  existingItems: GroceryListItemView[];
  idFactory?: () => string;
  normalizer?: GroceryNormalizer;
};

const volumeToTsp = new Map([
  ["tsp", 1],
  ["teaspoon", 1],
  ["teaspoons", 1],
  ["tbsp", 3],
  ["tablespoon", 3],
  ["tablespoons", 3],
  ["cup", 48],
  ["cups", 48]
]);

const weightToOz = new Map([
  ["oz", 1],
  ["ounce", 1],
  ["ounces", 1],
  ["lb", 16],
  ["lbs", 16],
  ["pound", 16],
  ["pounds", 16]
]);

const metricToG = new Map([
  ["g", 1],
  ["gram", 1],
  ["grams", 1],
  ["kg", 1000],
  ["kilogram", 1000],
  ["kilograms", 1000]
]);

function roundQuantity(value: number) {
  return Math.round(value * 1000) / 1000;
}

function displayName(normalizedName: string) {
  return normalizedName
    .split(" ")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function canonicalUnit(unit: string | null | undefined) {
  return unit?.trim().toLowerCase() || null;
}

function formatUnit(quantity: number, group: string): ConvertedQuantity {
  if (group === "volume") {
    if (quantity >= 48) {
      return { quantity: roundQuantity(quantity / 48), unit: "cup", conversionGroup: group, baseQuantity: quantity };
    }

    if (quantity >= 3) {
      return { quantity: roundQuantity(quantity / 3), unit: "tbsp", conversionGroup: group, baseQuantity: quantity };
    }

    return { quantity: roundQuantity(quantity), unit: "tsp", conversionGroup: group, baseQuantity: quantity };
  }

  if (group === "imperial-weight") {
    if (quantity >= 16) {
      return { quantity: roundQuantity(quantity / 16), unit: "lb", conversionGroup: group, baseQuantity: quantity };
    }

    return { quantity: roundQuantity(quantity), unit: "oz", conversionGroup: group, baseQuantity: quantity };
  }

  if (group === "metric-weight") {
    if (quantity >= 1000) {
      return { quantity: roundQuantity(quantity / 1000), unit: "kg", conversionGroup: group, baseQuantity: quantity };
    }

    return { quantity: roundQuantity(quantity), unit: "g", conversionGroup: group, baseQuantity: quantity };
  }

  return { quantity: roundQuantity(quantity), unit: group, conversionGroup: group, baseQuantity: quantity };
}

function convertQuantity(quantity: number | null, unit: string | null): ConvertedQuantity {
  const cleanedUnit = canonicalUnit(unit);

  if (quantity == null) {
    return {
      quantity: null,
      unit: cleanedUnit,
      conversionGroup: cleanedUnit ? `unit:${cleanedUnit}` : "quantityless",
      baseQuantity: null
    };
  }

  if (!cleanedUnit) {
    return {
      quantity: roundQuantity(quantity),
      unit: null,
      conversionGroup: "count",
      baseQuantity: quantity
    };
  }

  const volumeFactor = volumeToTsp.get(cleanedUnit);
  if (volumeFactor) {
    return formatUnit(quantity * volumeFactor, "volume");
  }

  const imperialWeightFactor = weightToOz.get(cleanedUnit);
  if (imperialWeightFactor) {
    return formatUnit(quantity * imperialWeightFactor, "imperial-weight");
  }

  const metricFactor = metricToG.get(cleanedUnit);
  if (metricFactor) {
    return formatUnit(quantity * metricFactor, "metric-weight");
  }

  return {
    quantity: roundQuantity(quantity),
    unit: cleanedUnit,
    conversionGroup: `unit:${cleanedUnit}`,
    baseQuantity: quantity
  };
}

function mergeKey(item: {
  normalizedName: string | null;
  category: string | null;
  unit: string | null;
  quantity: number | null;
  conversionGroup?: string | null;
}) {
  const quantityGroup =
    item.conversionGroup ??
    (item.quantity == null ? "quantityless" : inferConversionGroup(item.unit));
  return `${item.normalizedName ?? ""}|${item.category ?? ""}|${quantityGroup}`;
}

function inferConversionGroup(unit: string | null) {
  const cleanedUnit = canonicalUnit(unit);

  if (!cleanedUnit) {
    return "count";
  }

  if (volumeToTsp.has(cleanedUnit)) {
    return "volume";
  }

  if (weightToOz.has(cleanedUnit)) {
    return "imperial-weight";
  }

  if (metricToG.has(cleanedUnit)) {
    return "metric-weight";
  }

  return `unit:${cleanedUnit}`;
}

function sourceSummary(recipeNames: string[], mealCount: number) {
  if (recipeNames.length === 0) {
    return null;
  }

  const recipeText =
    recipeNames.length <= 2
      ? recipeNames.join(", ")
      : `${recipeNames.slice(0, 2).join(", ")} +${recipeNames.length - 2}`;

  return `${recipeText} (${mealCount} ${mealCount === 1 ? "meal" : "meals"})`;
}

function sourceKey(ingredient: GroceryIngredientInput) {
  return `${ingredient.mealId}|${ingredient.recipeTitle}`;
}

export function generateGroceryItems({
  ingredients,
  existingItems,
  idFactory = () => crypto.randomUUID(),
  normalizer = new BasicGroceryNormalizer()
}: GroceryGenerationInput): GroceryListItemView[] {
  const existingGenerated = existingItems.filter((item) => item.source === "GENERATED");
  const manualItems = existingItems.filter((item) => item.source === "MANUAL");
  const checkedByKey = new Map(existingGenerated.map((item) => [mergeKey(item), item.checked]));
  const merged = new Map<
    string,
    GroceryListItemView & { sourceKeys: Set<string>; conversionGroup: string; baseQuantity: number | null }
  >();

  for (const ingredient of ingredients) {
    if (ingredient.recipeServings <= 0 || ingredient.plannedServings <= 0) {
      continue;
    }

    const normalized = normalizer.normalize({
      name: ingredient.name,
      unit: ingredient.unit ?? undefined
    });
    const scaledQuantity =
      ingredient.quantity == null
        ? null
        : (ingredient.quantity * ingredient.plannedServings) / ingredient.recipeServings;
    const converted = convertQuantity(scaledQuantity, ingredient.unit);
    const item: GroceryListItemView & { sourceKeys: Set<string> } = {
      id: idFactory(),
      name: displayName(normalized.normalizedName),
      normalizedName: normalized.normalizedName,
      quantity: converted.quantity,
      unit: converted.unit,
      category: normalized.category ?? "Other",
      checked: false,
      source: "GENERATED",
      sourceRecipeNames: [ingredient.recipeTitle],
      sourceSummary: null,
      sourceKeys: new Set([sourceKey(ingredient)])
    };
    const key = mergeKey({ ...item, conversionGroup: converted.conversionGroup });
    const existing = merged.get(key);

    if (!existing) {
      item.checked = checkedByKey.get(key) ?? false;
      item.sourceSummary = sourceSummary(item.sourceRecipeNames, item.sourceKeys.size);
      merged.set(key, {
        ...item,
        conversionGroup: converted.conversionGroup,
        baseQuantity: converted.baseQuantity
      });
      continue;
    }

    if (existing.baseQuantity != null && converted.baseQuantity != null) {
      existing.baseQuantity += converted.baseQuantity;
      const formatted = formatUnit(existing.baseQuantity, existing.conversionGroup);
      existing.quantity = formatted.quantity;
      existing.unit = formatted.unit;
    } else {
      existing.quantity = null;
      existing.baseQuantity = null;
    }

    if (!existing.sourceRecipeNames.includes(ingredient.recipeTitle)) {
      existing.sourceRecipeNames.push(ingredient.recipeTitle);
    }
    existing.sourceKeys.add(sourceKey(ingredient));
    existing.sourceSummary = sourceSummary(existing.sourceRecipeNames, existing.sourceKeys.size);
  }

  const generatedItems = Array.from(merged.values()).map((item) => {
    const groceryItem: GroceryListItemView = {
      id: item.id,
      name: item.name,
      normalizedName: item.normalizedName,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      checked: item.checked,
      source: item.source,
      sourceRecipeNames: item.sourceRecipeNames,
      sourceSummary: item.sourceSummary
    };

    return groceryItem;
  });

  return [...generatedItems, ...manualItems].sort((first, second) => {
    if (first.checked !== second.checked) {
      return first.checked ? 1 : -1;
    }

    const categoryCompare = (first.category ?? "").localeCompare(second.category ?? "");
    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return first.name.localeCompare(second.name);
  });
}

export function getGroceryMergeKeyForTest(item: GroceryListItemView) {
  return mergeKey(item);
}
