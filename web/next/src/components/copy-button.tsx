"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface CopyButtonProps {
  value: string;
  size?: "sm" | "md" | "default" | "lg" | "icon";
  className?: string;
  iconClassName?: string;
  label?: string;
  tooltip?: string;
  successTooltip?: string;
  variant?: "ghost" | "outline" | "default" | "secondary" | "destructive";
  children?: React.ReactNode;
  "aria-label"?: string;
}

export function CopyButton({
  value,
  size = "md",
  className,
  iconClassName,
  label,
  tooltip,
  successTooltip,
  children,
  "aria-label": ariaLabel,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success(successTooltip ?? "Copied");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const dims =
    size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const resolvedLabel = ariaLabel ?? tooltip ?? label ?? "Copy";

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={resolvedLabel}
      title={copied ? successTooltip ?? "Copied" : resolvedLabel}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        dims,
        className
      )}
    >
      {copied ? (
        <Check className={cn(iconSize, "text-[var(--success)]", iconClassName)} />
      ) : (
        <Copy className={cn(iconSize, iconClassName)} />
      )}
      {children}
    </button>
  );
}
