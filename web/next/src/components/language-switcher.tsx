"use client";

import * as React from "react";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { saveLanguagePreference } from "@/i18n/language";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";

const LANGUAGES: Array<{ code: string; label: string; native: string }> = [
  { code: "en", label: "English", native: "English" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "fr", label: "French", native: "Français" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
];

export interface LanguageSwitcherProps {
  className?: string;
  align?: "start" | "center" | "end";
}

export function LanguageSwitcher({
  className,
  align = "end",
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const user = useAuthStore((s) => s.auth.user);
  const current = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);

  const changeLanguage = async (code: string) => {
    try {
      await i18n.changeLanguage(code);
      saveLanguagePreference(code);
    } catch {
      // ignore
    }

    if (user) {
      try {
        const { default: api } = await import("@/lib/api");
        await api.put("/api/user/self", { language: code });
      } catch {
        // ignore
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("Switch language")}
          className={cn("text-[var(--muted)]", className)}
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-40">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="flex items-center justify-between gap-4"
          >
            <span>
              {lang.native}
              <span className="ml-2 text-xs text-[var(--muted)]">
                {lang.label}
              </span>
            </span>
            {current === lang.code ? (
              <Check className="h-4 w-4 text-[var(--accent)]" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
