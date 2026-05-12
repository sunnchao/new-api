"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LogOut, User, Wallet, Globe, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";

const LANGUAGES: Array<{ code: string; label: string; native: string }> = [
  { code: "en", label: "English", native: "English" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "fr", label: "French", native: "Français" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
];

export interface ProfileDropdownProps {
  user: AuthUser;
  className?: string;
  align?: "start" | "center" | "end";
}

export function ProfileDropdown({
  user,
  className,
  align = "end",
}: ProfileDropdownProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const reset = useAuthStore((s) => s.reset);

  const initials = user.display_name
    ? user.display_name.slice(0, 2).toUpperCase()
    : user.username?.slice(0, 2).toUpperCase() ?? "??";

  const handleLogout = async () => {
    try {
      const { default: api } = await import("@/lib/api");
      await api.get("/api/user/logout");
    } catch {
      // ignore
    }
    reset();
    router.push("/sign-in");
  };

  const changeLanguage = async (code: string) => {
    try {
      await i18n.changeLanguage(code);
      if (typeof window !== "undefined") {
        localStorage.setItem("i18nextLng", code);
      }
      const { default: api } = await import("@/lib/api");
      await api.put("/api/user/self", { language: code });
    } catch {
      // ignore
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label="User menu"
          className={cn("relative h-8 w-8 rounded-full p-0", className)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url} alt={user.username} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.display_name || user.username}
            </p>
            <p className="text-xs leading-none text-[var(--muted)]">
              {user.email || user.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User className="mr-2 h-4 w-4" />
          {t("nav.profile")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/wallet")}>
          <Wallet className="mr-2 h-4 w-4" />
          {t("nav.wallet")}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Globe className="mr-2 h-4 w-4" />
            <span>{t("common.language") || "Language"}</span>
            <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
              >
                <span>{lang.native}</span>
                <span className="ml-2 text-xs text-[var(--muted)]">
                  {lang.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-[var(--destructive)]"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("common.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
