"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  KeyRound,
  Network,
  Users,
  User,
  Wallet,
  PlayCircle,
} from "lucide-react";
import { create } from "zustand";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandMenuState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const useCommandMenuStore = create<CommandMenuState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));

export function useCommandMenu() {
  const open = useCommandMenuStore((s) => s.open);
  const setOpen = useCommandMenuStore((s) => s.setOpen);
  const toggle = useCommandMenuStore((s) => s.toggle);
  return { open, setOpen, toggle };
}

export interface CommandMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  group?: string;
  onSelect: () => void;
}

export interface CommandMenuProps {
  items?: CommandMenuItem[];
}

export function CommandMenu({ items = [] }: CommandMenuProps) {
  const router = useRouter();
  const { open, setOpen } = useCommandMenu();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const defaultItems: CommandMenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      group: "Navigate",
      shortcut: "G D",
      onSelect: () => go("/console"),
    },
    {
      id: "keys",
      label: "API Keys",
      icon: KeyRound,
      group: "Navigate",
      shortcut: "G K",
      onSelect: () => go("/console/token"),
    },
    {
      id: "channels",
      label: "Channels",
      icon: Network,
      group: "Navigate",
      shortcut: "G C",
      onSelect: () => go("/console/channel"),
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      group: "Navigate",
      shortcut: "G U",
      onSelect: () => go("/console/users"),
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      group: "Account",
      onSelect: () => go("/profile"),
    },
    {
      id: "wallet",
      label: "Wallet",
      icon: Wallet,
      group: "Account",
      onSelect: () => go("/wallet"),
    },
    {
      id: "playground",
      label: "Playground",
      icon: PlayCircle,
      group: "Tools",
      onSelect: () => go("/console/playground"),
    },
  ];

  const allItems = [...defaultItems, ...items];
  const groups = Array.from(
    new Set(allItems.map((i) => i.group ?? "General"))
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group, idx) => {
          const groupItems = allItems.filter(
            (i) => (i.group ?? "General") === group
          );
          if (groupItems.length === 0) return null;
          return (
            <React.Fragment key={group}>
              {idx > 0 ? <CommandSeparator /> : null}
              <CommandGroup heading={group}>
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.id}
                      value={`${group} ${item.label}`}
                      onSelect={() => item.onSelect()}
                    >
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                      <span>{item.label}</span>
                      {item.shortcut ? (
                        <CommandShortcut>{item.shortcut}</CommandShortcut>
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </React.Fragment>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
