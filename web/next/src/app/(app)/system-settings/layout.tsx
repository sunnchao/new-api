"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { cn } from "@/lib/utils";
import {
  Globe,
  ShieldCheck,
  CreditCard,
  FileText,
  Cpu,
  Wrench,
  Lock,
} from "lucide-react";
import { getSiteSectionNavItems, SITE_DEFAULT_SECTION } from "@/features/system-settings/site/section-registry";
import { getAuthSectionNavItems, AUTH_DEFAULT_SECTION } from "@/features/system-settings/auth/section-registry";
import { getBillingSectionNavItems, BILLING_DEFAULT_SECTION } from "@/features/system-settings/billing/section-registry";
import { getModelsSectionNavItems, MODELS_DEFAULT_SECTION } from "@/features/system-settings/models/section-registry";
import { getSecuritySectionNavItems, SECURITY_DEFAULT_SECTION } from "@/features/system-settings/security/section-registry";
import { getContentSectionNavItems, CONTENT_DEFAULT_SECTION } from "@/features/system-settings/content/section-registry";
import { getOperationsSectionNavItems, OPERATIONS_DEFAULT_SECTION } from "@/features/system-settings/operations/section-registry";

type CategoryConfig = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultSection: string;
  getSectionNavItems: (t: TFunction) => Array<{ title: string; url: string }>;
};

const CATEGORIES: CategoryConfig[] = [
  {
    id: "site",
    label: "Site & Branding",
    icon: Globe,
    defaultSection: SITE_DEFAULT_SECTION,
    getSectionNavItems: getSiteSectionNavItems,
  },
  {
    id: "auth",
    label: "Authentication",
    icon: ShieldCheck,
    defaultSection: AUTH_DEFAULT_SECTION,
    getSectionNavItems: getAuthSectionNavItems,
  },
  {
    id: "billing",
    label: "Billing & Payment",
    icon: CreditCard,
    defaultSection: BILLING_DEFAULT_SECTION,
    getSectionNavItems: getBillingSectionNavItems,
  },
  {
    id: "models",
    label: "Models & Routing",
    icon: Cpu,
    defaultSection: MODELS_DEFAULT_SECTION,
    getSectionNavItems: getModelsSectionNavItems,
  },
  {
    id: "security",
    label: "Security & Limits",
    icon: Lock,
    defaultSection: SECURITY_DEFAULT_SECTION,
    getSectionNavItems: getSecuritySectionNavItems,
  },
  {
    id: "content",
    label: "Console Content",
    icon: FileText,
    defaultSection: CONTENT_DEFAULT_SECTION,
    getSectionNavItems: getContentSectionNavItems,
  },
  {
    id: "operations",
    label: "Operations",
    icon: Wrench,
    defaultSection: OPERATIONS_DEFAULT_SECTION,
    getSectionNavItems: getOperationsSectionNavItems,
  },
];

export default function SystemSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname() ?? "";

  const activeCategory = (() => {
    const match = pathname.match(/^\/system-settings\/([^/]+)/);
    return match?.[1] ?? "site";
  })();

  const activeSection = (() => {
    const match = pathname.match(/^\/system-settings\/[^/]+\/([^/]+)/);
    return match?.[1] ?? "";
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("nav.systemSettings", { defaultValue: "System Settings" })}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {t("systemSettings.intro", {
            defaultValue:
              "Configure site behavior, authentication, billing, content, models, operations and security.",
          })}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <nav className="col-span-12 md:col-span-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/20 p-2 md:sticky md:top-4">
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {CATEGORIES.map((c) => {
                const isActive = activeCategory === c.id;
                const Icon = c.icon;
                const sections = c.getSectionNavItems(t);

                return (
                  <div key={c.id} className="flex md:flex-col">
                    <Link
                      href={`/system-settings/${c.id}/${c.defaultSection}`}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all",
                        isActive
                          ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                          : "text-[var(--muted)] hover:bg-[var(--background)]/50 hover:text-[var(--foreground)]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive && "text-[var(--accent)]"
                        )}
                      />
                      <span>{c.label}</span>
                    </Link>

                    {/* Section links - shown when this category is active */}
                    {isActive && sections.length > 1 && (
                      <div className="hidden md:flex flex-col gap-0.5 ml-6 mt-1 mb-1 border-l border-[var(--border)] pl-3">
                        {sections.map((section) => {
                          const sectionActive =
                            activeSection &&
                            section.url.endsWith(`/${activeSection}`);
                          return (
                            <Link
                              key={section.url}
                              href={section.url}
                              className={cn(
                                "rounded-sm px-2 py-1.5 text-xs whitespace-nowrap transition-all",
                                sectionActive
                                  ? "text-[var(--foreground)] font-medium bg-[var(--background)]/60"
                                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/30"
                              )}
                            >
                              {section.title}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="col-span-12 md:col-span-9">{children}</div>
      </div>
    </div>
  );
}
