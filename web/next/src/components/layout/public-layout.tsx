"use client";

import { PublicHeader } from "./public-header";
import { useSystemConfigStore } from "@/stores/system-config-store";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const footerHtml = useSystemConfigStore((s) => s.getFooterHtml());
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      {footerHtml ? (
        <footer
          className="border-t border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]"
          dangerouslySetInnerHTML={{ __html: footerHtml }}
        />
      ) : (
        <footer className="border-t border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">
          &copy; {currentYear} AI API Gateway
        </footer>
      )}
    </div>
  );
}
