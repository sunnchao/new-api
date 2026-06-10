"use client";

import { HeaderNavAccessGuard } from "@/components/header-nav-access-guard";
import { Pricing } from "@/features/pricing";

export default function PricingPage() {
  return (
    <HeaderNavAccessGuard module="pricing">
      <Pricing />
    </HeaderNavAccessGuard>
  );
}
