"use client";

import { use } from "react";
import { TicketDetail } from "@/features/tickets/components/ticket-detail";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <TicketDetail ticketId={Number(id)} />;
}
