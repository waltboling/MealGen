"use client";

import { useState } from "react";
import { ChiliPepperIcon } from "@/components/ui/chili-pepper-icon";
import { cn } from "@/lib/utils";

type SpicePreferenceInputProps = {
  name: string;
  defaultValue: number;
  disabled?: boolean;
};

const levels = [1, 2, 3, 4, 5] as const;

export function SpicePreferenceInput({
  name,
  defaultValue,
  disabled = false
}: SpicePreferenceInputProps) {
  const [value, setValue] = useState(Math.min(Math.max(defaultValue, 0), 5));

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap items-center gap-2" role="radiogroup">
        {levels.map((level) => (
          <button
            key={level}
            type="button"
            disabled={disabled}
            role="radio"
            aria-checked={value === level}
            aria-label={`${level} out of 5 spice preference`}
            onClick={() => setValue(level)}
            className={cn(
              "flex size-10 items-center justify-center rounded-md border border-border bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              value === level ? "border-primary bg-primary/10" : "hover:bg-secondary"
            )}
          >
            <ChiliPepperIcon
              className={cn(
                "size-5 transition-colors",
                level <= value
                  ? "fill-red-600 text-red-700"
                  : "fill-transparent text-muted-foreground/45"
              )}
            />
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setValue(0)}
          className="ml-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>
      <div className="text-xs text-muted-foreground">
        {value === 0 ? "No spice" : `${value} / 5 spice`}
      </div>
    </div>
  );
}
