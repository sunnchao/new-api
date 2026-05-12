"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppHeader } from "./app-header";
import { SidebarNav } from "./sidebar-nav";
import { cn } from "@/lib/utils";

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <aside
        className={cn(
          "hidden lg:flex lg:w-60 lg:flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]",
        )}
      >
        <div className="flex h-14 items-center border-b border-[var(--sidebar-border)] px-4">
          {/* Logo space — shared with header */}
        </div>
        <ScrollArea className="flex-1 py-4">
          <SidebarNav />
        </ScrollArea>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[var(--overlay)]"
            onClick={closeSidebar}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]">
            <div className="flex h-14 items-center border-b border-[var(--sidebar-border)] px-4">
              <span className="font-semibold text-sm">Menu</span>
            </div>
            <ScrollArea className="flex-1 py-4">
              <SidebarNav onNavigate={closeSidebar} />
            </ScrollArea>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
