"use client";

import { use } from "react";
import { TicketDetailPage } from "@/features/tickets";

export default function TicketDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <TicketDetailPage ticketId={Number(id)} />;
}
