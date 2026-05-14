"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, indeterminate, ...props }, ref) => {
  const innerRef = React.useRef<React.ComponentRef<typeof CheckboxPrimitive.Root>>(null);
  React.useImperativeHandle(ref, () => innerRef.current!);

  React.useEffect(() => {
    if (innerRef.current) {
      const el = innerRef.current as unknown as HTMLButtonElement;
      if (indeterminate) {
        el.dataset.state = 'indeterminate';
        el.setAttribute('data-state', 'indeterminate');
      }
    }
  }, [indeterminate]);

  return (
    <CheckboxPrimitive.Root
      ref={innerRef}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-[var(--border)] shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:text-[var(--accent-foreground)]",
        indeterminate && "data-[state=indeterminate]:bg-[var(--accent)] data-[state=indeterminate]:border-[var(--accent)] data-[state=indeterminate]:text-[var(--accent-foreground)]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {indeterminate ? <Minus className="h-3 w-3" /> : <Check className="h-3 w-3" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
