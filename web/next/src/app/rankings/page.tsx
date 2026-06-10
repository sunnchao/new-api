"use client";

import { HeaderNavAccessGuard } from "@/components/header-nav-access-guard";
import { Rankings } from "@/features/rankings";

export default function RankingsPage() {
  return (
    <HeaderNavAccessGuard module="rankings">
      <Rankings />
    </HeaderNavAccessGuard>
  );
}
