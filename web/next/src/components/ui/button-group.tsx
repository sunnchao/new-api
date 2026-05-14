import { cn } from "@/lib/utils";

export function ButtonGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("inline-flex items-center rounded-md border border-[var(--border)]", className)}
      role="group"
      {...props}
    />
  );
}
