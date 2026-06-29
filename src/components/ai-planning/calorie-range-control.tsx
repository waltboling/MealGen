"use client";

import { useMemo, useState } from "react";

type CalorieRangeControlProps = {
  defaultMin: number | null;
  defaultMax: number | null;
};

const minCalories = 250;
const maxCalories = 1200;
const step = 25;

function clamp(value: number) {
  return Math.min(maxCalories, Math.max(minCalories, value));
}

export function CalorieRangeControl({
  defaultMin,
  defaultMax
}: CalorieRangeControlProps) {
  const initialMin = clamp(defaultMin ?? 500);
  const initialMax = clamp(defaultMax ?? 750);
  const [lower, setLower] = useState(Math.min(initialMin, initialMax));
  const [upper, setUpper] = useState(Math.max(initialMin, initialMax));
  const summary = useMemo(() => {
    if (lower === upper) {
      return `Around ${lower} calories`;
    }

    return `${lower}-${upper} calories`;
  }, [lower, upper]);

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Calorie target</span>
        <span className="text-sm text-muted-foreground">{summary}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2 text-xs font-medium text-muted-foreground">
          <span>Minimum</span>
          <input
            name="calorieMin"
            type="range"
            min={minCalories}
            max={maxCalories}
            step={step}
            value={lower}
            onChange={(event) =>
              setLower(Math.min(Number(event.target.value), upper))
            }
            className="w-full accent-primary"
          />
          <input
            type="number"
            min={minCalories}
            max={maxCalories}
            step={step}
            value={lower}
            onChange={(event) =>
              setLower(Math.min(clamp(Number(event.target.value)), upper))
            }
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
          />
        </label>
        <label className="space-y-2 text-xs font-medium text-muted-foreground">
          <span>Maximum</span>
          <input
            name="calorieMax"
            type="range"
            min={minCalories}
            max={maxCalories}
            step={step}
            value={upper}
            onChange={(event) =>
              setUpper(Math.max(Number(event.target.value), lower))
            }
            className="w-full accent-primary"
          />
          <input
            type="number"
            min={minCalories}
            max={maxCalories}
            step={step}
            value={upper}
            onChange={(event) =>
              setUpper(Math.max(clamp(Number(event.target.value)), lower))
            }
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
          />
        </label>
      </div>
    </div>
  );
}
