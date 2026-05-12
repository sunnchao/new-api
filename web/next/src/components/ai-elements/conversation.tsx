"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  autoScroll?: boolean;
  maxWidth?: string;
}

const Conversation = React.forwardRef<HTMLDivElement, ConversationProps>(
  ({ autoScroll = true, maxWidth = "48rem", className, children, ...props }, ref) => {
    const innerRef = React.useRef<HTMLDivElement | null>(null);
    const endRef = React.useRef<HTMLDivElement | null>(null);
    const [atBottom, setAtBottom] = React.useState(true);

    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [ref]
    );

    const handleScroll = React.useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      const threshold = 32;
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setAtBottom(distance < threshold);
    }, []);

    React.useEffect(() => {
      if (!autoScroll || !atBottom) return;
      const el = innerRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [children, autoScroll, atBottom]);

    return (
      <div
        ref={setRef}
        onScroll={handleScroll}
        className={cn(
          "relative flex-1 overflow-y-auto scroll-smooth",
          className
        )}
        {...props}
      >
        <div
          className="mx-auto flex w-full flex-col gap-4 px-4 py-6"
          style={{ maxWidth }}
        >
          {children}
          <div ref={endRef} aria-hidden className="h-px w-full" />
        </div>
      </div>
    );
  }
);
Conversation.displayName = "Conversation";

export interface ConversationItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const ConversationItem = React.forwardRef<HTMLDivElement, ConversationItemProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5", className)} {...props} />
  )
);
ConversationItem.displayName = "ConversationItem";

export { Conversation, ConversationItem };
