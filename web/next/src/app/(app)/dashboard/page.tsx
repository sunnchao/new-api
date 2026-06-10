import { redirect } from "next/navigation";
import { DASHBOARD_DEFAULT_SECTION } from "@/features/dashboard/section-registry";

export default function DashboardRootPage() {
  redirect(`/dashboard/${DASHBOARD_DEFAULT_SECTION}`);
}
