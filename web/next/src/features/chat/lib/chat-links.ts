import type { ChatSharePayload } from "../types";

export function encodeChatLinkPayload(payload: ChatSharePayload): string {
  return btoa(encodeURIComponent(JSON.stringify(payload))).slice(0, 32);
}

export function buildChatLink(id: string): string {
  if (typeof window === "undefined") return `/chat/${id}`;
  return `${window.location.origin}/chat/${id}`;
}
