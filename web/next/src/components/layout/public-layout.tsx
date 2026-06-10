"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicHeader } from "./public-header";
import { useSystemConfigStore } from "@/stores/system-config-store";

export function PublicLayout({
  children,
  showMainContainer = true,
}: {
  children: React.ReactNode;
  showMainContainer?: boolean;
}) {
  const persistedFooterHtml = useSystemConfigStore((s) => s.getFooterHtml());
  const persistedSystemName = useSystemConfigStore((s) => s.getSystemName());
  const [mounted, setMounted] = useState(false);
  const currentYear = new Date().getFullYear();
  const footerHtml = mounted ? persistedFooterHtml || "" : "";
  const systemName = mounted ? persistedSystemName : "New API";
  const safeFooterHtml = useMemo(
    () => footerHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ""),
    [footerHtml],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <main className="flex-1">
        {showMainContainer ? (
          <div className="container mx-auto px-4 py-6">{children}</div>
        ) : (
          children
        )}
      </main>
      {footerHtml ? (
        <footer className="border-t border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">
          <div dangerouslySetInnerHTML={{ __html: safeFooterHtml }} />
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
