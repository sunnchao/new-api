"use client";

import * as React from "react";
import { Paperclip, Send, Square, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface PromptInputProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "onSubmit" | "onChange" | "value"
  > {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onAttach?: () => void;
  onStop?: () => void;
  disabled?: boolean;
  loading?: boolean;
  model?: string;
  placeholder?: string;
  maxRows?: number;
}

const PromptInput = React.forwardRef<HTMLTextAreaElement, PromptInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      onAttach,
      onStop,
      disabled,
      loading,
      model,
      placeholder = "Send a message...",
      maxRows = 10,
      className,
      ...props
    },
    ref
  ) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      },
      [ref]
    );

    const resize = React.useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto";
      const lineHeight = 20;
      const max = lineHeight * maxRows;
      el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    }, [maxRows]);

    React.useEffect(() => {
      resize();
    }, [value, resize]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (value.trim() && !disabled && !loading) {
          onSubmit(value);
        }
      }
    };

    const canSubmit = value.trim().length > 0 && !disabled && !loading;

    return (
      <div
        className={cn(
          "group/prompt relative rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 transition-colors duration-150 focus-within:border-[var(--accent)]/60 focus-within:bg-[var(--surface)]",
          className
        )}
      >
        <textarea
          ref={setRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="block w-full resize-none bg-transparent px-4 pt-3 pb-12 text-sm leading-5 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none disabled:opacity-50"
          {...props}
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-2 pb-2">
          <div className="flex items-center gap-1">
            {onAttach && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[var(--muted)] hover:text-[var(--foreground)]"
                onClick={onAttach}
                disabled={disabled}
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            )}
            {model && (
              <div className="flex items-center gap-1 rounded-md bg-[var(--background)] px-2 py-1 text-[0.7rem] text-[var(--muted)]">
                <Sparkles className="h-3 w-3 text-[var(--accent)]" />
                <span className="font-mono">{model}</span>
              </div>
            )}
          </div>
          {loading && onStop ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-7 w-7"
              onClick={onStop}
              aria-label="Stop generation"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              className="h-7 w-7"
              onClick={() => canSubmit && onSubmit(value)}
              disabled={!canSubmit}
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  }
);
PromptInput.displayName = "PromptInput";

export { PromptInput };
