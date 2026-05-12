"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSelf } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

let sessionVerified = false;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.auth.user);
  const setUser = useAuthStore((s) => s.setUser);
  const reset = useAuthStore((s) => s.reset);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
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
        router.replace(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
      })
      .catch(() => {
        if (cancelled) return;
        reset();
        router.replace(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
      });

    return () => {
      cancelled = true;
    };
  }, [reset, router, setUser, user]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
