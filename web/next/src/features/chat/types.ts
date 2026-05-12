export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_time?: number;
}

export interface ChatSession {
  id: string;
  title?: string;
  model?: string;
  messages: ChatMessage[];
  created_time?: number;
}

export interface ChatSharePayload {
  title?: string;
  content: string;
  created: number;
}
