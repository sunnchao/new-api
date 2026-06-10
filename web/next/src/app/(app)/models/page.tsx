import { redirect } from "next/navigation";
import { MODELS_DEFAULT_SECTION } from "@/features/models/section-registry";

export default function ModelsRootPage() {
  redirect(`/models/${MODELS_DEFAULT_SECTION}`);
}
