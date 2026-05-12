"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Key,
  Radio,
  Cpu,
  Users,
  Wallet,
  MessageSquare,
  BarChart3,
  Crown,
  FileText,
  CreditCard,
  Settings,
  ShieldCheck,
  UserCircle,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, ROLE } from "@/stores/auth-store";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export function useNavItems(): NavItem[] {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.auth.user);
  const isAdmin = (user?.role ?? 0) >= ROLE.ADMIN;

  const items: NavItem[] = [
    { title: t("nav.playground"), href: "/playground", icon: MessageSquare },
    { title: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.keys"), href: "/keys", icon: Key },
    { title: t("nav.usageLogs"), href: "/usage-logs", icon: BarChart3 },
    { title: t("nav.wallet"), href: "/wallet", icon: Wallet },
    { title: t("nav.subscriptions"), href: "/my-subscriptions", icon: Crown },
    { title: t("nav.invoices"), href: "/invoices", icon: FileText },
    { title: t("nav.profile"), href: "/profile", icon: UserCircle },
    // Admin
    { title: t("nav.channels"), href: "/channels", icon: Radio, adminOnly: true },
    { title: t("nav.models"), href: "/models", icon: Cpu, adminOnly: true },
    { title: t("nav.users"), href: "/users", icon: Users, adminOnly: true },
    { title: t("nav.redemptionCodes"), href: "/redemption-codes", icon: CreditCard, adminOnly: true },
    { title: t("nav.subscriptions"), href: "/subscriptions", icon: Crown, adminOnly: true },
    { title: t("nav.adminTokens"), href: "/admin-tokens", icon: ShieldCheck, adminOnly: true },
    { title: t("nav.performance"), href: "/performance-metrics", icon: Gauge, adminOnly: true },
    { title: t("nav.systemSettings"), href: "/system-settings", icon: Settings, adminOnly: true },
  ];

  return items.filter((item) => !item.adminOnly || isAdmin);
}

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const items = useNavItems();

  return (
    <nav className="flex flex-col gap-1 px-2">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-[var(--sidebar-accent)] text-[var(--foreground)]"
                : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--foreground)]"
            )}
            title={collapsed ? item.title : undefined}
            onClick={onNavigate}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.title}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
