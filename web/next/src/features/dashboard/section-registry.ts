import type { DashboardSectionId } from "./types";

export const DASHBOARD_DEFAULT_SECTION: DashboardSectionId = "overview";

export const DASHBOARD_SECTION_IDS = [
  "overview",
  "models",
  "users",
] as const satisfies readonly DashboardSectionId[];

export function coerceDashboardSection(section?: string): DashboardSectionId {
  return DASHBOARD_SECTION_IDS.includes(section as DashboardSectionId)
    ? (section as DashboardSectionId)
    : DASHBOARD_DEFAULT_SECTION;
}
