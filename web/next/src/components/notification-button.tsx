"use client";

import * as React from "react";
import { Bell, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getNotice, type ApiResponse } from "@/lib/api";
import { useStatus } from "@/hooks/use-status";
import { useNotificationStore } from "@/stores/notification-store";

interface AnnouncementItem {
  key?: string;
  id?: string | number;
  title?: string;
  content?: string;
  date?: string;
  created_at?: string | number;
  publishDate?: string;
  extra?: string;
  type?: string;
  link?: string;
}

export interface NotificationButtonProps {
  className?: string;
}

function hashString(input: string): string {
  let hash = 0;
  if (!input) return "0";

  for (let i = 0; i < input.length; i += 1) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }

  return hash.toString(36);
}

function announcementKey(item: AnnouncementItem, idx: number): string {
  if (item.key !== undefined && item.key !== null) return `key:${item.key}`;
  if (item.id !== undefined && item.id !== null) return `id:${item.id}`;

  return `hash:${hashString(
    JSON.stringify({
      idx,
      title: item.title ?? "",
      content: item.content ?? "",
      extra: item.extra ?? "",
      publishDate: item.publishDate ?? "",
      type: item.type ?? "",
      link: item.link ?? "",
    })
  )}`;
}

function formatDate(value: string | number | undefined): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") {
    const timestamp = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(timestamp).toLocaleDateString();
  }
  return value;
}

export function NotificationButton({ className }: NotificationButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"notice" | "timeline">(
    "notice"
  );
  const { status, loading: statusLoading } = useStatus();
  const lastReadNotice = useNotificationStore((s) => s.lastReadNotice);
  const setLastReadNotice = useNotificationStore((s) => s.setLastReadNotice);
  const isRead = useNotificationStore((s) => s.isAnnouncementRead);
  const addRead = useNotificationStore((s) => s.addReadAnnouncement);

  const fetchNotices = React.useCallback(async () => {
    try {
      setLoading(true);
      const res: ApiResponse = await getNotice();
      const raw = res.data;
      let list: AnnouncementItem[] = [];
      if (Array.isArray(raw)) {
        list = raw as AnnouncementItem[];
      } else if (typeof raw === "string" && raw.trim()) {
        setNotice(raw.trim());
        return;
      } else if (raw && typeof raw === "object") {
        list = [raw as AnnouncementItem];
      }
      setNotice(
        list
          .map((item) => [item.title, item.content].filter(Boolean).join("\n"))
          .filter(Boolean)
          .join("\n\n")
      );
    } catch {
      setNotice("");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const announcements = React.useMemo(() => {
    const rawAnnouncements = status?.announcements;
    if (status?.announcements_enabled !== true || !Array.isArray(rawAnnouncements)) {
      return [];
    }
    return rawAnnouncements
      .filter(
        (item): item is AnnouncementItem =>
          typeof item === "object" && item !== null
      )
      .slice(0, 20);
  }, [status]);

  const markAnnouncementsRead = React.useCallback(() => {
    announcements.forEach((item, idx) => addRead(announcementKey(item, idx)));
  }, [addRead, announcements]);

  const unreadNoticeCount = notice && notice !== lastReadNotice ? 1 : 0;
  const unreadAnnouncementCount = announcements.filter(
    (item, idx) => !isRead(announcementKey(item, idx))
  ).length;
  const unreadCount = unreadNoticeCount + unreadAnnouncementCount;

  const handleTabChange = (value: string) => {
    const nextTab = value === "timeline" ? "timeline" : "notice";
    setActiveTab(nextTab);
    if (nextTab === "timeline") {
      markAnnouncementsRead();
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      if (notice) {
        setLastReadNotice(notice);
      }
      if (activeTab === "timeline") {
        markAnnouncementsRead();
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className={cn("relative text-[var(--muted)]", className)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center px-1 text-[10px] leading-none"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(26rem,calc(100vw-1rem))] p-0"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold">System Announcements</h4>
            <p className="text-xs text-[var(--muted)]">
              Latest platform updates and notices
            </p>
          </div>
          <span className="text-xs text-[var(--muted)]">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </span>
        </div>
        <Separator />
        <div className="p-3">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notice" className="gap-1.5">
                <Bell className="h-3.5 w-3.5" />
                Notice
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1.5">
                <Megaphone className="h-3.5 w-3.5" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notice">
              <ScrollArea className="h-72">
                {loading ? (
                  <div className="p-6 text-center text-sm text-[var(--muted)]">
                    Loading...
                  </div>
                ) : notice ? (
                  <div className="whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--surface)]/40 p-3 text-sm leading-6 text-[var(--foreground)]">
                    {notice}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-[var(--muted)]">
                    No notifications
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="timeline">
              <ScrollArea className="h-72">
                {statusLoading ? (
                  <div className="p-6 text-center text-sm text-[var(--muted)]">
                    Loading...
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[var(--muted)]">
                    No timeline entries
                  </div>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {announcements.map((item, idx) => {
                      const k = announcementKey(item, idx);
                      const unread = !isRead(k);
                      const date = formatDate(
                        item.publishDate ?? item.date ?? item.created_at
                      );
                      return (
                        <li
                          key={k}
                          className={cn(
                            "flex gap-3 px-1 py-3 text-sm",
                            unread && "bg-[var(--surface)]/40"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                              unread
                                ? "bg-[var(--accent)]"
                                : "bg-[var(--border)]"
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            {item.title ? (
                              <p className="font-medium text-[var(--foreground)]">
                                {item.title}
                              </p>
                            ) : null}
                            {item.content ? (
                              <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
                                {item.content}
                              </p>
                            ) : null}
                            {item.extra ? (
                              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                                {item.extra}
                              </p>
                            ) : null}
                            {date ? (
                              <p className="mt-1 text-[10px] text-[var(--muted)]">
                                {date}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
}
