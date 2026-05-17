export function Suggestions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 flex-wrap">{children}</div>;
}

export function Suggestion({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="rounded-full border border-[var(--border)] px-3 py-1 text-sm hover:bg-[var(--surface)]"
    >
      {children}
    </button>
  );
}
