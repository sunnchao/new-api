import * as React from "react";
import { cn } from "@/lib/utils";

export interface GroupBadgeProps {
  group: string;
  label?: string;
  ratio?: number | string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | null;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
}

const PALETTE: Array<{ bg: string; fg: string; border: string }> = [
  { bg: "oklch(0.45 0.18 270 / 0.18)", fg: "oklch(0.75 0.16 270)", border: "oklch(0.55 0.18 270 / 0.35)" },
  { bg: "oklch(0.50 0.18 155 / 0.18)", fg: "oklch(0.75 0.16 155)", border: "oklch(0.55 0.18 155 / 0.35)" },
  { bg: "oklch(0.55 0.20 25 / 0.18)",  fg: "oklch(0.75 0.18 25)",  border: "oklch(0.60 0.20 25 / 0.35)" },
  { bg: "oklch(0.60 0.18 75 / 0.18)",  fg: "oklch(0.80 0.16 75)",  border: "oklch(0.65 0.18 75 / 0.35)" },
  { bg: "oklch(0.50 0.20 320 / 0.18)", fg: "oklch(0.75 0.18 320)", border: "oklch(0.55 0.20 320 / 0.35)" },
  { bg: "oklch(0.50 0.18 200 / 0.18)", fg: "oklch(0.75 0.16 200)", border: "oklch(0.55 0.18 200 / 0.35)" },
  { bg: "oklch(0.50 0.18 110 / 0.18)", fg: "oklch(0.80 0.18 110)", border: "oklch(0.55 0.18 110 / 0.35)" },
  { bg: "oklch(0.50 0.20 350 / 0.18)", fg: "oklch(0.75 0.18 350)", border: "oklch(0.55 0.20 350 / 0.35)" },
];

const sizeClassMap: Record<string, string> = {
  sm: "text-xs px-2 py-0.5",
  md: "text-xs px-2.5 py-0.5",
  lg: "text-sm px-3 py-1",
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function GroupBadge({ group, label, ratio, className, size, onClick }: GroupBadgeProps) {
  const color = PALETTE[hashString(group || "") % PALETTE.length];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        sizeClassMap[size ?? "sm"],
        onClick && "cursor-pointer",
        className
      )}
      style={{
        backgroundColor: color.bg,
        color: color.fg,
        borderColor: color.border,
      }}
      onClick={onClick}
    >
      <span className="truncate">{label || group || "-"}</span>
      {ratio !== undefined && ratio !== null && ratio !== "" ? (
        <span className="ml-1 opacity-70">{ratio}x</span>
      ) : null}
    </span>
  );
}
