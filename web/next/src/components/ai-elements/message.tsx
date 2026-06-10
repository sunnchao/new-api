"use client";

import * as React from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type MessageRole = "user" | "assistant" | "system";

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  role: MessageRole;
  hideAvatar?: boolean;
}

const roleIcon: Record<MessageRole, React.ElementType> = {
  user: User,
  assistant: Bot,
  system: Bot,
};

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ role, hideAvatar, className, children, ...props }, ref) => {
    const isUser = role === "user";
    const Icon = roleIcon[role];

    return (
      <div
        ref={ref}
        data-role={role}
        className={cn(
          "group/message flex w-full items-start gap-3",
          isUser ? "flex-row-reverse" : "flex-row",
          className
        )}
        {...props}
      >
        {!hideAvatar && (
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] transition-colors duration-150",
              isUser
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--surface)] text-[var(--foreground)]"
            )}
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div
          className={cn(
            "relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed transition-colors duration-150",
            isUser
              ? "bg-[var(--accent)] text-[var(--accent-foreground)] rounded-br-sm"
              : "bg-[var(--surface)] text-[var(--foreground)] rounded-bl-sm border border-[var(--border)]"
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);
Message.displayName = "Message";

export type MessageContentProps = React.HTMLAttributes<HTMLDivElement>;

const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}
      {...props}
    />
  )
);
MessageContent.displayName = "MessageContent";

export { Message, MessageContent };
