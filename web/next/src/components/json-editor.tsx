"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

export interface JsonEditorProps {
  value: string;
  onChange: (s: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  rows?: number;
  id?: string;
  disabled?: boolean;
}

export function JsonEditor({
  value,
  onChange,
  error,
  placeholder,
  className,
  rows = 10,
  id,
  disabled,
}: JsonEditorProps) {
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleBlur = () => {
    if (!value.trim()) {
      setLocalError(null);
      return;
    }
    try {
      JSON.parse(value);
      setLocalError(null);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const displayError = error ?? localError;

  return (
    <div className={cn("w-full", className)}>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={false}
        className={cn(
          "font-mono text-xs leading-relaxed",
          displayError && "border-[var(--destructive)] focus-visible:ring-[var(--destructive)]"
        )}
      />
      {displayError ? (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-[var(--destructive)]">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="break-words">{displayError}</span>
        </div>
      ) : null}
    </div>
  );
}
