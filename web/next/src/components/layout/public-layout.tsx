"use client";

import { PublicHeader } from "./public-header";
import { useSystemConfigStore } from "@/stores/system-config-store";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const footerHtml = useSystemConfigStore((s) => s.getFooterHtml());
  const systemName = useSystemConfigStore((s) => s.getSystemName());
  const currentYear = new Date().getFullYear();
  const attribution = (
    <a
      href="https://github.com/QuantumNous/new-api"
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
    >
      New API
    </a>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      {footerHtml ? (
        <footer className="border-t border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">
          <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
          <div className="mt-2 text-xs">&copy; {currentYear} {attribution}</div>
        </footer>
      ) : (
        <footer className="border-t border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">
          &copy; {currentYear} {systemName}. {attribution}
        </footer>
      )}
    </div>
  );
}
