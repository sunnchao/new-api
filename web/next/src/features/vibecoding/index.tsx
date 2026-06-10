"use client";

import { PublicLayout } from "@/components/layout/public-layout";
import { TutorialPage } from "./components/tutorial-page";
import { resolveToolId, VALID_TOOL_IDS } from "./constants";
import { notFound } from "next/navigation";
import "./i18n";

interface VibeCodingPageProps {
  toolId: string;
}

export function VibeCodingPage({ toolId }: VibeCodingPageProps) {
  const resolvedToolId = resolveToolId(toolId);

  if (!VALID_TOOL_IDS.includes(resolvedToolId)) {
    notFound();
  }

  return (
    <PublicLayout showMainContainer={false}>
      <TutorialPage toolId={resolvedToolId} />
    </PublicLayout>
  );
}
