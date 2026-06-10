"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth-store";
import { useSystemConfigStore } from "@/stores/system-config-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/search";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeCustomizer } from "@/components/theme-customizer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationButton } from "@/components/notification-button";
import {
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  Menu,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.auth.user);
  const reset = useAuthStore((s) => s.reset);
  const systemName = useSystemConfigStore((s) => s.getSystemName());
  const router = useRouter();

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

  const initials = user?.display_name
    ? user.display_name.slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? "??";

  const walletBalance = user ? ((user.quota - user.used_quota) / 500000).toFixed(2) : null;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md px-4 lg:px-6">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo / brand */}
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <div className="h-6 w-6 rounded-md bg-[var(--accent)] flex items-center justify-center shrink-0 lg:hidden">
          <span className="text-[var(--accent-foreground)] text-xs font-bold">N</span>
        </div>
        <span className="text-base hidden sm:inline-block">{systemName}</span>
      </Link>

      <div className="flex-1" />

      <Search className="hidden md:flex" placeholder={t("common.search")} />

      {/* Wallet balance pill */}
      {walletBalance !== null && (
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1 h-8 text-xs font-mono text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent-muted)]"
          onClick={() => router.push("/wallet")}
        >
          <Wallet className="h-3.5 w-3.5" />
          <span>${walletBalance}</span>
        </Button>
      )}

      <NotificationButton className="h-8 w-8" />
      <LanguageSwitcher className="h-8 w-8" />
      <ThemeCustomizer className="hidden h-8 border-0 bg-transparent p-0 lg:flex" />

      {/* Theme toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("System")}
            className="h-8 w-8 text-[var(--muted)]"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 h-4 w-4" />
            {t("Light")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            {t("Dark")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="mr-2 h-4 w-4" />
            {t("System")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User dropdown */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-2 ring-transparent hover:ring-[var(--accent)]/30 transition-all">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url} alt={user.username} />
                <AvatarFallback className="text-xs bg-[var(--accent)]/10 text-[var(--accent)]">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-[var(--destructive)] focus:text-[var(--destructive)]">
              <LogOut className="mr-2 h-4 w-4" />
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="default" size="sm" onClick={() => router.push("/sign-in")}>
          {t("auth.signIn")}
        </Button>
      )}
    </header>
  );
}
