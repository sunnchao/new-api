"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
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
  ExternalLink,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { useAuthStore, ROLE } from "@/stores/auth-store";
import { useChatPresets } from "@/features/chat/hooks/use-chat-presets";
import { ChatTokenPickerDialog } from "@/features/chat/components/chat-token-picker-dialog";
import { useEnabledChatTokens } from "@/features/chat/hooks/use-active-chat-key";
import {
  chatLinkRequiresApiKey,
  resolveChatUrl,
  type ChatPreset,
} from "@/features/chat/lib/chat-links";
import { fetchTokenKey } from "@/features/keys/api";
import type { NavGroup } from "@/components/layout/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  requiredRole?: number;
  configUrls?: string[];
  chatPreset?: ChatPreset;
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
        .filter((preset) => preset.type !== "fluent")
        .map((preset) => ({
          title: preset.name,
          href:
            preset.type === "web"
              ? `/chat/${preset.id}`
              : `#chat-preset-${preset.id}`,
          icon: MessageSquare,
          chatPreset: preset,
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
    { title: t("Model deployments"), href: "/models/deployments", icon: Cpu, adminOnly: true },
    { title: t("nav.users"), href: "/users", icon: Users, adminOnly: true },
    { title: t("nav.redemptionCodes"), href: "/redemption-codes", icon: CreditCard, adminOnly: true },
    {
      title: t("nav.subscriptions"),
      href: "/subscriptions",
      icon: Crown,
      adminOnly: true,
      configUrls: ["/subscriptions", "/subscriptions?tab=all-subscriptions"],
    },
    { title: t("Ticket Management"), href: "/tickets?legacy_admin=1", icon: TicketCheck, adminOnly: true },
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
  const { t } = useTranslation();
  const pathname = usePathname();
  const items = useNavItems();
  const { serverAddress } = useChatPresets();
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);
  const loadingPresetIdRef = useRef<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<ChatPreset | null>(null);

  const {
    data: tokens = [],
    isLoading: tokensLoading,
    error: tokensError,
  } = useEnabledChatTokens(pickerOpen);

  const userItems = items.filter((i) => !i.adminOnly);
  const adminItems = items.filter((i) => i.adminOnly);

  const launchExternalUrl = useCallback(
    (preset: ChatPreset, apiKey?: string) => {
      const resolvedUrl = resolveChatUrl({
        template: preset.url,
        apiKey,
        serverAddress,
      });

      if (!resolvedUrl) {
        toast.error(t("Invalid chat link. Please contact the administrator."));
        return;
      }

      window.open(resolvedUrl, "_blank", "noopener");
      onNavigate?.();
    },
    [onNavigate, serverAddress, t]
  );

  const handleTokenSelected = useCallback(
    async (tokenId: number) => {
      const preset = pendingPreset;
      setPickerOpen(false);
      if (!preset) return;

      loadingPresetIdRef.current = preset.id;
      setLoadingPresetId(preset.id);
      try {
        const result = await fetchTokenKey(tokenId);
        if (!result.success || !result.data?.key) {
          throw new Error(result.message || t("Failed to load API key"));
        }
        launchExternalUrl(preset, `sk-${result.data.key}`);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : t(
                "Unable to prepare chat link. Please ensure you have an enabled API key."
              );
        toast.error(message);
      } finally {
        loadingPresetIdRef.current = null;
        setLoadingPresetId(null);
        setPendingPreset(null);
      }
    },
    [launchExternalUrl, pendingPreset, t]
  );

  const handleOpenExternal = useCallback(
    (preset: ChatPreset) => {
      const needsKey = chatLinkRequiresApiKey(preset.url);

      if (needsKey && loadingPresetIdRef.current) {
        toast.info(t("Preparing your chat link, please try again in a moment."));
        return;
      }

      if (needsKey) {
        setPendingPreset(preset);
        setPickerOpen(true);
        return;
      }

      launchExternalUrl(preset);
    },
    [launchExternalUrl, t]
  );

  const renderItems = (navItems: NavItem[]) =>
    navItems.map((item) => {
      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
      const isExternalPreset =
        item.chatPreset !== undefined && item.chatPreset.type !== "web";
      const isLoading = loadingPresetId === item.chatPreset?.id;
      const itemContent = (
        <>
          {isActive && !collapsed && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-[var(--accent)]" />
          )}
          <item.icon className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isActive ? "text-[var(--accent)]" : "text-[var(--sidebar-muted)] group-hover:text-[var(--foreground)]"
          )} />
          {!collapsed && <span className="min-w-0 flex-1 truncate">{item.title}</span>}
          {isExternalPreset && !collapsed && (
            isLoading ? (
              <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin opacity-70" />
            ) : (
              <ExternalLink className="ml-auto h-4 w-4 shrink-0 opacity-70" />
            )
          )}
        </>
      );
      const linkEl = isExternalPreset ? (
        <button
          key={item.href}
          type="button"
          className={cn(
            "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-all relative",
            collapsed ? "justify-center px-2" : "",
            "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--foreground)]",
            isLoading ? "cursor-wait opacity-80" : ""
          )}
          disabled={isLoading}
          onClick={() => {
            if (item.chatPreset) handleOpenExternal(item.chatPreset);
          }}
        >
          {itemContent}
        </button>
      ) : (
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
          {itemContent}
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
      <ChatTokenPickerDialog
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (!open) {
            setPendingPreset(null);
          }
        }}
        tokens={tokens}
        isLoading={tokensLoading}
        error={tokensError as Error | null}
        onSelect={(tokenId) => void handleTokenSelected(tokenId)}
      />
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
