import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type StatusKind =
  | "active"
  | "disabled"
  | "pending"
  | "error"
  | "success"
  | "warning";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
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

const MAP: Record<
  StatusKind,
  { variant: BadgeVariant; label: string; dot: string }
> = {
  active: {
    variant: "success",
    label: "Active",
    dot: "bg-[var(--success)]",
  },
  disabled: {
    variant: "secondary",
    label: "Disabled",
    dot: "bg-[var(--muted)]",
  },
  pending: {
    variant: "warning",
    label: "Pending",
    dot: "bg-[var(--warning)]",
  },
  error: {
    variant: "destructive",
    label: "Error",
    dot: "bg-[var(--destructive)]",
  },
  success: {
    variant: "success",
    label: "Success",
    dot: "bg-[var(--success)]",
  },
  warning: {
    variant: "warning",
    label: "Warning",
    dot: "bg-[var(--warning)]",
  },
};

const STATUS_VARIANT_MAP: Record<StatusVariant, { badge: BadgeVariant; dot: string }> = {
  success: { badge: "success", dot: "bg-[var(--success)]" },
  warning: { badge: "warning", dot: "bg-[var(--warning)]" },
  danger: { badge: "destructive", dot: "bg-[var(--destructive)]" },
  info: { badge: "outline", dot: "bg-sky-500" },
  neutral: { badge: "secondary", dot: "bg-[var(--muted)]" },
  purple: { badge: "outline", dot: "bg-violet-500" },
  amber: { badge: "warning", dot: "bg-amber-500" },
  blue: { badge: "outline", dot: "bg-blue-500" },
  cyan: { badge: "outline", dot: "bg-cyan-500" },
  green: { badge: "success", dot: "bg-green-500" },
  grey: { badge: "secondary", dot: "bg-gray-500" },
  indigo: { badge: "outline", dot: "bg-indigo-500" },
  "light-blue": { badge: "outline", dot: "bg-sky-400" },
  "light-green": { badge: "success", dot: "bg-emerald-400" },
  lime: { badge: "outline", dot: "bg-lime-500" },
  orange: { badge: "warning", dot: "bg-orange-500" },
  pink: { badge: "outline", dot: "bg-pink-500" },
  red: { badge: "destructive", dot: "bg-red-500" },
  teal: { badge: "outline", dot: "bg-teal-500" },
  violet: { badge: "outline", dot: "bg-violet-500" },
  yellow: { badge: "warning", dot: "bg-yellow-500" },
};

export interface StatusBadgeProps {
  status?: StatusKind;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  showDot?: boolean;
  variant?: StatusVariant | null;
  copyable?: boolean;
  size?: 'sm' | 'md' | 'lg' | string;
  autoColor?: string;
}

export function StatusBadge({
  status,
  label,
  children,
  className,
  showDot = true,
  variant,
}: StatusBadgeProps) {
  const cfg = status ? MAP[status] : undefined;
  const variantCfg = variant ? STATUS_VARIANT_MAP[variant] : undefined;
  const badgeVariant = variantCfg?.badge ?? cfg?.variant ?? "secondary";
  const dot = variantCfg?.dot ?? cfg?.dot ?? "bg-[var(--muted)]";

  return (
    <Badge variant={badgeVariant} className={cn("gap-1.5", className)}>
      {showDot ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      ) : null}
      {children ?? label ?? cfg?.label}
    </Badge>
  );
}
