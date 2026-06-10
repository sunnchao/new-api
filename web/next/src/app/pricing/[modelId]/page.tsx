"use client";

import { HeaderNavAccessGuard } from "@/components/header-nav-access-guard";
import { ModelDetails } from "@/features/pricing";

export default function PricingModelDetailsPage() {
  return (
    <HeaderNavAccessGuard module="pricing">
      <ModelDetails />
    </HeaderNavAccessGuard>
  );
}
