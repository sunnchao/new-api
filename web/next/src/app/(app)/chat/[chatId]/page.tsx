import { ChatPage } from "@/features/chat";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  if (!Number.isInteger(Number(chatId))) {
    redirect("/dashboard");
  }

  return <ChatPage chatId={chatId} />;
}
