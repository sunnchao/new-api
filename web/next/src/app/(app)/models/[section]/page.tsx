"use client";

import { Models } from "@/features/models";

export default function ModelsSectionPage({
  params,
}: {
  params: { section: string };
}) {
  return <Models section={params.section} />;
}
