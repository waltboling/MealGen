"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { buttonVariants, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GenerateFormProps = React.FormHTMLAttributes<HTMLFormElement> & {
  setGenerationSeed?: boolean;
};

export function GenerateForm({
  children,
  className,
  onSubmit,
  setGenerationSeed = true,
  ...props
}: GenerateFormProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);

  return (
    <form
      {...props}
      className={cn("group", className)}
      data-generating={isGenerating ? "true" : "false"}
      aria-busy={isGenerating}
      onSubmit={(event) => {
        if (setGenerationSeed) {
          const seed = event.currentTarget.elements.namedItem("generationSeed");

          if (seed instanceof HTMLInputElement) {
            seed.value = Date.now().toString();
          }
        }

        setIsGenerating(true);
        onSubmit?.(event);
      }}
    >
      {children}
    </form>
  );
}

type GenerateButtonProps = ButtonProps & {
  idleLabel?: string;
  generatingLabel?: string;
};

export function GenerateButton({
  children,
  className,
  idleLabel,
  generatingLabel = "Generating...",
  variant = "outline",
  size,
  ...props
}: GenerateButtonProps) {
  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      className={cn(buttonVariants({ variant, size, className }))}
    >
      <Sparkles className="size-4 group-data-[generating=true]:hidden" />
      <Loader2 className="hidden size-4 animate-spin group-data-[generating=true]:block" />
      <span className="group-data-[generating=true]:hidden">
        {idleLabel ?? children}
      </span>
      <span className="hidden group-data-[generating=true]:inline">
        {generatingLabel}
      </span>
    </button>
  );
}
