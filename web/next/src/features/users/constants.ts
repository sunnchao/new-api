import { Shield, User as UserIcon, Users } from "lucide-react";
import type { User } from "./types";

export const USER_STATUS = {
  ENABLED: 1,
  DISABLED: 2,
} as const;

export const USER_ROLE = {
  USER: 1,
  ADMIN: 10,
  ROOT: 100,
} as const;

export const USER_STATUSES = {
  [USER_STATUS.ENABLED]: {
    labelKey: "Enabled",
    variant: "success" as const,
    value: USER_STATUS.ENABLED,
  },
  [USER_STATUS.DISABLED]: {
    labelKey: "Disabled",
    variant: "secondary" as const,
    value: USER_STATUS.DISABLED,
  },
  DELETED: {
    labelKey: "Deleted",
    variant: "destructive" as const,
    value: -1,
  },
} as const;

export const USER_ROLES = {
  [USER_ROLE.USER]: {
    labelKey: "User",
    value: USER_ROLE.USER,
    icon: UserIcon,
  },
  [USER_ROLE.ADMIN]: {
    labelKey: "Admin",
    value: USER_ROLE.ADMIN,
    icon: Users,
  },
  [USER_ROLE.ROOT]: {
    labelKey: "Root",
    value: USER_ROLE.ROOT,
    icon: Shield,
  },
} as const;

export const DEFAULT_GROUP = "default";

export const BINDING_FIELDS = [
  { key: "github_id", label: "GitHub ID" },
  { key: "discord_id", label: "Discord ID" },
  { key: "oidc_id", label: "OIDC ID" },
  { key: "wechat_id", label: "WeChat ID" },
  { key: "email", label: "Email" },
  { key: "telegram_id", label: "Telegram ID" },
] as const;

export function isUserDeleted(user: User): boolean {
  return user.DeletedAt != null;
}
