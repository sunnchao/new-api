"use client";

import { HeaderNavAccessGuard } from "@/components/header-nav-access-guard";
import { SubscriptionPlansPage } from "@/features/subscription-plans";

export default function PublicSubscriptionPlansPage() {
  return (
    <HeaderNavAccessGuard module="subscriptions">
      <SubscriptionPlansPage />
    </HeaderNavAccessGuard>
  );
}
