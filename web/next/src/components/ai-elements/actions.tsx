"use client";

import * as React from "react";
import { Copy, Check, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface ActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  onCopy?: () => void | Promise<void>;
  onRegenerate?: () => void | Promise<void>;
  onThumbsUp?: () => void | Promise<void>;
  onThumbsDown?: () => void | Promise<void>;
  copyText?: string;
  alwaysVisible?: boolean;
  feedback?: "up" | "down" | null;
}

interface ActionButtonProps {
  label: string;
  onClick?: () => void | Promise<void>;
  icon: React.ReactNode;
  active?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, onClick, icon, active }) => {
  if (!onClick) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-150",
            active && "text-[var(--accent)]"
          )}
          onClick={() => void onClick()}
          aria-label={label}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
};

const Actions = React.forwardRef<HTMLDivElement, ActionsProps>(
  (
    {
      onCopy,
      onRegenerate,
      onThumbsUp,
      onThumbsDown,
      copyText,
      alwaysVisible,
      feedback,
      className,
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = React.useCallback(async () => {
      if (onCopy) {
        await onCopy();
      } else if (copyText !== undefined) {
        try {
          await navigator.clipboard.writeText(copyText);
        } catch {
          // ignore
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }, [onCopy, copyText]);

    const hasCopy = Boolean(onCopy) || copyText !== undefined;

    return (
      <TooltipProvider delayDuration={200}>
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-0.5 transition-opacity duration-150",
            alwaysVisible ? "opacity-100" : "opacity-0 group-hover/message:opacity-100",
            className
          )}
          {...props}
        >
          {hasCopy && (
            <ActionButton
              label={copied ? "Copied" : "Copy"}
              onClick={handleCopy}
              icon={
                copied ? (
                  <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )
              }
            />
          )}
          <ActionButton
            label="Regenerate"
            onClick={onRegenerate}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          />
          <ActionButton
            label="Good response"
            onClick={onThumbsUp}
            active={feedback === "up"}
            icon={<ThumbsUp className="h-3.5 w-3.5" />}
          />
          <ActionButton
            label="Bad response"
            onClick={onThumbsDown}
            active={feedback === "down"}
            icon={<ThumbsDown className="h-3.5 w-3.5" />}
          />
        </div>
      </TooltipProvider>
    );
  }
);
Actions.displayName = "Actions";

export { Actions };
