import type { AxiosRequestConfig } from "axios";

export type ApiRequestOptions = AxiosRequestConfig & {
  disableDuplicate?: boolean;
  skipBusinessError?: boolean;
  skipErrorHandler?: boolean;
};
