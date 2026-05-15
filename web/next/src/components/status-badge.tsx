import * as React from "react";
import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

export type StatusKind =
  | "active"
  | "disabled"
  | "pending"
  | "error"
  | "success"
  | "warning";

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "purple"
  | "amber"
  | "blue"
  | "cyan"
  | "green"
  | "grey"
  | "indigo"
  | "light-blue"
  | "light-green"
  | "lime"
  | "orange"
  | "pink"
  | "red"
  | "teal"
  | "violet"
  | "yellow";

export const dotColorMap: Record<StatusVariant, string> = {
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--destructive)]",
  info: "bg-sky-500",
  neutral: "bg-[var(--muted)]",
  purple: "bg-violet-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  cyan: "bg-cyan-500",
  green: "bg-green-500",
  grey: "bg-gray-500",
  indigo: "bg-indigo-500",
  "light-blue": "bg-sky-400",
  "light-green": "bg-emerald-400",
  lime: "bg-lime-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  red: "bg-red-500",
  teal: "bg-teal-500",
  violet: "bg-violet-500",
  yellow: "bg-yellow-500",
};

export const textColorMap: Record<StatusVariant, string> = {
  success: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
  info: "text-sky-600 dark:text-sky-400",
  neutral: "text-[var(--muted-foreground)]",
  purple: "text-violet-600 dark:text-violet-400",
  amber: "text-amber-600 dark:text-amber-400",
  blue: "text-blue-600 dark:text-blue-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  green: "text-green-600 dark:text-green-400",
  grey: "text-gray-600 dark:text-gray-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  "light-blue": "text-sky-600 dark:text-sky-400",
  "light-green": "text-emerald-600 dark:text-emerald-400",
  lime: "text-lime-600 dark:text-lime-400",
  orange: "text-orange-600 dark:text-orange-400",
  pink: "text-pink-600 dark:text-pink-400",
  red: "text-red-600 dark:text-red-400",
  teal: "text-teal-600 dark:text-teal-400",
  violet: "text-violet-600 dark:text-violet-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
};

const sizeMap = {
  sm: "text-xs gap-1.5",
  md: "text-xs gap-1.5",
  lg: "text-sm gap-2",
} as const;

/**
 * Deterministically map a string to a StatusVariant.
 * Used by the autoColor prop.
 */
function stringToVariant(str: string): StatusVariant {
  const keys = Object.keys(dotColorMap) as StatusVariant[];
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  return keys[sum % keys.length];
}

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  status?: StatusKind;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  showDot?: boolean;
  variant?: StatusVariant | null;
  copyable?: boolean;
  copyText?: string;
  size?: "sm" | "md" | "lg" | null;
  autoColor?: string;
}

export function StatusBadge({
  status,
  label,
  children,
  className,
  showDot = true,
  variant,
  copyable = true,
  copyText,
  size = "sm",
  autoColor,
  onClick,
  ...props
}: StatusBadgeProps) {
  const { copyToClipboard } = useCopyToClipboard();

  // Status preset map (kept for backward compat)
  const STATUS_MAP: Record<
    StatusKind,
    { variant: StatusVariant; label: string }
  > = {
    active: { variant: "success", label: "Active" },
    disabled: { variant: "neutral", label: "Disabled" },
    pending: { variant: "warning", label: "Pending" },
    error: { variant: "danger", label: "Error" },
    success: { variant: "success", label: "Success" },
    warning: { variant: "warning", label: "Warning" },
  };

  const cfg = status ? STATUS_MAP[status] : undefined;
  const computedVariant: StatusVariant = autoColor
    ? stringToVariant(autoColor)
    : (variant ?? cfg?.variant ?? "neutral");

  const dot = dotColorMap[computedVariant];
  const textClass = textColorMap[computedVariant];

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (copyable) {
      e.stopPropagation();
      copyToClipboard(copyText || label || "");
    }
    onClick?.(e);
  };

  const content =
    children ?? (label ? <span className="truncate">{label}</span> : cfg?.label);

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center font-medium whitespace-nowrap",
        sizeMap[size ?? "sm"],
        textClass,
        copyable &&
          "cursor-pointer transition-opacity hover:opacity-70 active:scale-95",
        className
      )}
      onClick={handleClick}
      title={
        copyable ? `Click to copy: ${copyText || label || ""}` : undefined
      }
      {...props}
    >
      {showDot && (
        <span
          className={cn("inline-block size-1.5 shrink-0 rounded-full", dot)}
          aria-hidden="true"
        />
      )}
      {content}
    </span>
  );
}

export const statusPresets = {
  active: {
    variant: "success" as const,
    label: "Active",
    showDot: true,
  },
  inactive: {
    variant: "neutral" as const,
    label: "Inactive",
    showDot: true,
  },
  invited: {
    variant: "info" as const,
    label: "Invited",
    showDot: true,
  },
  suspended: {
    variant: "danger" as const,
    label: "Suspended",
    showDot: true,
  },
  pending: {
    variant: "warning" as const,
    label: "Pending",
    showDot: true,
  },
} as const;

export type StatusPreset = keyof typeof statusPresets;
