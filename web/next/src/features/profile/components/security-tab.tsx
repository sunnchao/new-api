"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Copy,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  ShieldOff,
  Trash2,
  PlusCircle,
  Fingerprint,
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TwoFAStatus {
  enabled?: boolean;
  has_backup_codes?: boolean;
}

interface TwoFASetupData {
  secret?: string;
  qr_code_data?: string;
  uri?: string;
  backup_codes?: string[];
}

interface PasskeyItem {
  id: number;
  name?: string;
  created_time?: number;
  last_used_time?: number;
}

export function SecurityTab() {
  const { t } = useTranslation();

  // ─── Change Password state ───
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // ─── 2FA state ───
  const [twoFA, setTwoFA] = useState<TwoFAStatus | null>(null);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<0 | 1 | 2>(0);
  const [setupData, setSetupData] = useState<TwoFASetupData | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [setupBusy, setSetupBusy] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableBusy, setDisableBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [backupCodesOpen, setBackupCodesOpen] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);

  // ─── Passkey state ───
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [passkeysLoading, setPasskeysLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

  const fetch2FA = useCallback(async () => {
    setTwoFALoading(true);
    try {
      const res = await api.get("/api/user/2fa/status");
      if (res.data?.success) setTwoFA(res.data.data || {});
    } catch {
      // noop
    } finally {
      setTwoFALoading(false);
    }
  }, []);

  const fetchPasskeys = useCallback(async () => {
    setPasskeysLoading(true);
    try {
      const res = await api.get("/api/user/passkey/status");
      if (res.data?.success) {
        const raw = res.data.data;
        const list: PasskeyItem[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.passkeys)
            ? raw.passkeys
            : [];
        setPasskeys(list);
      }
    } catch {
      // noop
    } finally {
      setPasskeysLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch2FA();
    fetchPasskeys();
  }, [fetch2FA, fetchPasskeys]);

  const twoFAEnabled = !!twoFA?.enabled;

  // ─── Change password ───
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast.error(t("Please fill in all fields"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("Passwords do not match"));
      return;
    }
    setSavingPw(true);
    try {
      const res = await api.put("/api/user/self", {
        old_password: oldPassword,
        password: newPassword,
      });
      if (res.data?.success) {
        toast.success(t("Password updated"));
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.data?.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setSavingPw(false);
    }
  };

  // ─── 2FA Setup ───
  const beginSetup = async () => {
    setSetupOpen(true);
    setSetupStep(0);
    setSetupCode("");
    setSetupData(null);
    setSetupBusy(true);
    try {
      const res = await api.post("/api/user/2fa/setup");
      if (res.data?.success) {
        setSetupData(res.data.data || {});
      } else {
        toast.error(res.data?.message || t("Failed to setup 2FA"));
        setSetupOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("Failed to setup 2FA"));
      setSetupOpen(false);
    } finally {
      setSetupBusy(false);
    }
  };

  const confirmEnable = async () => {
    if (!setupCode) {
      toast.error(t("Please enter the verification code"));
      return;
    }
    setSetupBusy(true);
    try {
      const res = await api.post("/api/user/2fa/enable", { code: setupCode });
      if (res.data?.success) {
        toast.success(t("Two-factor authentication enabled"));
        setSetupOpen(false);
        setSetupCode("");
        setSetupData(null);
        setSetupStep(0);
        fetch2FA();
      } else {
        toast.error(res.data?.message || t("Failed to enable 2FA"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("Failed to enable 2FA"));
    } finally {
      setSetupBusy(false);
    }
  };

  const confirmDisable = async () => {
    if (!disablePassword) {
      toast.error(t("Please enter your password"));
      return;
    }
    setDisableBusy(true);
    try {
      const res = await api.post("/api/user/2fa/disable", {
        password: disablePassword,
      });
      if (res.data?.success) {
        toast.success(t("Two-factor authentication disabled"));
        setDisableOpen(false);
        setDisablePassword("");
        fetch2FA();
      } else {
        toast.error(res.data?.message || t("Failed to disable 2FA"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("Failed to disable 2FA"));
    } finally {
      setDisableBusy(false);
    }
  };

  const regenerateBackupCodes = async () => {
    setBackupBusy(true);
    try {
      const res = await api.post("/api/user/2fa/backup_codes");
      if (res.data?.success) {
        const codes =
          res.data.data?.backup_codes ||
          res.data.data?.codes ||
          res.data.data ||
          [];
        setBackupCodes(Array.isArray(codes) ? codes : []);
        setBackupCodesOpen(true);
        toast.success(t("Backup codes regenerated"));
      } else {
        toast.error(res.data?.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setBackupBusy(false);
    }
  };

  // ─── Passkeys ───
  const handleRegisterPasskey = async () => {
    setRegistering(true);
    try {
      const res = await api.post("/api/user/passkey/register/begin");
      if (res.data?.success) {
        toast.success(
          t(
            "Passkey registration initiated. Complete the flow in your browser."
          )
        );
        fetchPasskeys();
      } else {
        toast.error(res.data?.message || t("Passkey registration unavailable"));
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || t("Passkey registration unavailable")
      );
    } finally {
      setRegistering(false);
    }
  };

  const handleDeletePasskey = async (id: number) => {
    try {
      const res = await api.delete(`/api/user/passkey/${id}`);
      if (res.data?.success) {
        toast.success(t("Passkey removed"));
        fetchPasskeys();
      } else {
        toast.error(res.data?.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const qrValue = useMemo(
    () => setupData?.qr_code_data || setupData?.uri || "",
    [setupData]
  );

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("Copied"));
    } catch {
      toast.error(t("Copy failed"));
    }
  };

  const formatTs = (ts?: number) => {
    if (!ts) return "-";
    const d = new Date(ts * 1000);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* ─── Change Password ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[var(--accent)]" />
            {t("Change Password")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("Current Password")}</Label>
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("New Password")}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Confirm Password")}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={savingPw}>
            {savingPw && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {savingPw ? t("common.loading") : t("Update Password")}
          </Button>
        </CardContent>
      </Card>

      {/* ─── 2FA ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
            {t("Two-Factor Authentication")}
            {twoFAEnabled ? (
              <Badge className="ml-2 bg-[var(--success)]/15 text-[var(--success)] border-transparent">
                {t("Enabled")}
              </Badge>
            ) : (
              <Badge className="ml-2 bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]">
                {t("Disabled")}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            {t(
              "Protect your account with a time-based one-time password from an authenticator app."
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {!twoFAEnabled ? (
              <Button onClick={beginSetup} disabled={twoFALoading}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                {t("Enable 2FA")}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={regenerateBackupCodes}
                  disabled={backupBusy}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  {t("Regenerate Backup Codes")}
                </Button>
                <Button
                  variant="outline"
                  className="border-[var(--destructive)]/40 text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                  onClick={() => setDisableOpen(true)}
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  {t("Disable 2FA")}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Passkeys ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-[var(--accent)]" />
            {t("Passkeys")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            {t(
              "Passkeys let you sign in with your device biometrics or security key instead of a password."
            )}
          </p>

          {passkeysLoading ? (
            <div className="text-sm text-[var(--muted)]">
              {t("common.loading")}
            </div>
          ) : passkeys.length === 0 ? (
            <div className="rounded-md border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--muted)]">
              {t("No passkeys registered")}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">
              {passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--surface)]">
                      <Fingerprint className="h-4 w-4 text-[var(--accent)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {pk.name || t("Passkey #{{id}}", { id: pk.id })}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {t("Added")}: {formatTs(pk.created_time)}
                        {pk.last_used_time
                          ? ` · ${t("Last used")}: ${formatTs(pk.last_used_time)}`
                          : ""}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                    onClick={() => handleDeletePasskey(pk.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    {t("Remove")}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleRegisterPasskey}
            disabled={registering}
          >
            {registering ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="mr-2 h-4 w-4" />
            )}
            {t("Add Passkey")}
          </Button>
        </CardContent>
      </Card>

      {/* ─── 2FA Setup Dialog ─── */}
      <Dialog
        open={setupOpen}
        onOpenChange={(open) => {
          if (!open && !setupBusy) {
            setSetupOpen(false);
            setSetupStep(0);
            setSetupCode("");
            setSetupData(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("Setup Two-Factor Authentication")}</DialogTitle>
            <DialogDescription>
              {t("Step {{n}} of 3", { n: setupStep + 1 })}
            </DialogDescription>
          </DialogHeader>

          {setupBusy && !setupData ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
              <p className="text-sm text-[var(--muted)]">
                {t("Setting up 2FA...")}
              </p>
            </div>
          ) : setupData ? (
            <div className="space-y-4 py-2">
              {setupStep === 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--muted)]">
                    {t(
                      "Scan this QR code with your authenticator app (Google Authenticator, 1Password, etc.)"
                    )}
                  </p>
                  {qrValue ? (
                    <div className="flex justify-center rounded-lg bg-white p-4">
                      <QRCodeSVG value={qrValue} size={200} />
                    </div>
                  ) : null}
                  {setupData.secret && (
                    <div className="flex items-center justify-between gap-3 rounded-md bg-[var(--surface)] p-3">
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--muted)]">
                          {t("Or enter this key manually")}
                        </p>
                        <code className="font-mono text-sm break-all">
                          {setupData.secret}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copy(setupData.secret!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {setupStep === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--muted)]">
                    {t(
                      "Save these backup codes somewhere safe. Each code can be used once."
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-2 rounded-md border border-[var(--border)] p-3">
                    {(setupData.backup_codes || []).map((code, idx) => (
                      <div
                        key={idx}
                        className="rounded bg-[var(--surface)] p-2 text-center font-mono text-sm"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      copy((setupData.backup_codes || []).join("\n"))
                    }
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {t("Copy All Codes")}
                  </Button>
                </div>
              )}

              {setupStep === 2 && (
                <div className="space-y-2">
                  <Label>{t("Verification Code")}</Label>
                  <Input
                    value={setupCode}
                    onChange={(e) =>
                      setSetupCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder={t("Enter 6-digit code")}
                    inputMode="numeric"
                    maxLength={6}
                    disabled={setupBusy}
                  />
                  <p className="text-xs text-[var(--muted)]">
                    {t("Enter the 6-digit code from your authenticator app.")}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            {setupStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setSetupStep((s) => (s - 1) as 0 | 1 | 2)}
                disabled={setupBusy}
              >
                {t("Back")}
              </Button>
            )}
            {setupStep < 2 ? (
              <Button
                onClick={() => setSetupStep((s) => (s + 1) as 0 | 1 | 2)}
                disabled={!setupData || setupBusy}
              >
                {t("Next")}
              </Button>
            ) : (
              <Button
                onClick={confirmEnable}
                disabled={!setupCode || setupBusy}
              >
                {setupBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Enable 2FA")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── 2FA Disable Dialog ─── */}
      <Dialog
        open={disableOpen}
        onOpenChange={(open) => {
          if (!open && !disableBusy) {
            setDisableOpen(false);
            setDisablePassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Disable 2FA")}</DialogTitle>
            <DialogDescription>
              {t("Enter your password to confirm disabling 2FA.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t("Password")}</Label>
            <Input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDisableOpen(false);
                setDisablePassword("");
              }}
              disabled={disableBusy}
            >
              {t("Cancel")}
            </Button>
            <Button
              className="bg-[var(--destructive)] text-white hover:bg-[var(--destructive)]/90"
              onClick={confirmDisable}
              disabled={disableBusy || !disablePassword}
            >
              {disableBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Disable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Backup Codes Dialog ─── */}
      <Dialog open={backupCodesOpen} onOpenChange={setBackupCodesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Backup Codes")}</DialogTitle>
            <DialogDescription>
              {t("Save these codes. Each can be used only once.")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 rounded-md border border-[var(--border)] p-3">
            {(backupCodes || []).map((code, idx) => (
              <div
                key={idx}
                className="rounded bg-[var(--surface)] p-2 text-center font-mono text-sm"
              >
                {code}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => copy((backupCodes || []).join("\n"))}
            >
              <Copy className="mr-2 h-4 w-4" />
              {t("Copy All")}
            </Button>
            <Button onClick={() => setBackupCodesOpen(false)}>
              {t("Done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Separator className="opacity-0" />
    </div>
  );
}
