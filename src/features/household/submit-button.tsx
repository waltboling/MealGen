"use client";

import type React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost" | "destructive";
  className?: string;
};

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  disabled,
  variant,
  className
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      variant={variant}
      className={className}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
