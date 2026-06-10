import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

function readOptionalSource(relativePath) {
  const sourcePath = path.join(nextRoot, relativePath);
  return fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, "utf8") : "";
}

export function auditSubscriptionRenew() {
  const api = readSource("src/features/subscriptions/api.ts");
  const types = readSource("src/features/subscriptions/types.ts");
  const walletCard = readSource(
    "src/features/wallet/components/subscription-plans-card.tsx"
  );
  const renewDialogPath =
    "src/features/subscriptions/components/dialogs/subscription-renew-dialog.tsx";
  const renewDialog = readOptionalSource(renewDialogPath);
  const renewPayRequestBody =
    types.match(/export interface RenewPayRequest\s*\{([\s\S]*?)\}/)?.[1] ||
    "";

  const checks = [
    {
      name: "renew-pay-request-uses-user-subscription-id",
      ok:
        /user_subscription_id:\s*number/.test(renewPayRequestBody) &&
        !/plan_id/.test(renewPayRequestBody),
      message:
        "Subscription renewal payment requests must send user_subscription_id, matching backend renew endpoints.",
    },
    {
      name: "renew-balance-helper-uses-renew-pay-request",
      ok:
        /renewPayBalance\(\s*data:\s*RenewPayRequest\s*\)/.test(api) &&
        /\/api\/subscription\/renew\/balance\/pay/.test(api),
      message:
        "Balance renewal helper should accept RenewPayRequest rather than the plan purchase payload.",
    },
    {
      name: "renew-stripe-helper-uses-renew-pay-request",
      ok:
        /renewPayStripe\(\s*data:\s*RenewPayRequest\s*\)/.test(api) &&
        /\/api\/subscription\/renew\/stripe\/pay/.test(api),
      message:
        "Stripe renewal helper should accept RenewPayRequest rather than the plan purchase payload.",
    },
    {
      name: "renew-creem-helper-uses-renew-pay-request",
      ok:
        /renewPayCreem\(\s*data:\s*RenewPayRequest\s*\)/.test(api) &&
        /\/api\/subscription\/renew\/creem\/pay/.test(api),
      message:
        "Creem renewal helper should accept RenewPayRequest rather than the plan purchase payload.",
    },
    {
      name: "renew-dialog-exists",
      ok: renewDialog.length > 0,
      message:
        "User-facing renewal parity requires SubscriptionRenewDialog to be implemented.",
    },
    {
      name: "renew-dialog-sends-user-subscription-id",
      ok:
        /renewPayBalance\(\s*\{\s*user_subscription_id:\s*subId\s*\}\s*\)/.test(
          renewDialog
        ) &&
        /renewPayStripe\(\s*\{\s*user_subscription_id:\s*subId\s*\}\s*\)/.test(
          renewDialog
        ) &&
        /renewPayCreem\(\s*\{\s*user_subscription_id:\s*subId\s*\}\s*\)/.test(
          renewDialog
        ) &&
        !/renewPay(?:Balance|Stripe|Creem)\(\s*\{\s*plan_id/.test(
          renewDialog
        ),
      message:
        "Renewal payment buttons must call renew helpers with user_subscription_id and never plan_id.",
    },
    {
      name: "wallet-card-mounts-renew-dialog",
      ok:
        /SubscriptionRenewDialog/.test(walletCard) &&
        /renewOpen/.test(walletCard) &&
        /selectedRenewSub/.test(walletCard) &&
        /onRenewSuccess=\{fetchSelfSubscription\}/.test(walletCard) &&
        /subscription=\{selectedRenewSub\}/.test(walletCard) &&
        /planRecordMap\.get\(selectedRenewSub\.subscription\.plan_id\)/.test(
          walletCard
        ),
      message:
        "My Subscriptions must mount SubscriptionRenewDialog with the selected user subscription and matching plan.",
    },
    {
      name: "active-subscriptions-show-renew-action",
      ok:
        /isActive[\s\S]*setSelectedRenewSub\(sub\)[\s\S]*setRenewOpen\(true\)[\s\S]*t\('Renew'\)/.test(
          walletCard
        ),
      message:
        "Active subscriptions need a visible Renew action that opens the renewal dialog.",
    },
    {
      name: "scheduled-renewal-status-is-visible",
      ok:
        /subscription\?\.status\s*===\s*'scheduled'/.test(walletCard) &&
        /t\('Pending'\)/.test(walletCard) &&
        /t\('Scheduled to activate at'\)/.test(walletCard) &&
        /t\('Estimated expiry'\)/.test(walletCard),
      message:
        "Renewal-created scheduled subscriptions must be shown as pending with activation and expiry times.",
    },
    {
      name: "scheduled-renewal-activation-is-wired",
      ok:
        /activateScheduledSubscription/.test(walletCard) &&
        /handleActivateScheduled/.test(walletCard) &&
        /setActivateConfirmSubId\(subscription!?\.(?:id|id)\)/.test(
          walletCard
        ) &&
        /t\('Activate Now'\)/.test(walletCard),
      message:
        "Scheduled subscriptions need an Activate Now action wired to the scheduled activation endpoint.",
    },
  ];

  const failures = checks.filter((check) => !check.ok);

  return {
    checkCount: checks.length,
    failureCount: failures.length,
    checks,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectInvocation = invokedPath === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  const report = auditSubscriptionRenew();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
