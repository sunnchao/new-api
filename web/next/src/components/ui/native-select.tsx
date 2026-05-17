import { cn } from "@/lib/utils";

export function NativeSelectOption({
  className,
  children,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option className={cn("", className)} {...props}>
      {children}
    </option>
  );
}

export function NativeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
