"use client";

import { PublicLayout } from "@/components/layout/public-layout";
import { TutorialPage } from "./components/tutorial-page";
import { VALID_TOOL_IDS } from "./constants";
import { notFound } from "next/navigation";
import "./i18n";

interface VibeCodingPageProps {
  toolId: string;
}

export function VibeCodingPage({ toolId }: VibeCodingPageProps) {
  if (!VALID_TOOL_IDS.includes(toolId)) {
    notFound();
  }

  return (
    <PublicLayout showMainContainer={false}>
      <TutorialPage toolId={toolId} />
    </PublicLayout>
  );
}
