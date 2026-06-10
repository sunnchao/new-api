"use client";

import * as React from "react";
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react";
import { cn } from "@/lib/utils";

const Collapsible = React.forwardRef<
  HTMLDivElement,
  CollapsiblePrimitive.Root.Props
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Root
    ref={ref}
    className={cn(className)}
    {...props}
  />
));
Collapsible.displayName = "Collapsible";

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  CollapsiblePrimitive.Trigger.Props & { asChild?: boolean }
>(({ asChild, className, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return (
      <CollapsiblePrimitive.Trigger
        ref={ref}
        render={React.cloneElement(children, {
          className: cn((children.props as { className?: string }).className, className),
        } as React.Attributes)}
        {...props}
      />
    );
  }

  return (
    <CollapsiblePrimitive.Trigger
      ref={ref}
      className={cn(className)}
      {...props}
    >
      {children}
    </CollapsiblePrimitive.Trigger>
  );
});
CollapsibleTrigger.displayName = "CollapsibleTrigger";

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsiblePrimitive.Panel.Props
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Panel
    ref={ref}
    className={cn(className)}
    {...props}
  />
));
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
