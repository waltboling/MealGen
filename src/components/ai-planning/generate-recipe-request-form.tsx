"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type GenerateRecipeRequestFormProps = {
  children: ReactNode;
  restoreDraft: boolean;
};

const draftKey = "meal-planner.generate-recipe.form";

type DraftValue = string | boolean;

function fields(form: HTMLFormElement) {
  return Array.from(form.elements).filter(
    (
      element
    ): element is HTMLInputElement | HTMLTextAreaElement =>
      (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement) &&
      Boolean(element.name) &&
      element.type !== "hidden"
  );
}

function readDraft(form: HTMLFormElement) {
  const draft: Record<string, DraftValue> = {};

  for (const field of fields(form)) {
    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      draft[field.name] = field.checked;
      continue;
    }

    draft[field.name] = field.value;
  }

  return draft;
}

function saveDraft(form: HTMLFormElement) {
  window.sessionStorage.setItem(draftKey, JSON.stringify(readDraft(form)));
}

function restoreDraft(form: HTMLFormElement) {
  const raw = window.sessionStorage.getItem(draftKey);

  if (!raw) {
    return;
  }

  let draft: Record<string, DraftValue>;

  try {
    draft = JSON.parse(raw) as Record<string, DraftValue>;
  } catch {
    window.sessionStorage.removeItem(draftKey);
    return;
  }

  for (const field of fields(form)) {
    const value = draft[field.name];

    if (value == null) {
      continue;
    }

    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      field.checked = Boolean(value);
      continue;
    }

    if (typeof value === "string") {
      field.value = value;
    }
  }
}

export function GenerateRecipeRequestForm({
  children,
  restoreDraft: shouldRestoreDraft
}: GenerateRecipeRequestFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const form = formRef.current;

    if (!form) {
      return;
    }

    if (shouldRestoreDraft) {
      restoreDraft(form);
    }

    function handleChange() {
      if (form) {
        saveDraft(form);
      }
    }

    function handleClick(event: MouseEvent) {
      const link = (event.target as HTMLElement).closest("a");

      if (link?.getAttribute("href") === "/recipes/generate") {
        window.sessionStorage.removeItem(draftKey);
      }
    }

    form.addEventListener("input", handleChange);
    form.addEventListener("change", handleChange);
    form.addEventListener("click", handleClick);
    return () => {
      form.removeEventListener("input", handleChange);
      form.removeEventListener("change", handleChange);
      form.removeEventListener("click", handleClick);
    };
  }, [shouldRestoreDraft]);

  return (
    <form
      ref={formRef}
      data-recipe-generator-form
      data-generating={isGenerating ? "true" : "false"}
      aria-busy={isGenerating}
      className="group space-y-5"
      onSubmit={(event) => {
        event.preventDefault();

        if (!event.currentTarget.checkValidity()) {
          event.currentTarget.reportValidity();
          return;
        }

        const generationSeed =
          event.currentTarget.elements.namedItem("generationSeed");

        if (generationSeed instanceof HTMLInputElement) {
          generationSeed.value = Date.now().toString();
        }

        saveDraft(event.currentTarget);
        setIsGenerating(true);
        event.currentTarget.setAttribute("data-generating", "true");
        event.currentTarget
          .querySelectorAll<HTMLButtonElement>("[data-generate-button]")
          .forEach((button) => {
            button.disabled = true;
          });

        const form = event.currentTarget;

        window.requestAnimationFrame(() => {
          window.setTimeout(() => {
            form.submit();
          }, 150);
        });
      }}
    >
      <div
        data-generate-loading-panel
        className="hidden rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary group-data-[generating=true]:block"
      >
        <div className="flex items-center gap-2 font-medium">
          <Loader2 className="size-4 animate-spin" />
          Generating recipe...
        </div>
        <p className="mt-1 text-primary/80">
          Building ingredients, instructions, and nutrition estimates now.
        </p>
      </div>
      {children}
    </form>
  );
}
