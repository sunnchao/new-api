"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/copy-button";

export interface MaskedValueDisplayProps {
  value?: string;
  fullValue?: string;
  maskedValue?: string;
  label?: string;
  copyTooltip?: string;
  copyAriaLabel?: string;
  mask?: "partial" | "full";
  className?: string;
}

function maskValue(value: string, mode: "partial" | "full"): string {
  if (!value) return "";
  if (mode === "full") return "*".repeat(Math.max(8, Math.min(value.length, 24)));
  // partial: first 7 + last 4
  if (value.length <= 11) {
    return value[0] + "*".repeat(Math.max(0, value.length - 2)) + value.slice(-1);
  }
  return `${value.slice(0, 7)}${"*".repeat(6)}${value.slice(-4)}`;
}

export function MaskedValueDisplay({
  value,
  fullValue,
  maskedValue,
  label,
  copyTooltip,
  copyAriaLabel,
  mask = "partial",
  className,
}: MaskedValueDisplayProps) {
  const [revealed, setRevealed] = React.useState(false);
  const resolvedValue = fullValue ?? value ?? "";
  const display = revealed ? resolvedValue : maskedValue ?? maskValue(resolvedValue, mask);
  const Icon = revealed ? EyeOff : Eye;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-mono text-[var(--foreground)]",
        className
      )}
    >
      {label ? <span className="sr-only">{label}</span> : null}
      <span className="select-all break-all">{display}</span>
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? "Hide" : "Reveal"}
        className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
      <CopyButton
        value={resolvedValue}
        size="sm"
        tooltip={copyTooltip}
        aria-label={copyAriaLabel}
      />
    </div>
  );
}
