"use client";

import { useFormStatus } from "react-dom";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RecipeImageImportFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  returnPath: string;
};

function ImportButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FileUp className="size-4" />
      )}
      {pending ? "Parsing file..." : "Import Recipe File"}
    </Button>
  );
}

export function RecipeImageImportForm({
  action,
  returnPath
}: RecipeImageImportFormProps) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="returnPath" value={returnPath} />
      <Label className="space-y-2 text-sm font-medium">
        <span>Recipe photo or PDF</span>
        <Input
          name="recipeFile"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.pdf"
          required
        />
      </Label>
      <ImportButton />
    </form>
  );
}

export const RecipeFileImportForm = RecipeImageImportForm;
