"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toggleGroceryItemAction } from "@/features/grocery-lists/actions";

type GroceryItemCheckboxProps = {
  itemId: string;
  checked: boolean;
  label: string;
};

export function GroceryItemCheckbox({
  itemId,
  checked,
  label
}: GroceryItemCheckboxProps) {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(checked);

  return (
    <input
      type="checkbox"
      checked={isChecked}
      aria-label={label}
      className="mt-1 size-5 rounded border-border"
      onChange={(event) => {
        const nextChecked = event.target.checked;
        setIsChecked(nextChecked);
        startTransition(async () => {
          await toggleGroceryItemAction(itemId, nextChecked);
          router.refresh();
        });
      }}
    />
  );
}
