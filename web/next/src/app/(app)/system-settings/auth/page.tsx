import { redirect } from "next/navigation";
import { AUTH_DEFAULT_SECTION } from "@/features/system-settings/auth/section-registry";

export default function AuthIndex() {
  redirect(`/system-settings/auth/${AUTH_DEFAULT_SECTION}`);
}
