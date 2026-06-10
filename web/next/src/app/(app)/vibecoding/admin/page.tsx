"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClaudeCodeAdmin } from "@/features/vibecoding/components/claude-code-admin";
import { useIsAdmin } from "@/hooks";

export default function Page() {
  const isAdmin = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/403");
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  return <ClaudeCodeAdmin />;
}
