import { redirect } from "next/navigation";
import { CONTENT_DEFAULT_SECTION } from "@/features/system-settings/content/section-registry";

export default function ContentIndex() {
  redirect(`/system-settings/content/${CONTENT_DEFAULT_SECTION}`);
}
