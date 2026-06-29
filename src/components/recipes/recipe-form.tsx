"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { RecipeDetails } from "@/features/recipes/types";

type IngredientRow = {
  displayText: string;
  name: string;
  quantity: string;
  unit: string;
};

type InstructionRow = {
  text: string;
};

type NoteRow = {
  text: string;
};

type RecipeFormProps = {
  action: (formData: FormData) => void;
  recipe?: RecipeDetails;
  submitLabel: string;
};

function blankIngredient(): IngredientRow {
  return {
    displayText: "",
    name: "",
    quantity: "",
    unit: ""
  };
}

function blankInstruction(): InstructionRow {
  return { text: "" };
}

function blankNote(): NoteRow {
  return { text: "" };
}

export function RecipeForm({ action, recipe, submitLabel }: RecipeFormProps) {
  const [tagsText, setTagsText] = useState(recipe?.tags.join(", ") ?? "");
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    recipe?.ingredients.map((ingredient) => ({
      displayText: ingredient.displayText,
      name: ingredient.name,
      quantity: ingredient.quantity == null ? "" : String(ingredient.quantity),
      unit: ingredient.unit ?? ""
    })) ?? [blankIngredient()]
  );
  const [instructions, setInstructions] = useState<InstructionRow[]>(
    recipe?.instructions.map((instruction) => ({ text: instruction.text })) ?? [
      blankInstruction()
    ]
  );
  const [notes, setNotes] = useState<NoteRow[]>(
    recipe?.notes.map((note) => ({ text: note.text })) ?? [blankNote()]
  );

  const tagsJson = useMemo(() => {
    return JSON.stringify(
      tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    );
  }, [tagsText]);

  const ingredientsJson = JSON.stringify(
    ingredients
      .map((ingredient) => {
        const displayText = ingredient.displayText.trim();

        return {
          ...ingredient,
          displayText,
          name: ingredient.name.trim() || displayText,
          quantity: ingredient.quantity,
          unit: ingredient.unit
        };
      })
      .filter((ingredient) => ingredient.displayText)
  );

  const instructionsJson = JSON.stringify(
    instructions.filter((instruction) => instruction.text.trim())
  );

  const notesJson = JSON.stringify(notes.filter((note) => note.text.trim()));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="tagsJson" value={tagsJson} />
      <input type="hidden" name="ingredientsJson" value={ingredientsJson} />
      <input type="hidden" name="instructionsJson" value={instructionsJson} />
      <input type="hidden" name="notesJson" value={notesJson} />

      <Card>
        <CardHeader>
          <CardTitle>Recipe Basics</CardTitle>
          <CardDescription>
            Keep the source information when it helps future you.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={recipe?.title} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={recipe?.description ?? ""}
              placeholder="A short note about why this recipe belongs in rotation."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              defaultValue={recipe?.imageUrl ?? ""}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sourceName">Source</Label>
            <Input
              id="sourceName"
              name="sourceName"
              defaultValue={recipe?.sourceName ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source URL</Label>
            <Input
              id="sourceUrl"
              name="sourceUrl"
              defaultValue={recipe?.sourceUrl ?? ""}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorName">Author</Label>
            <Input
              id="authorName"
              name="authorName"
              defaultValue={recipe?.authorName ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
              placeholder="weeknight, chicken, meal prep"
            />
          </div>
          <div className="grid grid-cols-3 gap-3 md:col-span-2">
            <div className="space-y-2">
              <Label htmlFor="prepMinutes">Prep</Label>
              <Input
                id="prepMinutes"
                name="prepMinutes"
                type="number"
                min="0"
                defaultValue={recipe?.prepMinutes ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cookMinutes">Cook</Label>
              <Input
                id="cookMinutes"
                name="cookMinutes"
                type="number"
                min="0"
                defaultValue={recipe?.cookMinutes ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                name="servings"
                type="number"
                min="1"
                defaultValue={recipe?.servings ?? 4}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Ingredients</CardTitle>
              <CardDescription>
                Use the display text for cooking and the name for grocery merging.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIngredients([...ingredients, blankIngredient()])}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-[1.4fr_1fr_120px_100px_44px]"
            >
              <Input
                value={ingredient.displayText}
                onChange={(event) => {
                  const next = [...ingredients];
                  next[index] = { ...ingredient, displayText: event.target.value };
                  setIngredients(next);
                }}
                placeholder="1 cup jasmine rice"
                aria-label="Ingredient display text"
              />
              <Input
                value={ingredient.name}
                onChange={(event) => {
                  const next = [...ingredients];
                  next[index] = { ...ingredient, name: event.target.value };
                  setIngredients(next);
                }}
                placeholder="jasmine rice"
                aria-label="Ingredient name"
              />
              <Input
                value={ingredient.quantity}
                onChange={(event) => {
                  const next = [...ingredients];
                  next[index] = { ...ingredient, quantity: event.target.value };
                  setIngredients(next);
                }}
                placeholder="1"
                aria-label="Quantity"
              />
              <Input
                value={ingredient.unit}
                onChange={(event) => {
                  const next = [...ingredients];
                  next[index] = { ...ingredient, unit: event.target.value };
                  setIngredients(next);
                }}
                placeholder="cup"
                aria-label="Unit"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setIngredients(
                    ingredients.length === 1
                      ? [blankIngredient()]
                      : ingredients.filter((_, rowIndex) => rowIndex !== index)
                  )
                }
                aria-label="Remove ingredient"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Instructions</CardTitle>
              <CardDescription>
                Steps are saved in the order shown here.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInstructions([...instructions, blankInstruction()])}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {instructions.map((instruction, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-medium">
                {index + 1}
              </div>
              <Textarea
                value={instruction.text}
                onChange={(event) => {
                  const next = [...instructions];
                  next[index] = { text: event.target.value };
                  setInstructions(next);
                }}
                placeholder="Describe this cooking step."
                aria-label={`Step ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setInstructions(
                    instructions.length === 1
                      ? [blankInstruction()]
                      : instructions.filter((_, rowIndex) => rowIndex !== index)
                  )
                }
                aria-label="Remove instruction"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Notes</CardTitle>
              <CardDescription>
                Capture substitutions, timing tweaks, and family feedback.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNotes([...notes, blankNote()])}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {notes.map((note, index) => (
            <div key={index} className="flex gap-3">
              <Textarea
                value={note.text}
                onChange={(event) => {
                  const next = [...notes];
                  next[index] = { text: event.target.value };
                  setNotes(next);
                }}
                placeholder="Optional recipe note."
                aria-label={`Note ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setNotes(
                    notes.length === 1
                      ? [blankNote()]
                      : notes.filter((_, rowIndex) => rowIndex !== index)
                  )
                }
                aria-label="Remove note"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          <Save className="size-4" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
