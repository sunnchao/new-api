"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { getNotice, type ApiResponse } from "@/lib/api";
import { useNotificationStore } from "@/stores/notification-store";

interface NoticeItem {
  key?: string;
  id?: string | number;
  title?: string;
  content?: string;
  date?: string;
  created_at?: string | number;
}

export interface NotificationButtonProps {
  className?: string;
}

function keyOf(n: NoticeItem, idx: number): string {
  return String(n.key ?? n.id ?? n.title ?? idx);
}

export function NotificationButton({ className }: NotificationButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NoticeItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const readKeys = useNotificationStore((s) => s.readAnnouncementKeys);
  const isRead = useNotificationStore((s) => s.isAnnouncementRead);
  const addRead = useNotificationStore((s) => s.addReadAnnouncement);

  const fetchNotices = React.useCallback(async () => {
    try {
      setLoading(true);
      const res: ApiResponse = await getNotice();
      const raw = res.data;
      let list: NoticeItem[] = [];
      if (Array.isArray(raw)) {
        list = raw as NoticeItem[];
      } else if (typeof raw === "string" && raw.trim()) {
        list = [{ key: "main", content: raw, title: "Notice" }];
      } else if (raw && typeof raw === "object") {
        list = [raw as NoticeItem];
      }
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const unreadCount = items.filter((n, i) => !isRead(keyOf(n, i))).length;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      items.forEach((n, i) => addRead(keyOf(n, i)));
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
            <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--destructive)] px-1 text-[10px] font-semibold leading-none text-[var(--destructive-foreground)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          <span className="text-xs text-[var(--muted)]">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </span>
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-sm text-[var(--muted)]">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--muted)]">
              No notifications
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {items.map((n, i) => {
                const k = keyOf(n, i);
                const unread = !readKeys.includes(k);
                return (
                  <li
                    key={k}
                    className={cn(
                      "flex gap-3 px-4 py-3 text-sm",
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
                      {n.title ? (
                        <p className="truncate font-medium text-[var(--foreground)]">
                          {n.title}
                        </p>
                      ) : null}
                      {n.content ? (
                        <p className="mt-0.5 line-clamp-3 text-xs text-[var(--muted)]">
                          {n.content}
                        </p>
                      ) : null}
                      {n.date || n.created_at ? (
                        <p className="mt-1 text-[10px] text-[var(--muted)]">
                          {n.date ?? String(n.created_at)}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
