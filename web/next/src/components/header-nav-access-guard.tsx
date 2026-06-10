"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStatus } from "@/hooks/use-status";
import {
  parseHeaderNavModulesFromStatus,
  type HeaderNavAccessConfig,
  type HeaderNavAccessModule,
} from "@/lib/nav-modules";
import { useAuthStore } from "@/stores/auth-store";

const FAILED_STATUS_ACCESS: HeaderNavAccessConfig = {
  enabled: false,
  requireAuth: true,
};

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
    </div>
  );
}

export function HeaderNavAccessGuard({
  children,
  module,
}: {
  children: ReactNode;
  module: HeaderNavAccessModule;
}) {
  const { status, loading, error } = useStatus();
  const user = useAuthStore((state) => state.auth.user);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const access = useMemo(() => {
    if (error) return FAILED_STATUS_ACCESS;
    return parseHeaderNavModulesFromStatus(
      status as Record<string, unknown> | null
    )[module];
  }, [error, module, status]);

  const shouldRequireSignIn = access.requireAuth && !user;
  const shouldRedirectHome = !loading && !access.enabled;
  const shouldRedirectSignIn = !loading && access.enabled && shouldRequireSignIn;

  useEffect(() => {
    if (shouldRedirectHome) {
      router.replace("/");
      return;
    }

    if (shouldRedirectSignIn) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(currentHref)}`);
    }
  }, [currentHref, router, shouldRedirectHome, shouldRedirectSignIn]);

  if (loading || shouldRedirectHome || shouldRedirectSignIn) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
