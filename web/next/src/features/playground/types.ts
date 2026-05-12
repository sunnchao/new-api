export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string;
}

export interface PlaygroundSettings {
  model: string;
  group: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  tokenId: string;
}

export interface PlaygroundTokenOption {
  id: number;
  name: string;
  key: string;
}
