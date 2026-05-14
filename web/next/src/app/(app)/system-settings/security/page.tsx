import { redirect } from "next/navigation";
import { SECURITY_DEFAULT_SECTION } from "@/features/system-settings/security/section-registry";

export default function SecurityIndex() {
  redirect(`/system-settings/security/${SECURITY_DEFAULT_SECTION}`);
}
