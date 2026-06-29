"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

type PlanningRequestFormProps = {
  children: ReactNode;
  restoreDraft: boolean;
};

const formDraftKey = "meal-planner.plan-with-ai.form";

type DraftField = string | string[];

function writableFields(form: HTMLFormElement) {
  return Array.from(form.elements).filter(
    (
      element
    ): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
      (element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement) &&
      Boolean(element.name) &&
      element.type !== "hidden"
  );
}

function readDraft(form: HTMLFormElement) {
  const draft: Record<string, DraftField> = {};

  for (const element of writableFields(form)) {
    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      const existing = draft[element.name];
      const values = Array.isArray(existing) ? existing : [];

      if (element.checked) {
        values.push(element.value);
      }

      draft[element.name] = values;
      continue;
    }

    draft[element.name] = element.value;
  }

  return draft;
}

function saveDraft(form: HTMLFormElement) {
  window.sessionStorage.setItem(formDraftKey, JSON.stringify(readDraft(form)));
}

function restoreDraftValues(form: HTMLFormElement) {
  const raw = window.sessionStorage.getItem(formDraftKey);

  if (!raw) {
    return;
  }

  let draft: Record<string, DraftField>;

  try {
    draft = JSON.parse(raw) as Record<string, DraftField>;
  } catch {
    window.sessionStorage.removeItem(formDraftKey);
    return;
  }

  for (const element of writableFields(form)) {
    const value = draft[element.name];

    if (value == null) {
      continue;
    }

    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      element.checked = Array.isArray(value)
        ? value.includes(element.value)
        : value === element.value;
      continue;
    }

    if (typeof value === "string") {
      element.value = value;
    }
  }
}

export function PlanningRequestForm({
  children,
  restoreDraft
}: PlanningRequestFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  function showGenerating(form: HTMLFormElement) {
    const generationSeed = form.elements.namedItem("generationSeed");

    if (generationSeed instanceof HTMLInputElement) {
      generationSeed.value = Date.now().toString();
    }

    saveDraft(form);
    setIsGenerating(true);
    form.setAttribute("data-generating", "true");
    form.setAttribute("aria-busy", "true");
    form
      .querySelectorAll<HTMLElement>("[data-loading-panel]")
      .forEach((panel) => {
        panel.classList.remove("hidden");
        panel.style.display = "block";
      });
    form
      .querySelectorAll<HTMLButtonElement>("[data-generate-button]")
      .forEach((button) => {
        button.disabled = true;
        const spinner = document.createElement("span");
        const label = document.createElement("span");

        spinner.style.width = "1rem";
        spinner.style.height = "1rem";
        spinner.style.borderRadius = "9999px";
        spinner.style.border = "2px solid rgba(255, 255, 255, 0.45)";
        spinner.style.borderTopColor = "#fff";
        spinner.style.display = "inline-block";
        spinner.style.animation = "ai-plan-generate-spin 0.8s linear infinite";
        spinner.setAttribute("aria-hidden", "true");
        label.textContent = "Generating...";
        button.replaceChildren(spinner, label);
      });
  }

  useEffect(() => {
    const form = formRef.current;

    if (!form) {
      return;
    }

    if (restoreDraft) {
      restoreDraftValues(form);
    }

    function handleInput() {
      if (form) {
        saveDraft(form);
      }
    }

    function handleClick(event: MouseEvent) {
      const link = (event.target as HTMLElement).closest("a");

      if (link?.getAttribute("href") === "/plan-with-ai") {
        window.sessionStorage.removeItem(formDraftKey);
      }
    }

    form.addEventListener("input", handleInput);
    form.addEventListener("change", handleInput);
    form.addEventListener("click", handleClick);
    return () => {
      form.removeEventListener("input", handleInput);
      form.removeEventListener("change", handleInput);
      form.removeEventListener("click", handleClick);
    };
  }, [restoreDraft]);

  return (
    <form
      action="/plan-with-ai#review-suggestions"
      method="get"
      ref={formRef}
      data-ai-planning-form
      data-generating={isGenerating ? "true" : "false"}
      aria-busy={isGenerating}
      className="group space-y-5"
      onSubmit={(event) => {
        showGenerating(event.currentTarget);
      }}
    >
      <div
        data-loading-panel
        data-ai-planning-loading-panel
        className={`rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary ${
          isGenerating ? "" : "hidden"
        }`}
      >
          <div className="flex items-center gap-2 font-medium">
            <Loader2 className="size-4 animate-spin" />
            Generating meal ideas...
          </div>
          <p className="mt-1 text-primary/80">
            This can take a few seconds with live recipe and AI providers. Keep
            this tab open.
          </p>
        </div>
      {children}
      <div
        data-loading-panel
        data-ai-planning-loading-panel
        className={`fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-md border border-primary/30 bg-card p-4 shadow-lg ${
          isGenerating ? "" : "hidden"
        }`}
      >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <div>
              <div className="font-medium">Building your week</div>
              <div className="text-sm text-muted-foreground">
                Searching sources and drafting recipes now.
              </div>
            </div>
          </div>
        </div>
      <style>
        {"@keyframes ai-plan-generate-spin { to { transform: rotate(360deg); } }"}
      </style>
    </form>
  );
}
