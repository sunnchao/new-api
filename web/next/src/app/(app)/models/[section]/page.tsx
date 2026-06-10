import { redirect } from "next/navigation";

import { Models } from "@/features/models";
import {
  MODELS_DEFAULT_SECTION,
  MODELS_SECTION_IDS,
} from "@/features/models/section-registry";

export default async function ModelsSectionPage({
  params,
}: {
  params: Promise<{ section?: string | string[] }>;
}) {
  const { section: rawSection } = await params;
  const section = Array.isArray(rawSection) ? rawSection[0] : rawSection;

  if (!section || !(MODELS_SECTION_IDS as readonly string[]).includes(section)) {
    redirect(`/models/${MODELS_DEFAULT_SECTION}`);
  }

  return <Models />;
}
