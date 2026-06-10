"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
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
  TicketCheck,
  HeartPulse,
  Package,
  ListTodo,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { useAuthStore, ROLE } from "@/stores/auth-store";
import { useChatPresets } from "@/features/chat/hooks/use-chat-presets";
import type { NavGroup } from "@/components/layout/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  requiredRole?: number;
  configUrls?: string[];
}

export function useNavItems(): NavItem[] {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.auth.user);
  const userRole = user?.role ?? ROLE.GUEST;
  const isAdmin = userRole >= ROLE.ADMIN;
  const { chatPresets } = useChatPresets();

  const chatPresetItems = useMemo<NavItem[]>(
    () =>
      chatPresets
        .filter((preset) => preset.type === "web")
        .map((preset) => ({
          title: preset.name,
          href: `/chat/${preset.id}`,
          icon: MessageSquare,
        })),
    [chatPresets]
  );

  const items = useMemo<NavItem[]>(() => [
    { title: t("nav.playground"), href: "/playground", icon: MessageSquare },
    { title: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.keys"), href: "/keys", icon: Key },
    { title: t("nav.tickets"), href: "/tickets", icon: TicketCheck },
    { title: t("nav.usageLogs"), href: "/usage-logs", icon: BarChart3 },
    {
      title: t("Task Logs"),
      href: "/usage-logs/task",
      icon: ListTodo,
      configUrls: ["/usage-logs/drawing", "/usage-logs/task"],
    },
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
    { title: t("nav.adminPackages"), href: "/admin-packages", icon: Package, adminOnly: true },
    { title: t("nav.adminTokens"), href: "/admin-tokens", icon: ShieldCheck, adminOnly: true },
    { title: t("nav.health"), href: "/health", icon: HeartPulse, adminOnly: true },
    { title: t("nav.performance"), href: "/performance-metrics", icon: Gauge, adminOnly: true },
    { title: t("nav.systemSettings"), href: "/system-settings", icon: Settings, adminOnly: true, requiredRole: ROLE.ROOT },
  ], [t]);

  const roleFilteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (item.requiredRole !== undefined) {
          return userRole >= item.requiredRole;
        }
        return !item.adminOnly || isAdmin;
      }),
    [items, isAdmin, userRole]
  );

  const navGroups = useMemo<NavGroup[]>(
    () => [
      {
        title: "Sidebar",
        items: [
          ...roleFilteredItems.map((item) => ({
            title: item.title,
            url: item.href,
            icon: item.icon,
            configUrls: item.configUrls,
          })),
          {
            title: t("Chat"),
            icon: MessageSquare,
            type: "chat-presets" as const,
          },
        ],
      },
    ],
    [roleFilteredItems, t]
  );
  const filteredNavGroups = useSidebarConfig(navGroups);
  const filteredItems = useMemo(
    () => filteredNavGroups[0]?.items ?? [],
    [filteredNavGroups]
  );
  const visibleHrefs = useMemo(
    () =>
      new Set(
        filteredItems
          .map((item) => ("url" in item ? item.url : null))
          .filter((url): url is string => typeof url === "string")
      ),
    [filteredItems]
  );
  const chatPresetsVisible = useMemo(
    () =>
      filteredItems.some(
        (item) => "type" in item && item.type === "chat-presets"
      ),
    [filteredItems]
  );

  const visibleItems = roleFilteredItems.filter((item) =>
    visibleHrefs.has(item.href)
  );
  if (!chatPresetsVisible || chatPresetItems.length === 0) {
    return visibleItems;
  }

  const playgroundIndex = visibleItems.findIndex(
    (item) => item.href === "/playground"
  );
  if (playgroundIndex === -1) {
    return [...chatPresetItems, ...visibleItems];
  }

  return [
    ...visibleItems.slice(0, playgroundIndex + 1),
    ...chatPresetItems,
    ...visibleItems.slice(playgroundIndex + 1),
  ];
}

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const items = useNavItems();

  const userItems = items.filter((i) => !i.adminOnly);
  const adminItems = items.filter((i) => i.adminOnly);

  const renderItems = (navItems: NavItem[]) =>
    navItems.map((item) => {
      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
      const linkEl = (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all relative",
            collapsed ? "justify-center px-2" : "",
            isActive
              ? "bg-[var(--sidebar-accent)] text-[var(--foreground)]"
              : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--foreground)]"
          )}
          onClick={onNavigate}
        >
          {isActive && !collapsed && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-[var(--accent)]" />
          )}
          <item.icon className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isActive ? "text-[var(--accent)]" : "text-[var(--sidebar-muted)] group-hover:text-[var(--foreground)]"
          )} />
          {!collapsed && <span className="truncate">{item.title}</span>}
        </Link>
      );

      if (collapsed) {
        return (
          <Tooltip key={item.href} delayDuration={0}>
            <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
            <TooltipContent side="right" className="text-xs">{item.title}</TooltipContent>
          </Tooltip>
        );
      }
      return linkEl;
    });

  return (
    <TooltipProvider>
      <nav className="flex flex-col gap-0.5 px-2">
        {renderItems(userItems)}
        {adminItems.length > 0 && (
          <>
            <div className="mx-3 my-3 h-px bg-[var(--sidebar-border)]" />
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--sidebar-muted)]">
                Admin
              </div>
            )}
            {renderItems(adminItems)}
          </>
        )}
      </nav>
    </TooltipProvider>
  );
}
