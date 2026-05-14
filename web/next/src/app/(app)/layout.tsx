"use client";

import dynamic from "next/dynamic";
import { AuthGuard } from "@/components/auth-guard";

const AuthenticatedLayout = dynamic(
  () => import("@/components/layout/authenticated-layout").then((m) => ({ default: m.AuthenticatedLayout })),
  { ssr: false }
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </AuthGuard>
  );
}
