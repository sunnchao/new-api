"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSelf } from "@/lib/api";
import { ROLE } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

let sessionVerified = false;

const ADMIN_ROUTE_PREFIXES = [
  "/channels",
  "/models",
  "/users",
  "/redemption-codes",
  "/subscriptions",
  "/admin-packages",
  "/admin-tokens",
  "/health",
  "/performance-metrics",
  "/system-settings",
  "/dashboard/users",
  "/vibecoding/admin",
];

function getCurrentRedirectTarget(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function redirectToSignIn(router: ReturnType<typeof useRouter>) {
  router.replace(
    `/sign-in?redirect=${encodeURIComponent(getCurrentRedirectTarget())}`
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.auth.user);
  const setUser = useAuthStore((s) => s.setUser);
  const reset = useAuthStore((s) => s.reset);
  const router = useRouter();
  const pathname = usePathname();
  const isAdminOnlyRoute = ADMIN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAdmin = (user?.role ?? ROLE.GUEST) >= ROLE.ADMIN;

  useEffect(() => {
    if (!user) {
      redirectToSignIn(router);
      return;
    }

    if (isAdminOnlyRoute && !isAdmin) {
      router.replace("/403");
      return;
    }

    if (sessionVerified) return;

    let cancelled = false;
    getSelf()
      .then((res) => {
        if (cancelled) return;
        if (res?.success && res.data) {
          setUser(res.data as Parameters<typeof setUser>[0]);
          sessionVerified = true;
          return;
        }
        reset();
        redirectToSignIn(router);
      })
      .catch(() => {
        if (cancelled) return;
        reset();
        redirectToSignIn(router);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, isAdminOnlyRoute, reset, router, setUser, user]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  if (isAdminOnlyRoute && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
