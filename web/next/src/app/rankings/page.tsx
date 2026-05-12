import { Suspense } from "react";
import { RankingsPage } from "@/features/rankings";

export default function Page() {
  return (
    <Suspense>
      <RankingsPage />
    </Suspense>
  );
}
