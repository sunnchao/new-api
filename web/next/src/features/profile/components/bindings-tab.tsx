"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Link2, Mail, Send, Shield } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";

type ProviderId =
  | "github"
  | "discord"
  | "oidc"
  | "telegram"
  | "linuxdo"
  | "wechat";

interface BindingDef {
  id: ProviderId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value?: string;
  isBound: boolean;
}

export function BindingsTab() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.auth.user);
  const setUser = useAuthStore((s) => s.setUser);

  const bindings: BindingDef[] = useMemo(() => {
    if (!user) return [];
    return [
      {
        id: "github",
        label: t("GitHub"),
        icon: Link2,
        value: user.github_id,
        isBound: !!user.github_id,
      },
      {
        id: "discord",
        label: t("Discord"),
        icon: Link2,
        value: (user as unknown as Record<string, string | undefined>)
          .discord_id,
        isBound: !!(user as unknown as Record<string, string | undefined>)
          .discord_id,
      },
      {
        id: "oidc",
        label: t("OIDC"),
        icon: Shield,
        value: user.oidc_id,
        isBound: !!user.oidc_id,
      },
      {
        id: "telegram",
        label: t("Telegram"),
        icon: Send,
        value: user.telegram_id,
        isBound: !!user.telegram_id,
      },
      {
        id: "linuxdo",
        label: t("LinuxDO"),
        icon: Link2,
        value: user.linux_do_id,
        isBound: !!user.linux_do_id,
      },
      {
        id: "wechat",
        label: t("WeChat"),
        icon: Mail,
        value: user.wechat_id,
        isBound: !!user.wechat_id,
      },
    ];
  }, [user, t]);

  const handleBind = (id: ProviderId) => {
    // Simple OAuth redirect; server handles bind-on-return flow.
    const redirect = `${window.location.origin}/oauth/${id}?bind=true`;
    window.location.href = `/api/oauth/${id}?redirect=${encodeURIComponent(
      redirect
    )}`;
  };

  const handleUnbind = async (id: ProviderId) => {
    try {
      const res = await api.get(`/api/oauth/${id}/unbind`);
      if (res.data?.success) {
        toast.success(t("Unbound"));
        if (user) {
          const fieldMap: Record<ProviderId, string> = {
            github: "github_id",
            discord: "discord_id",
            oidc: "oidc_id",
            telegram: "telegram_id",
            linuxdo: "linux_do_id",
            wechat: "wechat_id",
          };
          const patched = { ...user, [fieldMap[id]]: "" } as typeof user;
          setUser(patched);
        }
      } else {
        toast.error(res.data?.message || t("Unbind failed"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("Unbind failed"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-[var(--accent)]" />
          {t("Account Bindings")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bindings.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/40 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--surface)]">
                    <Icon className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{b.label}</span>
                      {b.isBound ? (
                        <Badge className="bg-[var(--success)]/15 text-[var(--success)] border-transparent">
                          {t("Bound")}
                        </Badge>
                      ) : (
                        <Badge className="bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]">
                          {t("Not bound")}
                        </Badge>
                      )}
                    </div>
                    <div className="truncate text-xs text-[var(--muted)]">
                      {b.isBound ? b.value || t("Bound") : t("Not bound")}
                    </div>
                  </div>
                </div>
                {b.isBound ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                    onClick={() => handleUnbind(b.id)}
                  >
                    {t("Unbind")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleBind(b.id)}
                  >
                    {t("Bind")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
