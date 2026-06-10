import { redirect } from "next/navigation";

export type SectionParams = {
  section?: string | string[];
};

export async function resolveSettingsSection(
  params: Promise<SectionParams>,
  sectionIds: readonly string[],
  defaultPath: string
) {
  const { section: rawSection } = await params;
  const section = Array.isArray(rawSection) ? rawSection[0] : rawSection;

  if (!section || !sectionIds.includes(section)) {
    redirect(defaultPath);
  }

  return section;
}
