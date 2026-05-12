export interface PricingModel {
  id?: number;
  model_name: string;
  display_name?: string;
  description?: string;
  model_type?: string;
  prompt_ratio?: number;
  completion_ratio?: number;
  model_ratio?: number;
  cache_ratio?: number | null;
  image_ratio?: number | null;
  audio_ratio?: number | null;
  group?: string;
  enable_groups?: string[];
  group_ratio?: Record<string, number>;
  max_tokens?: number;
  max_output_tokens?: number;
  context_length?: number;
  capabilities?: string[];
}

export interface PricingData {
  success?: boolean;
  message?: string;
  data?: PricingModel[];
}
