export interface HomePageContentResponse {
  success: boolean;
  message?: string;
  data?: string;
}

export interface HomePageContentResult {
  content: string;
  isLoaded: boolean;
  isUrl: boolean;
}
