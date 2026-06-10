"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useSystemConfigStore } from "@/stores/system-config-store";
import { NotificationButton } from "@/components/notification-button";
import { Button } from "@/components/ui/button";
import { ChevronDown, Globe, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { saveLanguagePreference } from "@/i18n/language";
import { parseHeaderNavModulesFromStatus } from "@/lib/nav-modules";
import { useStatus } from "@/hooks/use-status";
import { useRouter } from "next/navigation";

export function PublicHeader() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const systemName = useSystemConfigStore((s) => s.getSystemName());
  const user = useAuthStore((s) => s.auth.user);
  const { status } = useStatus();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const displaySystemName = mounted ? systemName : "New API";
  const displayUser = mounted ? user : null;
  const statusRecord = status as Record<string, unknown> | null;
  const navModules = useMemo(
    () => parseHeaderNavModulesFromStatus(statusRecord),
    [statusRecord],
  );
  const docsLink =
    typeof statusRecord?.docs_link === "string" && statusRecord.docs_link.trim()
      ? statusRecord.docs_link
      : null;

  const linkClassName =
    "text-[var(--muted)] hover:text-[var(--foreground)] transition-colors";
  const navLinks = [
    navModules.home !== false
      ? { href: "/", label: t("common.home", "Home") }
      : null,
    navModules.console !== false
      ? { href: "/dashboard", label: t("Console") }
      : null,
    navModules.pricing.enabled
      ? { href: "/pricing", label: t("Model Square") }
      : null,
    navModules.subscriptions.enabled
      ? {
          href: "/subscription-plans",
          label: t("nav.subscriptionPlans", "Subscription Plans"),
        }
      : null,
    navModules.rankings.enabled
      ? { href: "/rankings", label: t("nav.rankings", "Rankings") }
      : null,
    docsLink && navModules.docs !== false
      ? { href: docsLink, label: t("Docs"), external: true }
      : null,
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    external?: boolean;
  }>;

  const vibeCodingLinks = [
    { href: "/vibecoding/claude", label: "Claude Code" },
    { href: "/vibecoding/codex", label: "Codex Code" },
    { href: "/vibecoding/gemini", label: "Gemini Code" },
    { href: "/openclaw", label: "OpenClaw" },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const languages = [
    { code: "en", label: "English" },
    { code: "zh", label: "中文" },
    { code: "fr", label: "Français" },
    { code: "ru", label: "Русский" },
    { code: "ja", label: "日本語" },
    { code: "vi", label: "Tiếng Việt" },
  ];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    saveLanguagePreference(code);
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm px-4 lg:px-8">
      <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
        <div className="h-7 w-7 rounded-md bg-[var(--accent)] flex items-center justify-center shrink-0">
          <span className="text-[var(--accent-foreground)] text-sm font-bold">N</span>
        </div>
        <span className="hidden sm:inline">{displaySystemName}</span>
      </Link>

      <nav className="hidden md:flex items-center gap-6 text-sm">
        {navLinks.map((link) =>
          link.external ? (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {link.label}
            </a>
          ) : (
            <Link key={link.href} href={link.href} className={linkClassName}>
              {link.label}
            </Link>
          ),
        )}
        {navModules.vibecoding !== false ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-0 py-0 text-sm font-normal text-[var(--muted)] hover:bg-transparent hover:text-[var(--foreground)]"
              >
                VibeCoding
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {vibeCodingLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-[var(--surface)] focus:bg-[var(--surface)]"
                >
                  {link.label}
                </Link>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {navModules.about !== false ? (
          <Link href="/about" className={linkClassName}>
            {t("nav.about", "About")}
          </Link>
        ) : null}
        {navModules.contact !== false ? (
          <Link href="/contact" className={linkClassName}>
            {t("nav.contact", "Contact us")}
          </Link>
        ) : null}
      </nav>

      <div className="flex items-center gap-2">
        <NotificationButton />

        {/* Language */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[var(--muted)]">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((lang) => (
              <DropdownMenuItem key={lang.code} onClick={() => changeLanguage(lang.code)}>
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme */}
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--muted)]"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Auth CTA */}
        {displayUser ? (
          <Button size="sm" onClick={() => router.push("/dashboard")}>
            {t("common.dashboard")}
          </Button>
        ) : (
          <Button size="sm" onClick={() => router.push("/sign-in")}>
            {t("auth.signIn")}
          </Button>
        )}
      </div>
    </header>
  );
}
