"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteRecipeAction } from "@/features/recipes/actions";

type DeleteRecipeButtonProps = {
  recipeId: string;
};

export function DeleteRecipeButton({ recipeId }: DeleteRecipeButtonProps) {
  return (
    <form
      action={deleteRecipeAction.bind(null, recipeId)}
      onSubmit={(event) => {
        if (!window.confirm("Delete this recipe? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="outline" className="text-destructive">
        <Trash2 className="size-4" />
        Delete
      </Button>
    </form>
  );
}
