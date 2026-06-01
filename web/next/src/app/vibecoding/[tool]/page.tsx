"use client";

import { use } from "react";
import { VibeCodingPage } from "@/features/vibecoding";

export default function Page({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = use(params);
  return <VibeCodingPage toolId={tool} />;
}
