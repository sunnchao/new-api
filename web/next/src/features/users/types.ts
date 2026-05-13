import { z } from "zod";

export const userStatusSchema = z.number();
export type UserStatus = z.infer<typeof userStatusSchema>;

export const userRoleSchema = z.number();
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  display_name: z.string().optional(),
  password: z.string().optional(),
  github_id: z.string().optional(),
  discord_id: z.string().optional(),
  oidc_id: z.string().optional(),
  wechat_id: z.string().optional(),
  telegram_id: z.string().optional(),
  linux_do_id: z.string().optional(),
  email: z.string().optional(),
  avatar_url: z.string().optional(),
  quota: z.number(),
  used_quota: z.number(),
  request_count: z.number(),
  group: z.string().optional(),
  aff_code: z.string().optional(),
  aff_count: z.number().optional(),
  aff_quota: z.number().optional(),
  aff_history_quota: z.number().optional(),
  inviter_id: z.number().optional(),
  status: userStatusSchema,
  role: userRoleSchema,
  created_time: z.number().optional(),
  created_at: z.number().optional(),
  updated_at: z.number().optional(),
  last_login_at: z.number().optional(),
  DeletedAt: z.unknown().nullable().optional(),
  remark: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

export const userListSchema = z.array(userSchema);

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface GetUsersParams {
  p?: number;
  page_size?: number;
}

export interface GetUsersResponse {
  success: boolean;
  message?: string;
  data?:
    | {
        items: User[];
        total: number;
        page: number;
        page_size: number;
      }
    | User[];
}

export interface SearchUsersParams {
  keyword?: string;
  group?: string;
  p?: number;
  page_size?: number;
}

export interface UserFormData {
  username: string;
  display_name?: string;
  password?: string;
  role?: number;
  quota?: number;
  group?: string;
  remark?: string;
}

export type ManageUserAction =
  | "promote"
  | "demote"
  | "enable"
  | "disable"
  | "delete"
  | "add_quota";

export type QuotaAdjustMode = "add" | "subtract" | "override";

export interface ManageUserQuotaPayload {
  id: number;
  action: "add_quota";
  mode: QuotaAdjustMode;
  value: number;
}

export interface OAuthBinding {
  provider_id: string;
  provider_name: string;
  user_id?: number;
  external_id?: string;
}

export interface StatusInfo {
  github_oauth?: boolean;
  discord_oauth?: boolean;
  oidc_enabled?: boolean;
  wechat_login?: boolean;
  telegram_oauth?: boolean;
  linuxdo_oauth?: boolean;
  custom_oauth_providers?: Array<{
    id: string;
    name: string;
    icon?: string;
  }>;
}

export type UsersDialogType = "create" | "update" | "delete";
