import { redirect } from "next/navigation";
import { SITE_DEFAULT_SECTION } from "@/features/system-settings/site/section-registry";

export default function SiteIndex() {
  redirect(`/system-settings/site/${SITE_DEFAULT_SECTION}`);
}
