"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { checkSetupRequired } from "@/lib/api";
import { getSetupStatus, submitSetup } from "./api";
import type { SetupInfo, UsageMode } from "./types";
import {
  Database,
  User,
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const STEPS = [
  { id: 0, label: "Usage", icon: Sparkles },
  { id: 1, label: "Database", icon: Database },
  { id: 2, label: "Admin", icon: User },
  { id: 3, label: "Review", icon: Check },
] as const;

export function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [usageMode, setUsageMode] = useState<UsageMode>("personal");

  // Step 2 (system info)
  const [setupInfo, setSetupInfo] = useState<SetupInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);

  // Step 3
  const username = "root";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    checkSetupRequired().then((required) => {
      if (!required) {
        router.replace("/");
        return;
      }
      setChecking(false);
      setInfoLoading(true);
      getSetupStatus()
        .then((res) => {
          setSetupInfo(res.data ?? {});
        })
        .catch(() => {
          setSetupInfo({});
        })
        .finally(() => setInfoLoading(false));
    });
  }, [router]);

  const canAdvance = useMemo(() => {
    switch (currentStep) {
      case 0:
        return Boolean(usageMode);
      case 1:
        return !infoLoading;
      case 2: {
        const pwOk = password.length >= 8;
        const matchOk = password === confirmPassword;
        const emailOk =
          !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        return pwOk && matchOk && emailOk;
      }
      case 3:
        return !loading;
      default:
        return false;
    }
  }, [
    currentStep,
    usageMode,
    infoLoading,
    password,
    confirmPassword,
    email,
    loading,
  ]);

  const progressValue = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (!canAdvance) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleComplete = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        username,
        password,
        confirmPassword,
        email: email.trim() || undefined,
        usage_mode: usageMode,
        SelfUseModeEnabled: usageMode === "personal",
        DemoSiteEnabled: false,
      };
      const res = await submitSetup(payload);
      if (res.success) {
        toast.success("Setup complete");
        localStorage.setItem("setup_required", "false");
        router.push("/sign-in");
      } else {
        toast.error(res.message || "Setup failed");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Setup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 bg-[var(--background)]">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-6">
          <div className="space-y-2 text-center">
            <CardTitle className="text-2xl">Initial Setup</CardTitle>
            <CardDescription>
              A quick 4-step wizard to get you running
            </CardDescription>
          </div>

          <Stepper currentStep={currentStep} />

          <Progress value={progressValue} />
        </CardHeader>

        <CardContent className="space-y-6">
          <div
            key={currentStep}
            className="animate-in fade-in duration-200 min-h-[220px]"
          >
            {currentStep === 0 && (
              <StepUsage value={usageMode} onChange={setUsageMode} />
            )}
            {currentStep === 1 && (
              <StepDatabase info={setupInfo} loading={infoLoading} />
            )}
            {currentStep === 2 && (
              <StepAdmin
                username={username}
                password={password}
                confirmPassword={confirmPassword}
                email={email}
                onPasswordChange={setPassword}
                onConfirmChange={setConfirmPassword}
                onEmailChange={setEmail}
              />
            )}
            {currentStep === 3 && (
              <StepReview
                usageMode={usageMode}
                databaseType={setupInfo?.database_type}
                username={username}
                email={email}
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canAdvance}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? "Completing..." : "Complete Setup"}
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Stepper ────────────────────────────────────────────────

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, index) => {
        const isActive = index === currentStep;
        const isDone = index < currentStep;
        const Icon = step.icon;
        return (
          <div
            key={step.id}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors"
                style={{
                  borderColor: isActive || isDone
                    ? "var(--accent)"
                    : "var(--border)",
                  backgroundColor: isDone
                    ? "var(--accent)"
                    : isActive
                      ? "color-mix(in oklab, var(--accent) 15%, transparent)"
                      : "transparent",
                  color: isDone
                    ? "var(--accent-foreground, #fff)"
                    : isActive
                      ? "var(--accent)"
                      : "var(--muted)",
                }}
              >
                {isDone ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className="text-xs"
                style={{
                  color: isActive || isDone
                    ? "var(--foreground)"
                    : "var(--muted)",
                }}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className="mx-2 h-px flex-1 transition-colors"
                style={{
                  backgroundColor:
                    index < currentStep
                      ? "var(--accent)"
                      : "var(--border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Usage ──────────────────────────────────────────

function StepUsage({
  value,
  onChange,
}: {
  value: UsageMode;
  onChange: (v: UsageMode) => void;
}) {
  const options: {
    id: UsageMode;
    title: string;
    description: string;
  }[] = [
    {
      id: "personal",
      title: "Self-hosted personal use",
      description:
        "Single-user setup. Self-use mode enabled, ideal for personal API access.",
    },
    {
      id: "multi",
      title: "Multi-user service",
      description:
        "Open the platform to multiple users with registration, quotas, and billing.",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">How will you use this?</h3>
        <p className="text-sm text-[var(--muted)]">
          Pick the mode that matches your deployment. You can change this later.
        </p>
      </div>
      <div className="grid gap-3">
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className="group flex items-start gap-3 rounded-lg border p-4 text-left transition-colors"
              style={{
                borderColor: selected ? "var(--accent)" : "var(--border)",
                backgroundColor: selected
                  ? "color-mix(in oklab, var(--accent) 8%, transparent)"
                  : "var(--surface)",
              }}
            >
              <span
                className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: selected ? "var(--accent)" : "var(--border)",
                }}
              >
                {selected && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                )}
              </span>
              <div className="space-y-1">
                <div className="text-sm font-medium text-[var(--foreground)]">
                  {opt.title}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {opt.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Database ───────────────────────────────────────

function StepDatabase({
  info,
  loading,
}: {
  info: SetupInfo | null;
  loading: boolean;
}) {
  const dbType = info?.database_type?.toLowerCase();
  const label = dbType
    ? dbType === "mysql"
      ? "MySQL"
      : dbType === "postgres"
        ? "PostgreSQL"
        : dbType === "sqlite"
          ? "SQLite"
          : dbType
    : "Unknown";

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">System check</h3>
        <p className="text-sm text-[var(--muted)]">
          Confirm the backend detected your environment correctly.
        </p>
      </div>

      <div
        className="rounded-lg border p-4 space-y-3"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <Row label="Database">
          {loading ? (
            <Skel />
          ) : (
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--muted)]" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          )}
        </Row>
        <Row label="Status">
          {loading ? (
            <Skel />
          ) : (
            <Badge
              className="border"
              style={{
                borderColor: "var(--success)",
                color: "var(--success)",
                backgroundColor:
                  "color-mix(in oklab, var(--success) 12%, transparent)",
              }}
            >
              Connected
            </Badge>
          )}
        </Row>
        <Row label="Root user">
          {loading ? (
            <Skel />
          ) : (
            <span className="text-sm">
              {info?.root_init ? "Exists" : "Will be created"}
            </span>
          )}
        </Row>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Skel() {
  return (
    <div
      className="h-4 w-20 rounded animate-pulse"
      style={{ backgroundColor: "var(--border)" }}
    />
  );
}

// ─── Step 3: Admin ──────────────────────────────────────────

function StepAdmin({
  username,
  password,
  confirmPassword,
  email,
  onPasswordChange,
  onConfirmChange,
  onEmailChange,
}: {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onEmailChange: (v: string) => void;
}) {
  const passwordTooShort = password.length > 0 && password.length < 8;
  const mismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Admin account</h3>
        <p className="text-sm text-[var(--muted)]">
          Create the root administrator credentials.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" value={username} readOnly disabled />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="At least 8 characters"
          minLength={8}
          autoComplete="new-password"
        />
        {passwordTooShort && (
          <p className="text-xs" style={{ color: "var(--destructive)" }}>
            Password must be at least 8 characters.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => onConfirmChange(e.target.value)}
          autoComplete="new-password"
        />
        {mismatch && (
          <p className="text-xs" style={{ color: "var(--destructive)" }}>
            Passwords do not match.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-[var(--muted)]">(optional)</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
    </div>
  );
}

// ─── Step 4: Review ─────────────────────────────────────────

function StepReview({
  usageMode,
  databaseType,
  username,
  email,
}: {
  usageMode: UsageMode;
  databaseType?: string;
  username: string;
  email: string;
}) {
  const modeLabel =
    usageMode === "personal"
      ? "Self-hosted personal use"
      : "Multi-user service";

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Review & finish</h3>
        <p className="text-sm text-[var(--muted)]">
          Double-check before we initialize the system.
        </p>
      </div>
      <div
        className="rounded-lg border divide-y"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <SummaryRow icon={Sparkles} label="Usage mode" value={modeLabel} />
        <SummaryRow
          icon={Database}
          label="Database"
          value={databaseType ? databaseType.toUpperCase() : "Unknown"}
        />
        <SummaryRow icon={User} label="Admin username" value={username} />
        <SummaryRow
          icon={User}
          label="Admin email"
          value={email.trim() || "—"}
        />
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 p-4"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium text-[var(--foreground)] text-right break-all">
        {value}
      </span>
    </div>
  );
}
