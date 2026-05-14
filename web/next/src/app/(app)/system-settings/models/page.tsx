import { redirect } from "next/navigation";
import { MODELS_DEFAULT_SECTION } from "@/features/system-settings/models/section-registry";

export default function ModelsIndex() {
  redirect(`/system-settings/models/${MODELS_DEFAULT_SECTION}`);
}
