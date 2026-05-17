"use client";

export { SectionPageLayout } from "./section-page-layout";
export type { SectionPageLayoutProps } from "./section-page-layout";
export { PageFooterPortal, PageFooterProvider } from "./components/page-footer";

// Stubs for compatibility
export function Main({ children }: { children: React.ReactNode }) {
  return <main className="flex-1">{children}</main>;
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
