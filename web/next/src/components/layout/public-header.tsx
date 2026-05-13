"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useSystemConfigStore } from "@/stores/system-config-store";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export function PublicHeader() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const systemName = useSystemConfigStore((s) => s.getSystemName());
  const user = useAuthStore((s) => s.auth.user);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const displaySystemName = mounted ? systemName : "New API";
  const displayUser = mounted ? user : null;

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

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm px-4 lg:px-8">
      <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
        <div className="h-7 w-7 rounded-md bg-[var(--accent)] flex items-center justify-center shrink-0">
          <span className="text-[var(--accent-foreground)] text-sm font-bold">N</span>
        </div>
        <span className="hidden sm:inline">{displaySystemName}</span>
      </Link>

      <nav className="hidden md:flex items-center gap-6 text-sm">
        <Link href="/pricing" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          {t("nav.pricing", "Pricing")}
        </Link>
        <Link href="/rankings" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          {t("nav.rankings", "Rankings")}
        </Link>
        <Link href="/about" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          {t("nav.about", "About")}
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        {/* Language */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[var(--muted)]">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((lang) => (
              <DropdownMenuItem key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}>
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
