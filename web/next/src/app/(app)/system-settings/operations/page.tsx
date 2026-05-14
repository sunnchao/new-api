import { redirect } from "next/navigation";
import { OPERATIONS_DEFAULT_SECTION } from "@/features/system-settings/operations/section-registry";

export default function OperationsIndex() {
  redirect(`/system-settings/operations/${OPERATIONS_DEFAULT_SECTION}`);
}
