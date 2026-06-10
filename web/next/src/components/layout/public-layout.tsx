"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PublicHeader } from "./public-header";
import { useSystemConfigStore } from "@/stores/system-config-store";
import { useStatus } from "@/hooks/use-status";

export function PublicLayout({
  children,
  showMainContainer = true,
  showFooter = true,
}: {
  children: React.ReactNode;
  showMainContainer?: boolean;
  showFooter?: boolean;
}) {
  const { t } = useTranslation();
  const { status } = useStatus();
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

  const legalLinks = [
    status?.user_agreement_enabled
      ? {
          key: "user-agreement",
          label: t("User Agreement"),
          href: "/user-agreement",
        }
      : null,
    status?.privacy_policy_enabled
      ? {
          key: "privacy-policy",
          label: t("Privacy Policy"),
          href: "/privacy-policy",
        }
      : null,
  ].filter(
    (item): item is { key: string; label: string; href: string } => item !== null
  );

  const legalLinkContent =
    legalLinks.length > 0 ? (
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
        {legalLinks.map((item, index) => (
          <span key={item.key} className="inline-flex items-center gap-3">
            {index > 0 && (
              <span aria-hidden="true" className="text-[var(--muted)] opacity-50">
                &middot;
              </span>
            )}
            <Link
              href={item.href}
              className="transition-colors hover:text-[var(--foreground)]"
            >
              {item.label}
            </Link>
          </span>
        ))}
      </div>
    ) : null;

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
      {showFooter ? (
        footerHtml ? (
          <footer className="border-t border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">
            <div dangerouslySetInnerHTML={{ __html: safeFooterHtml }} />
            <div className="mt-2 text-xs">&copy; {currentYear} {attribution}</div>
            {legalLinkContent}
          </footer>
        ) : (
          <footer className="border-t border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">
            &copy; {currentYear} {systemName}. {attribution}
            {legalLinkContent}
          </footer>
        )
      ) : null}
    </div>
  );
}
