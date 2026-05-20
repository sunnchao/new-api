"use client";

export { SectionPageLayout } from "./section-page-layout";
export type { SectionPageLayoutProps } from "./section-page-layout";
export { PageFooterPortal, PageFooterProvider } from "./components/page-footer";
export { PublicLayout } from "./public-layout";
export { AuthenticatedLayout } from "./authenticated-layout";

export function Main({ children }: { children: React.ReactNode }) {
  return <main className="flex-1">{children}</main>;
}
