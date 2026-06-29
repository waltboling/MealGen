"use client";

import { useMemo, useState } from "react";
import { Clipboard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GroceryListItemView } from "@/features/grocery-lists/types";

type CopyGroceryListButtonProps = {
  items: GroceryListItemView[];
  weekStartDate: string;
  className?: string;
};

function formatQuantity(item: GroceryListItemView) {
  if (item.quantity == null) {
    return "";
  }

  return `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`;
}

function categoryLabel(category: string | null) {
  return category === "Meat" ? "Meat & Seafood" : category ?? "Other";
}

function itemLine(item: GroceryListItemView) {
  const quantity = formatQuantity(item);
  const prefix = item.checked ? "[x]" : "[ ]";

  return quantity ? `${prefix} ${item.name} - ${quantity}` : `${prefix} ${item.name}`;
}

export function CopyGroceryListButton({
  items,
  weekStartDate,
  className
}: CopyGroceryListButtonProps) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => {
    const groups = items.reduce<Record<string, GroceryListItemView[]>>(
      (grouped, item) => {
        const category = categoryLabel(item.category);
        grouped[category] = grouped[category] ?? [];
        grouped[category].push(item);
        return grouped;
      },
      {}
    );
    const sections = Object.entries(groups).map(([category, groupItems]) =>
      [category, ...groupItems.map(itemLine)].join("\n")
    );

    return [`Grocery List - Week of ${weekStartDate}`, "", ...sections].join(
      "\n\n"
    );
  }, [items, weekStartDate]);

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
      {copied ? "Copied" : "Copy for Notes"}
    </Button>
  );
}
