"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Coins,
  Edit,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Loader2,
  MoreHorizontal,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Unlink,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import { SiDiscord, SiGithub } from "react-icons/si";
import { api } from "@/lib/api";
import { formatQuota, parseQuotaFromDollars } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { GroupBadge } from "@/components/group-badge";
import { StatusBadge } from "@/components/status-badge";
import {
  adjustUserQuota,
  adminClearUserBinding,
  adminUnbindCustomOAuth,
  createUser,
  deleteUser,
  getUsers,
  getGroups,
  getUser,
  getUserOAuthBindings,
  manageUser,
  resetUserPasskey,
  resetUserTwoFA,
  searchUsers,
  updateUser,
} from "./api";
import { BINDING_FIELDS, USER_ROLE, USER_STATUS } from "./constants";
import {
  getUserActionMessage,
  normalizeUsersResponse,
  transformFormDataToPayload,
  transformUserToFormValues,
  USER_FORM_DEFAULT_VALUES,
  type UserFormValues,
} from "./lib";
import type {
  ManageUserAction,
  OAuthBinding,
  QuotaAdjustMode,
  StatusInfo,
  User,
  UserFormData,
  UsersDialogType,
} from "./types";

const PAGE_SIZE = 20;
const GROUP_SELECT_EMPTY = "__none__";

type BindingItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  type: "builtin" | "custom";
  providerId?: string;
  isBound: boolean;
  isEnabled: boolean;
};

const BUILTIN_BINDINGS: ReadonlyArray<{
  key: string;
  field: keyof User;
  label: string;
  icon: React.ReactNode;
  statusKey: keyof StatusInfo | null;
}> = [
  {
    key: "email",
    field: "email",
    label: "Email",
    icon: <Link2 className="h-4 w-4" />,
    statusKey: null,
  },
  {
    key: "github_id",
    field: "github_id",
    label: "GitHub",
    icon: <SiGithub className="h-4 w-4" />,
    statusKey: "github_oauth",
  },
  {
    key: "discord_id",
    field: "discord_id",
    label: "Discord",
    icon: <SiDiscord className="h-4 w-4" />,
    statusKey: "discord_oauth",
  },
  {
    key: "wechat_id",
    field: "wechat_id",
    label: "WeChat",
    icon: <Link2 className="h-4 w-4" />,
    statusKey: "wechat_login",
  },
  {
    key: "oidc_id",
    field: "oidc_id",
    label: "OIDC",
    icon: <Link2 className="h-4 w-4" />,
    statusKey: "oidc_enabled",
  },
  {
    key: "telegram_id",
    field: "telegram_id",
    label: "Telegram",
    icon: <Link2 className="h-4 w-4" />,
    statusKey: "telegram_oauth",
  },
  {
    key: "linux_do_id",
    field: "linux_do_id",
    label: "LinuxDO",
    icon: <Link2 className="h-4 w-4" />,
    statusKey: "linuxdo_oauth",
  },
];

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function initials(user: User) {
  return (user.display_name || user.username || "?").slice(0, 2).toUpperCase();
}

function roleBadge(user: User, t: (key: string) => string) {
  if (user.role >= USER_ROLE.ROOT) {
    return <Badge variant="warning">{t("Root")}</Badge>;
  }
  if (user.role >= USER_ROLE.ADMIN) {
    return <Badge variant="warning">{t("Admin")}</Badge>;
  }
  return <Badge variant="secondary">{t("User")}</Badge>;
}

function quotaProgressClass(percentage: number) {
  if (percentage <= 10) return "[&>div]:bg-rose-500";
  if (percentage <= 30) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-emerald-500";
}

function QuotaCell({ user }: { user: User }) {
  const { t } = useTranslation();
  const used = user.used_quota || 0;
  const remaining = user.quota || 0;
  const total = used + remaining;
  const percentage = total > 0 ? (remaining / total) * 100 : 0;

  if (total <= 0) {
    return <StatusBadge label={t("No Quota")} variant="neutral" copyable={false} />;
  }

  return (
    <div className="w-[150px] space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium tabular-nums">{formatQuota(remaining)}</span>
        <span className="text-[var(--muted)] tabular-nums">{formatQuota(total)}</span>
      </div>
      <Progress value={percentage} className={cn("h-1.5", quotaProgressClass(percentage))} />
      <div className="text-[10px] text-[var(--muted)]">
        {t("Used:")} {formatQuota(used)}
      </div>
    </div>
  );
}

function UserFormDialog({
  open,
  mode,
  currentRow,
  groups,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  mode: Exclude<UsersDialogType, "delete">;
  currentRow: User | null;
  groups: string[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const isUpdate = mode === "update" && Boolean(currentRow);
  const [form, setForm] = React.useState<UserFormValues>(USER_FORM_DEFAULT_VALUES);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (isUpdate && currentRow) {
      let cancelled = false;
      setLoading(true);
      getUser(currentRow.id)
        .then((result) => {
          if (cancelled) return;
          if (result.success && result.data) {
            setForm(transformUserToFormValues(result.data));
          } else {
            toast.error(result.message || t("Failed to load user"));
            setForm(transformUserToFormValues(currentRow));
          }
        })
        .catch((error) => {
          if (!cancelled) {
            toast.error(getErrorMessage(error, t("Failed to load user")));
            setForm(transformUserToFormValues(currentRow));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    setForm(USER_FORM_DEFAULT_VALUES);
    setLoading(false);
  }, [currentRow, isUpdate, open, t]);

  const patchForm = (patch: Partial<UserFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const groupOptions = React.useMemo(() => {
    const values = new Set(groups);
    if (form.group) values.add(form.group);
    return [...values].filter(Boolean);
  }, [form.group, groups]);

  const handleSubmit = async () => {
    const username = form.username.trim();
    if (!username) {
      toast.error(t("Username is required"));
      return;
    }
    if (!isUpdate && !form.password) {
      toast.error(t("Password is required"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = transformFormDataToPayload(form, currentRow?.id);
      const result =
        isUpdate && currentRow
          ? await updateUser(payload as UserFormData & { id: number })
          : await createUser(payload);

      if (result.success) {
        toast.success(isUpdate ? t("User updated successfully") : t("User created successfully"));
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.message || t(isUpdate ? "Failed to update user" : "Failed to create user"));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t("An unexpected error occurred")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b border-[var(--border)] px-5 py-4 text-left">
          <DialogTitle>{isUpdate ? t("Update User") : t("Create User")}</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? t("Update the user by providing necessary info.")
              : t("Add a new user by providing necessary info.")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[64vh] space-y-5 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("Loading...")}
            </div>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="user-username">{t("Username")}</Label>
                  <Input
                    id="user-username"
                    value={form.username}
                    disabled={isUpdate}
                    onChange={(event) => patchForm({ username: event.target.value })}
                    placeholder={t("Enter username")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-display-name">{t("Display Name")}</Label>
                  <Input
                    id="user-display-name"
                    value={form.display_name}
                    onChange={(event) => patchForm({ display_name: event.target.value })}
                    placeholder={t("Enter display name")}
                  />
                  <p className="text-xs text-[var(--muted)]">
                    {t("Leave empty to use username")}
                  </p>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="user-password">{t("Password")}</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={form.password}
                    onChange={(event) => patchForm({ password: event.target.value })}
                    placeholder={
                      isUpdate
                        ? t("Leave empty to keep unchanged")
                        : t("Enter password (min 8 characters)")
                    }
                  />
                </div>
                {!isUpdate ? (
                  <div className="space-y-2">
                    <Label>{t("Role")}</Label>
                    <Select
                      value={String(form.role)}
                      onValueChange={(value) => patchForm({ role: Number(value) || USER_ROLE.USER })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select a role")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(USER_ROLE.USER)}>{t("Common User")}</SelectItem>
                        <SelectItem value={String(USER_ROLE.ADMIN)}>{t("Admin")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[var(--muted)]">
                      {t("Set the user's role (cannot be Root)")}
                    </p>
                  </div>
                ) : null}
              </section>

              {isUpdate ? (
                <>
                  <section className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("Group")}</Label>
                      <Select
                        value={form.group || GROUP_SELECT_EMPTY}
                        onValueChange={(value) =>
                          patchForm({ group: value === GROUP_SELECT_EMPTY ? "" : value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("Select a group")} />
                        </SelectTrigger>
                        <SelectContent>
                          {groupOptions.length === 0 ? (
                            <SelectItem value={GROUP_SELECT_EMPTY}>{t("No groups available")}</SelectItem>
                          ) : (
                            groupOptions.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("Remaining Quota")}</Label>
                      <Input value={currentRow ? formatQuota(currentRow.quota) : "-"} readOnly />
                    </div>
                  </section>

                  <div className="space-y-2">
                    <Label htmlFor="user-remark">{t("Remark")}</Label>
                    <Textarea
                      id="user-remark"
                      value={form.remark}
                      rows={3}
                      onChange={(event) => patchForm({ remark: event.target.value })}
                      placeholder={t("Admin notes (only visible to admins)")}
                    />
                  </div>

                  <section className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium">{t("Binding Information")}</h3>
                      <p className="text-xs text-[var(--muted)]">
                        {t("Third-party account bindings visible to admins.")}
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {BINDING_FIELDS.map(({ key, label }) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-xs text-[var(--muted)]">{t(label)}</Label>
                          <Input
                            value={String((currentRow?.[key as keyof User] as string | undefined) || "-")}
                            readOnly
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              ) : null}
            </>
          )}
        </div>

        <DialogFooter className="border-t border-[var(--border)] px-5 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("Cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? t("Saving...") : t("Save changes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuotaDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState<QuotaAdjustMode>("add");
  const [amount, setAmount] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setMode("add");
      setAmount("");
    }
  }, [open]);

  const amountValue = Number.parseFloat(amount) || 0;
  const quotaValue = parseQuotaFromDollars(Math.abs(amountValue));
  const preview = React.useMemo(() => {
    if (!user) return "";
    if (mode === "override") {
      return `${t("Current quota")}: ${formatQuota(user.quota)} -> ${formatQuota(parseQuotaFromDollars(amountValue))}`;
    }
    if (mode === "subtract") {
      return `${t("Current quota")}: ${formatQuota(user.quota)} - ${formatQuota(quotaValue)} = ${formatQuota(user.quota - quotaValue)}`;
    }
    return `${t("Current quota")}: ${formatQuota(user.quota)} + ${formatQuota(quotaValue)} = ${formatQuota(user.quota + quotaValue)}`;
  }, [amountValue, mode, quotaValue, t, user]);

  const handleConfirm = async () => {
    if (!user) return;
    if (mode !== "override" && quotaValue <= 0) {
      toast.error(t("Invalid amount"));
      return;
    }

    setLoading(true);
    try {
      const value = mode === "override" ? parseQuotaFromDollars(amountValue) : quotaValue;
      const result = await adjustUserQuota({
        id: user.id,
        action: "add_quota",
        mode,
        value: mode === "override" ? value : Math.abs(value),
      });
      if (result.success) {
        toast.success(t("Quota adjusted successfully"));
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.message || t("Failed to adjust quota"));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t("Failed to adjust quota")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Adjust Quota")}</DialogTitle>
          <DialogDescription>
            {user ? `${user.display_name || user.username} - ${formatQuota(user.quota)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/40 px-3 py-2 text-sm text-[var(--muted)]">
            {preview}
          </div>
          <div className="space-y-2">
            <Label>{t("Mode")}</Label>
            <div className="flex flex-wrap gap-2">
              {(["add", "subtract", "override"] as const).map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={mode === item ? "default" : "outline"}
                  onClick={() => {
                    setMode(item);
                    setAmount("");
                  }}
                >
                  {item === "add" ? t("Add") : item === "subtract" ? t("Subtract") : t("Override")}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("Amount")}</Label>
            <Input
              type="number"
              step="0.000001"
              min={mode === "override" ? undefined : 0}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={t("Enter amount")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button disabled={loading} onClick={handleConfirm}>
            {loading ? t("Processing...") : t("Confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomProviderIcon({ iconUrl }: { iconUrl?: string }) {
  if (!iconUrl) return <Link2 className="h-4 w-4" />;
  return (
    <img
      src={iconUrl}
      alt=""
      className="h-4 w-4 rounded-sm object-contain"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

function UserBindingDialog({
  open,
  userId,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  userId: number | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [user, setUser] = React.useState<User | null>(null);
  const [oauthBindings, setOauthBindings] = React.useState<OAuthBinding[]>([]);
  const [statusInfo, setStatusInfo] = React.useState<StatusInfo>({});
  const [loading, setLoading] = React.useState(false);
  const [showBoundOnly, setShowBoundOnly] = React.useState(true);
  const [unbindTarget, setUnbindTarget] = React.useState<BindingItem | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [userRes, oauthRes, statusRes] = await Promise.all([
        getUser(userId),
        getUserOAuthBindings(userId).catch(() => ({ success: false, data: [] })),
        api
          .get("/api/status")
          .then((res) => res.data)
          .catch(() => ({ success: false, data: {} })),
      ]);

      if (userRes.success && userRes.data) setUser(userRes.data);
      if (oauthRes.success && oauthRes.data) setOauthBindings(oauthRes.data);
      if (statusRes.success && statusRes.data) setStatusInfo(statusRes.data as StatusInfo);
    } catch (error) {
      toast.error(getErrorMessage(error, t("Failed to load")));
    } finally {
      setLoading(false);
    }
  }, [t, userId]);

  React.useEffect(() => {
    if (open && userId) {
      setShowBoundOnly(true);
      void fetchData();
    } else {
      setUser(null);
      setOauthBindings([]);
      setStatusInfo({});
      setUnbindTarget(null);
    }
  }, [fetchData, open, userId]);

  const allBindings = React.useMemo<BindingItem[]>(() => {
    const items: BindingItem[] = [];

    for (const field of BUILTIN_BINDINGS) {
      const value = user ? String(user[field.field] || "") : "";
      const isBound = value.length > 0;
      const isEnabled = field.statusKey == null ? true : Boolean(statusInfo[field.statusKey]);
      items.push({
        key: field.key,
        label: field.label,
        icon: field.icon,
        value,
        type: "builtin",
        isBound,
        isEnabled,
      });
    }

    const oauthBindingMap = new Map(oauthBindings.map((binding) => [String(binding.provider_id), binding]));
    const seenProviderIds = new Set<string>();

    for (const provider of statusInfo.custom_oauth_providers || []) {
      seenProviderIds.add(String(provider.id));
      const binding = oauthBindingMap.get(String(provider.id));
      items.push({
        key: `oauth_${provider.id}`,
        label: provider.name || provider.id,
        icon: <CustomProviderIcon iconUrl={provider.icon} />,
        value: binding?.external_id || "",
        type: "custom",
        providerId: String(provider.id),
        isBound: Boolean(binding),
        isEnabled: true,
      });
    }

    for (const binding of oauthBindings) {
      if (seenProviderIds.has(String(binding.provider_id))) continue;
      items.push({
        key: `oauth_${binding.provider_id}`,
        label: binding.provider_name || binding.provider_id,
        icon: <Link2 className="h-4 w-4" />,
        value: binding.external_id || "-",
        type: "custom",
        providerId: String(binding.provider_id),
        isBound: true,
        isEnabled: false,
      });
    }

    return items;
  }, [oauthBindings, statusInfo, user]);

  const displayedBindings = showBoundOnly
    ? allBindings.filter((binding) => binding.isBound)
    : allBindings;
  const boundCount = allBindings.filter((binding) => binding.isBound).length;

  const handleUnbind = async () => {
    if (!unbindTarget || !userId) return;
    try {
      const result =
        unbindTarget.type === "builtin"
          ? await adminClearUserBinding(userId, unbindTarget.key)
          : unbindTarget.providerId
            ? await adminUnbindCustomOAuth(userId, unbindTarget.providerId)
            : undefined;

      if (result?.success) {
        toast.success(t("Unbound {{provider}}", { provider: unbindTarget.label }));
        await fetchData();
        onSuccess();
      } else {
        toast.error(result?.message || t("Unbind failed"));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t("Unbind failed")));
    } finally {
      setUnbindTarget(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b border-[var(--border)] px-5 py-4 text-left">
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {t("Account Binding Management")}
            </DialogTitle>
            <DialogDescription>
              {t("Manage account bindings for this user")}
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-[var(--muted)]">
                    {user ? `${user.username} (ID: ${user.id})` : t("No user selected")}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-xs"
                    onClick={() => setShowBoundOnly((value) => !value)}
                  >
                    {showBoundOnly ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {showBoundOnly ? t("Show All") : t("Bound Only")}
                  </Button>
                </div>

                <ScrollArea className="max-h-[54vh] pr-3">
                  {displayedBindings.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[var(--muted)]">
                      {showBoundOnly ? t("This user has no bindings") : t("No providers available")}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                      {displayedBindings.map((binding) => (
                        <div
                          key={binding.key}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-md border border-[var(--border)] px-3 py-2.5",
                            !binding.isBound && "opacity-50",
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="shrink-0 text-[var(--muted)]">{binding.icon}</div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">{binding.label}</span>
                                {!binding.isEnabled ? (
                                  <StatusBadge label={t("Disabled")} variant="neutral" copyable={false} />
                                ) : null}
                              </div>
                              <p className="max-w-[170px] truncate text-xs text-[var(--muted)]">
                                {binding.isBound ? binding.value : t("Not bound")}
                              </p>
                            </div>
                          </div>
                          {binding.isBound ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-[var(--destructive)] hover:text-[var(--destructive)]"
                              onClick={() => setUnbindTarget(binding)}
                              aria-label={t("Unbind")}
                            >
                              <Unlink className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <p className="text-xs text-[var(--muted)]">
                  {t("Bound")}: {boundCount} / {allBindings.length}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(unbindTarget)}
        onOpenChange={(next) => !next && setUnbindTarget(null)}
        title={t("Confirm Unbind")}
        description={t(
          "Are you sure you want to unbind {{provider}} for this user? The user will no longer be able to log in via this method.",
          { provider: unbindTarget?.label || "" },
        )}
        confirmText={t("Confirm Unbind")}
        cancelText={t("Cancel")}
        variant="destructive"
        onConfirm={handleUnbind}
      />
    </>
  );
}

function UserRowActions({
  user,
  onEdit,
  onDelete,
  onQuota,
  onBindings,
  onSuccess,
}: {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onQuota: (user: User) => void;
  onBindings: (user: User) => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [resetPasskeyOpen, setResetPasskeyOpen] = React.useState(false);
  const [resetTwoFAOpen, setResetTwoFAOpen] = React.useState(false);

  const isDisabled = user.status === USER_STATUS.DISABLED;
  const isAdmin = user.role >= USER_ROLE.ADMIN;
  const isRoot = user.role >= USER_ROLE.ROOT;

  const handleManage = async (action: Exclude<ManageUserAction, "delete" | "add_quota">) => {
    try {
      const result = await manageUser(user.id, action);
      if (result.success) {
        toast.success(t(getUserActionMessage(action)));
        onSuccess();
      } else {
        toast.error(result.message || t("Failed to {{action}} user", { action }));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t("An unexpected error occurred")));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t("Open menu")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t("Manage user")}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit(user)}>
            {t("Edit")}
            <DropdownMenuShortcut>
              <Edit className="h-4 w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onQuota(user)}>
            {t("Adjust Quota")}
            <DropdownMenuShortcut>
              <Coins className="h-4 w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {isDisabled ? (
            <DropdownMenuItem onClick={() => handleManage("enable")}>
              {t("Enable")}
              <DropdownMenuShortcut>
                <Power className="h-4 w-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleManage("disable")} disabled={isRoot}>
              {t("Disable")}
              <DropdownMenuShortcut>
                <PowerOff className="h-4 w-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          )}

          {isAdmin && !isRoot ? (
            <DropdownMenuItem onClick={() => handleManage("demote")}>
              {t("Demote")}
              <DropdownMenuShortcut>
                <ArrowDown className="h-4 w-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}

          {!isAdmin ? (
            <DropdownMenuItem onClick={() => handleManage("promote")}>
              {t("Promote")}
              <DropdownMenuShortcut>
                <ArrowUp className="h-4 w-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => onBindings(user)}>
            {t("Manage Bindings")}
            <DropdownMenuShortcut>
              <Link2 className="h-4 w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(event) => {
              event.preventDefault();
              setResetPasskeyOpen(true);
            }}
            disabled={isRoot}
          >
            {t("Reset Passkey")}
            <DropdownMenuShortcut>
              <KeyRound className="h-4 w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(event) => {
              event.preventDefault();
              setResetTwoFAOpen(true);
            }}
            disabled={isRoot}
          >
            {t("Reset 2FA")}
            <DropdownMenuShortcut>
              <ShieldAlert className="h-4 w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => onDelete(user)}
            className="text-[var(--destructive)] focus:text-[var(--destructive)]"
            disabled={isRoot}
          >
            {t("Delete")}
            <DropdownMenuShortcut>
              <Trash2 className="h-4 w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={resetPasskeyOpen}
        onOpenChange={setResetPasskeyOpen}
        title={t("Reset Passkey")}
        description={t(
          "Reset Passkey for {{username}}? The user will need to register a new Passkey before using passwordless login.",
          { username: user.username },
        )}
        confirmText={t("Reset Passkey")}
        cancelText={t("Cancel")}
        onConfirm={async () => {
          const result = await resetUserPasskey(user.id);
          if (result.success) {
            toast.success(t("Passkey reset successfully"));
            onSuccess();
          } else {
            toast.error(result.message || t("Failed to reset Passkey"));
          }
        }}
      />

      <ConfirmDialog
        open={resetTwoFAOpen}
        onOpenChange={setResetTwoFAOpen}
        title={t("Reset Two-Factor Authentication")}
        description={t(
          "Reset 2FA for {{username}}? The user must set up 2FA again to continue using it.",
          { username: user.username },
        )}
        confirmText={t("Reset 2FA")}
        cancelText={t("Cancel")}
        onConfirm={async () => {
          const result = await resetUserTwoFA(user.id);
          if (result.success) {
            toast.success(t("Two-factor authentication reset"));
            onSuccess();
          } else {
            toast.error(result.message || t("Failed to reset 2FA"));
          }
        }}
      />
    </>
  );
}

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = React.useState<User[]>([]);
  const [groups, setGroups] = React.useState<string[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [groupFilter, setGroupFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [open, setOpen] = React.useState<UsersDialogType | null>(null);
  const [currentRow, setCurrentRow] = React.useState<User | null>(null);
  const [quotaUser, setQuotaUser] = React.useState<User | null>(null);
  const [bindingUserId, setBindingUserId] = React.useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const keyword = search.trim();
      const result =
        keyword || groupFilter
          ? await searchUsers({
              keyword,
              group: groupFilter,
              p: page,
              page_size: PAGE_SIZE,
            })
          : await getUsers({ p: page, page_size: PAGE_SIZE });
      if (!result.success) {
        toast.error(result.message || t("Failed to load users"));
        setUsers([]);
        setTotal(0);
        return;
      }
      const normalized = normalizeUsersResponse(result.data);
      setUsers(normalized.items);
      setTotal(normalized.total);
    } catch (error) {
      toast.error(getErrorMessage(error, t("Failed to load users")));
    } finally {
      setLoading(false);
    }
  }, [groupFilter, page, search, t]);

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers, refreshToken]);

  React.useEffect(() => {
    getGroups()
      .then((result) => {
        if (Array.isArray(result.data)) setGroups(result.data);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const triggerRefresh = () => setRefreshToken((value) => value + 1);

  const openCreate = () => {
    setCurrentRow(null);
    setOpen("create");
  };

  const openEdit = (user: User) => {
    setCurrentRow(user);
    setOpen("update");
  };

  const openDelete = (user: User) => {
    setCurrentRow(user);
    setOpen("delete");
  };

  const searchId = React.useId();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-[var(--accent)]" />
            <h1 className="text-2xl font-semibold tracking-tight">{t("Users")}</h1>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t("Manage users and their permissions")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={triggerRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("Refresh")}
          </Button>
          <Button size="sm" onClick={openCreate}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("Create User")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            id={searchId}
            placeholder={t("Filter by username, name or email...")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <Select
            value={groupFilter || GROUP_SELECT_EMPTY}
            onValueChange={(value) => {
              setGroupFilter(value === GROUP_SELECT_EMPTY ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("Group")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GROUP_SELECT_EMPTY}>{t("All groups")}</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="outline">
          {t("Total")}: {total}
        </Badge>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-md" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">ID</TableHead>
                <TableHead>{t("Username")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Quota")}</TableHead>
                <TableHead>{t("Group")}</TableHead>
                <TableHead>{t("Role")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-[var(--muted)]">
                    {t("No Users Found")}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const disabled = user.status === USER_STATUS.DISABLED;
                  return (
                    <TableRow key={user.id} className={cn(disabled && "opacity-60")}>
                      <TableCell className="font-mono text-xs">{user.id}</TableCell>
                      <TableCell>
                        <div className="flex min-w-[190px] items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} alt={user.username} />
                            <AvatarFallback className="text-xs">{initials(user)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                {user.display_name || user.username}
                              </span>
                              {user.remark ? (
                                <Badge variant="outline" className="max-w-[110px] truncate">
                                  {user.remark}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="truncate text-xs text-[var(--muted)]">
                              {user.email || user.username}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <StatusBadge
                            label={user.status === USER_STATUS.ENABLED ? t("Enabled") : t("Disabled")}
                            variant={user.status === USER_STATUS.ENABLED ? "success" : "neutral"}
                            copyable={false}
                          />
                          <div className="text-xs text-[var(--muted)]">
                            {t("Requests:")} {Number(user.request_count || 0).toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <QuotaCell user={user} />
                      </TableCell>
                      <TableCell>
                        <GroupBadge group={user.group || "default"} />
                      </TableCell>
                      <TableCell>{roleBadge(user, t)}</TableCell>
                      <TableCell className="text-right">
                        <UserRowActions
                          user={user}
                          onEdit={openEdit}
                          onDelete={openDelete}
                          onQuota={setQuotaUser}
                          onBindings={(target) => setBindingUserId(target.id)}
                          onSuccess={triggerRefresh}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-[var(--muted)]">
          {t("Page")} {page} {t("of")} {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            {t("Previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            {t("Next")}
          </Button>
        </div>
      </div>

      <UserFormDialog
        open={open === "create" || open === "update"}
        mode={open === "update" ? "update" : "create"}
        currentRow={open === "update" ? currentRow : null}
        groups={groups}
        onOpenChange={(next) => !next && setOpen(null)}
        onSuccess={triggerRefresh}
      />

      <ConfirmDialog
        open={open === "delete"}
        onOpenChange={(next) => !next && setOpen(null)}
        title={t("Delete User?")}
        description={t("This action cannot be undone.")}
        confirmText={t("Delete")}
        cancelText={t("Cancel")}
        variant="destructive"
        onConfirm={async () => {
          if (!currentRow) return;
          const result = await deleteUser(currentRow.id);
          if (result.success) {
            toast.success(t("User deleted successfully"));
            triggerRefresh();
          } else {
            toast.error(result.message || t("Failed to delete user"));
          }
        }}
      />

      <QuotaDialog
        user={quotaUser}
        open={Boolean(quotaUser)}
        onOpenChange={(next) => !next && setQuotaUser(null)}
        onSuccess={triggerRefresh}
      />

      <UserBindingDialog
        open={bindingUserId != null}
        userId={bindingUserId}
        onOpenChange={(next) => !next && setBindingUserId(null)}
        onSuccess={triggerRefresh}
      />
    </div>
  );
}
