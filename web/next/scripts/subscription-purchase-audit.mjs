import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

const sources = {
  publicPlans: "src/features/subscription-plans/index.tsx",
  walletPlans: "src/features/wallet/components/subscription-plans-card.tsx",
  planForm: "src/features/subscriptions/lib/plan-form.ts",
  purchaseDialog:
    "src/features/subscriptions/components/dialogs/subscription-purchase-dialog.tsx",
  subscriptionTypes: "src/features/subscriptions/types.ts",
  authSignIn: "src/features/auth/sign-in/index.tsx",
  authForm: "src/features/auth/sign-in/components/user-auth-form.tsx",
  authRedirect: "src/features/auth/hooks/use-auth-redirect.ts",
};

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

export function auditSubscriptionPurchase() {
  const publicPlans = readSource(sources.publicPlans);
  const walletPlans = readSource(sources.walletPlans);
  const planForm = readSource(sources.planForm);
  const purchaseDialog = readSource(sources.purchaseDialog);
  const subscriptionTypes = readSource(sources.subscriptionTypes);
  const authSignIn = readSource(sources.authSignIn);
  const authForm = readSource(sources.authForm);
  const authRedirect = readSource(sources.authRedirect);

  const checks = [
    {
      name: "public-plan-subscribe-hands-off-selected-plan",
      ok:
        /handleSubscribe = \(record: PlanRecord\)/.test(publicPlans) &&
        /\/my-subscriptions\?plan_id=\$\{encodeURIComponent/.test(
          publicPlans
        ) &&
        /String\(record\.plan\.id\)/.test(publicPlans) &&
        /actionOverride=\{\{/.test(publicPlans) &&
        /onClick:\s*\(\) => handleSubscribe\(record\)/.test(publicPlans),
      message:
        "Public subscription plan CTA should carry the selected plan_id into the authenticated purchase page.",
    },
    {
      name: "unauthenticated-plan-subscribe-preserves-purchase-target",
      ok:
        /\/sign-in\?redirect=\$\{encodeURIComponent\(purchasePath\)\}/.test(
          publicPlans
        ) &&
        /searchParams\.get\(['"]redirect['"]\)/.test(authSignIn) &&
        /<UserAuthForm\s+redirectTo=\{redirect\}\s*\/>/.test(authSignIn) &&
        /handleLoginSuccess\([^,]+,\s*redirectTo\)/.test(authForm) &&
        /const targetPath = redirectTo \|\| ['"]\/dashboard['"]/.test(
          authRedirect
        ) &&
        /router\.replace\(targetPath\)/.test(authRedirect),
      message:
        "Unauthenticated public plan CTA should preserve the selected purchase target through sign-in.",
    },
    {
      name: "my-subscriptions-opens-purchase-dialog-from-plan-id",
      ok:
        /useSearchParams/.test(walletPlans) &&
        /searchParams\.get\(['"]plan_id['"]\)/.test(walletPlans) &&
        /plans\.find\(\(item\) => item\?\.plan\?\.id === planId\)/.test(
          walletPlans
        ) &&
        /setSelectedPlan\(target\)/.test(walletPlans) &&
        /setPurchaseOpen\(true\)/.test(walletPlans),
      message:
        "/my-subscriptions should open the existing purchase dialog for the selected plan_id after plans load.",
    },
    {
      name: "my-subscriptions-supports-legacy-subscribe-plan",
      ok:
        /searchParams\.get\(['"]subscribe_plan['"]\)/.test(walletPlans) &&
        /searchParams\.get\(['"]plan_id['"]\)\s*\|\|\s*searchParams\.get\(['"]subscribe_plan['"]\)/.test(
          walletPlans
        ),
      message:
        "/my-subscriptions should also consume classic subscribe_plan links preserved from /console/subscriptions.",
    },
    {
      name: "my-subscriptions-cleans-plan-id-url",
      ok:
        /router\.replace\(['"]\/my-subscriptions['"],\s*\{\s*scroll:\s*false\s*\}\)/.test(
          walletPlans
        ) && /if \(!Number\.isFinite\(planId\) \|\| !target\) return/.test(walletPlans),
      message:
        "/my-subscriptions should clear plan_id after consuming it, including invalid or missing plans.",
    },
    {
      name: "purchase-dialog-remains-backed-by-payment-apis",
      ok:
        /paySubscriptionStripe/.test(purchaseDialog) &&
        /paySubscriptionCreem/.test(purchaseDialog) &&
        /paySubscriptionEpay/.test(purchaseDialog) &&
        /paySubscriptionBalance/.test(purchaseDialog) &&
        /plan_id:\s*plan\.id/.test(purchaseDialog),
      message:
        "Selected public plans should land in the existing purchase dialog backed by subscription payment APIs.",
    },
    {
      name: "purchase-dialog-supports-waffo-pancake-checkout",
      ok:
        /paySubscriptionWaffoPancake/.test(purchaseDialog) &&
        /enableWaffoPancake\?: boolean/.test(purchaseDialog) &&
        /plan\.waffo_pancake_product_id/.test(purchaseDialog) &&
        /window\.location\.href = res\.data\.checkout_url/.test(
          purchaseDialog
        ) &&
        /enableWaffoPancake=\{enableWaffoPancake\}/.test(walletPlans) &&
        /enable_waffo_pancake_topup/.test(walletPlans) &&
        /waffo_pancake_product_id: z\.string\(\)\.optional\(\)/.test(
          subscriptionTypes
        ),
      message:
        "Subscription purchase should expose Waffo Pancake checkout when top-up info and the plan product ID allow it.",
    },
    {
      name: "plan-form-preserves-balance-payment-flag",
      ok:
        /allow_balance_pay:\s*z\.boolean\(\)/.test(planForm) &&
        /allow_balance_pay:\s*true/.test(planForm) &&
        /allow_balance_pay:\s*plan\.allow_balance_pay !== false/.test(
          planForm
        ),
      message:
        "Subscription plan create/update forms must preserve allow_balance_pay so admin edits do not silently re-enable or drop the backend payment flag.",
    },
    {
      name: "plan-form-preserves-waffo-pancake-product-id",
      ok:
        /waffo_pancake_product_id:\s*z\.string\(\)\.optional\(\)/.test(
          planForm
        ) &&
        /waffo_pancake_product_id:\s*['"]['"]/.test(planForm) &&
        /waffo_pancake_product_id:\s*plan\.waffo_pancake_product_id \|\| ['"]['"]/.test(
          planForm
        ),
      message:
        "Subscription plan create/update forms must preserve waffo_pancake_product_id so Waffo Pancake checkout remains available after admin edits.",
    },
    {
      name: "purchase-dialog-gates-balance-by-plan",
      ok:
        /const allowBalancePay = plan\.allow_balance_pay !== false/.test(
          purchaseDialog
        ) &&
        /if \(!allowBalancePay\)/.test(purchaseDialog) &&
        /This plan does not allow balance redemption/.test(purchaseDialog),
      message:
        "Subscription purchase dialog must honor plan.allow_balance_pay instead of showing balance payment for every plan.",
    },
    {
      name: "wallet-plan-cards-expose-supported-models",
      ok:
        /PublicPlanModelsDialog/.test(walletPlans) &&
        /parseAllowedGroups\(plan\.allowed_groups\)/.test(walletPlans) &&
        /setModelsPlan\(p\)/.test(walletPlans) &&
        /t\('View all models'\)/.test(walletPlans) &&
        /groups=\{modelsPlanGroups\}/.test(walletPlans),
      message:
        "Authenticated wallet plan cards should preserve the public catalog's supported-models dialog for allowed groups.",
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
  const report = auditSubscriptionPurchase();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
