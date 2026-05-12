import { ChatPage } from "@/features/chat";

export default async function Page({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  return <ChatPage chatId={chatId} />;
}
