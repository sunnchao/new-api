import { quotaUnitsToDollars } from "@/lib/format";
import { DEFAULT_GROUP } from "./constants";
import type { ManageUserAction, User, UserFormData } from "./types";

export interface UserFormValues {
  username: string;
  display_name: string;
  password: string;
  role: number;
  group: string;
  remark: string;
}

export const USER_FORM_DEFAULT_VALUES: UserFormValues = {
  username: "",
  display_name: "",
  password: "",
  role: 1,
  group: DEFAULT_GROUP,
  remark: "",
};

export function normalizeUsersResponse(
  data: unknown,
): { items: User[]; total: number } {
  if (Array.isArray(data)) {
    return { items: data as User[], total: data.length };
  }

  if (data && typeof data === "object") {
    const payload = data as { items?: unknown; total?: unknown };
    const items = Array.isArray(payload.items) ? (payload.items as User[]) : [];
    const total =
      typeof payload.total === "number" ? payload.total : items.length;
    return { items, total };
  }

  return { items: [], total: 0 };
}

export function transformUserToFormValues(user: User): UserFormValues {
  return {
    username: user.username,
    display_name: user.display_name || user.username,
    password: "",
    role: user.role,
    group: user.group || DEFAULT_GROUP,
    remark: user.remark || "",
  };
}

export function transformFormDataToPayload(
  data: UserFormValues,
  userId?: number,
): UserFormData & { id?: number } {
  const payload: UserFormData & { id?: number } = {
    username: data.username.trim(),
    display_name: data.display_name.trim() || data.username.trim(),
    password: data.password || undefined,
  };

  if (userId === undefined) {
    payload.role = data.role || 1;
  } else {
    payload.id = userId;
    payload.group = data.group || DEFAULT_GROUP;
    payload.remark = data.remark.trim() || undefined;
  }

  return payload;
}

export function getUserActionMessage(action: ManageUserAction): string {
  const messages: Record<ManageUserAction, string> = {
    promote: "User promoted successfully",
    demote: "User demoted successfully",
    enable: "User enabled successfully",
    disable: "User disabled successfully",
    delete: "User deleted successfully",
    add_quota: "Quota adjusted successfully",
  };
  return messages[action];
}

export function userQuotaDollars(user: User): number {
  return quotaUnitsToDollars(user.quota);
}
