"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AppHeader } from "./app-header";
import { SidebarNav } from "./sidebar-nav";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSystemConfigStore } from "@/stores/system-config-store";

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const systemName = useSystemConfigStore((s) => s.getSystemName());
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] transition-all duration-200",
          collapsed ? "lg:w-[52px]" : "lg:w-60",
        )}
      >
        <div className={cn(
          "flex h-14 items-center border-b border-[var(--sidebar-border)] shrink-0",
          collapsed ? "justify-center px-0" : "justify-between px-4",
        )}>
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <div className="h-6 w-6 rounded-md bg-[var(--accent)] flex items-center justify-center shrink-0">
                <span className="text-[var(--accent-foreground)] text-xs font-bold">N</span>
              </div>
              <span className="font-semibold text-sm truncate">{systemName}</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-[var(--sidebar-muted)] hover:text-[var(--foreground)]"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed
              ? <PanelLeftOpen className="h-4 w-4" />
              : <PanelLeftClose className="h-4 w-4" />
            }
          </Button>
        </div>
        <ScrollArea className="flex-1 py-3">
          <SidebarNav collapsed={collapsed} />
        </ScrollArea>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={closeSidebar}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]">
            <div className="flex h-14 items-center gap-2 border-b border-[var(--sidebar-border)] px-4">
              <div className="h-6 w-6 rounded-md bg-[var(--accent)] flex items-center justify-center shrink-0">
                <span className="text-[var(--accent-foreground)] text-xs font-bold">N</span>
              </div>
              <span className="font-semibold text-sm">{systemName}</span>
            </div>
            <ScrollArea className="flex-1 py-3">
              <SidebarNav onNavigate={closeSidebar} />
            </ScrollArea>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <AppHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
