export interface ChatPreset {
  id: string;
  name: string;
  type: 'web' | 'api';
  url: string;
  icon?: string;
}

export function resolveChatUrl(preset: ChatPreset, key: string): string {
  return preset.url.replace(/\{\{key\}\}/g, key);
}
