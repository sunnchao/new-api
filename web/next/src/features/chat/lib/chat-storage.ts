import type { ChatSession } from "../types";

export function readChatSession(chatId: string): ChatSession {
  if (typeof window === "undefined") return { id: chatId, messages: [] };
  try {
    const raw = window.localStorage.getItem(`chat_${chatId}`);
    if (!raw) return { id: chatId, messages: [] };
    const parsed = JSON.parse(raw) as ChatSession;
    return {
      ...parsed,
      id: parsed.id || chatId,
      messages: parsed.messages || [],
    };
  } catch {
    return { id: chatId, messages: [] };
  }
}

export function writeChatSession(chatId: string, session: ChatSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`chat_${chatId}`, JSON.stringify(session));
}
