import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

const sources = {
  api: "src/features/wallet/api.ts",
  affiliateCard: "src/features/wallet/components/affiliate-rewards-card.tsx",
  affiliateHook: "src/features/wallet/hooks/use-affiliate.ts",
  paymentHook: "src/features/wallet/hooks/use-payment.ts",
  paymentLib: "src/features/wallet/lib/payment.ts",
  pancakeHook: "src/features/wallet/hooks/use-waffo-pancake-payment.ts",
  creemHook: "src/features/wallet/hooks/use-creem-payment.ts",
  rechargeForm: "src/features/wallet/components/recharge-form-card.tsx",
  redemptionHook: "src/features/wallet/hooks/use-redemption.ts",
  waffoHook: "src/features/wallet/hooks/use-waffo-payment.ts",
  walletPage: "src/features/wallet/index.tsx",
  walletRuntimeSmoke: "scripts/wallet-runtime-smoke.spec.js",
};

function readSource(relativePath, warnings) {
  try {
    return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
  } catch (error) {
    warnings.push({
      type: "read-file",
      path: relativePath,
      message: error.message,
    });
    return "";
  }
}

export function auditWalletRuntime() {
  const warnings = [];
  const api = readSource(sources.api, warnings);
  const affiliateCard = readSource(sources.affiliateCard, warnings);
  const affiliateHook = readSource(sources.affiliateHook, warnings);
  const paymentHook = readSource(sources.paymentHook, warnings);
  const paymentLib = readSource(sources.paymentLib, warnings);
  const pancakeHook = readSource(sources.pancakeHook, warnings);
  const creemHook = readSource(sources.creemHook, warnings);
  const rechargeForm = readSource(sources.rechargeForm, warnings);
  const redemptionHook = readSource(sources.redemptionHook, warnings);
  const waffoHook = readSource(sources.waffoHook, warnings);
  const walletPage = readSource(sources.walletPage, warnings);
  const walletRuntimeSmoke = readSource(sources.walletRuntimeSmoke, warnings);

  const checks = [
    {
      name: "amount-quote-smoke-and-source-covered",
      ok:
        /calculatePaymentAmount/.test(walletPage) &&
        /calculateStripeAmount/.test(paymentHook) &&
        /calculateWaffoPancakeAmount/.test(paymentHook) &&
        /api\.post\(['"]\/api\/user\/amount['"]/.test(api) &&
        /api\.post\(['"]\/api\/user\/stripe\/amount['"]/.test(api) &&
        /api\.post\(['"]\/api\/user\/waffo-pancake\/amount['"]/.test(api) &&
        /\/api\/user\/amount/.test(walletRuntimeSmoke) &&
        /\/api\/user\/stripe\/amount/.test(walletRuntimeSmoke) &&
        /\/api\/user\/waffo-pancake\/amount/.test(walletRuntimeSmoke) &&
        /request\.body\?\.amount === 25/.test(walletRuntimeSmoke) &&
        /request\.body\?\.amount === 17/.test(walletRuntimeSmoke),
      message:
        "Wallet runtime smoke should cover quoted amounts, and source should route standard, Stripe, and Waffo Pancake quote requests to their dedicated APIs.",
    },
    {
      name: "runtime-epay-payment-smoke-and-source-covered",
      ok:
        /requestPayment/.test(paymentHook) &&
        /payment_method:\s*paymentType/.test(paymentHook) &&
        /submitPaymentForm\(url,\s*response\.data\)/.test(paymentHook) &&
        /api\.post\(['"]\/api\/user\/pay['"]/.test(api) &&
        /Runtime Pay/.test(walletRuntimeSmoke) &&
        /\/api\/user\/pay/.test(walletRuntimeSmoke) &&
        /request\.body\?\.payment_method === ["']runtime_pay["']/.test(
          walletRuntimeSmoke
        ),
      message:
        "Wallet runtime smoke should cover generic Epay-style payment methods backed by /api/user/pay.",
    },
    {
      name: "stripe-payment-smoke-and-source-covered",
      ok:
        /requestStripePayment/.test(paymentHook) &&
        /payment_method:\s*['"]stripe['"]/.test(paymentHook) &&
        /window\.open\(response\.data\.pay_link as string,\s*['"]_blank['"]\)/.test(
          paymentHook
        ) &&
        /api\.post\(['"]\/api\/user\/stripe\/pay['"]/.test(api) &&
        /Stripe/.test(walletRuntimeSmoke) &&
        /\/api\/user\/stripe\/pay/.test(walletRuntimeSmoke) &&
        /https:\/\/payments\.example\.test\/stripe/.test(walletRuntimeSmoke),
      message:
        "Wallet runtime smoke should cover Stripe checkout, and source should request Stripe payment links from /api/user/stripe/pay.",
    },
    {
      name: "creem-checkout-smoke-and-source-covered",
      ok:
        /processCreemPayment\(selectedCreemProduct\.productId\)/.test(
          walletPage
        ) &&
        /requestCreemPayment/.test(creemHook) &&
        /payment_method:\s*['"]creem['"]/.test(creemHook) &&
        /window\.open\(response\.data\.checkout_url,\s*['"]_blank['"]\)/.test(
          creemHook
        ) &&
        /api\.post\(['"]\/api\/user\/creem\/pay['"]/.test(api) &&
        /enable_creem_topup:\s*true/.test(walletRuntimeSmoke) &&
        /Creem Payment/.test(walletRuntimeSmoke) &&
        /Confirm Creem Purchase/.test(walletRuntimeSmoke) &&
        /\/api\/user\/creem\/pay/.test(walletRuntimeSmoke) &&
        /request\.body\?\.product_id === ["']creem-runtime-basic["']/.test(
          walletRuntimeSmoke
        ) &&
        /https:\/\/payments\.example\.test\/creem/.test(walletRuntimeSmoke),
      message:
        "Wallet runtime smoke should cover Creem checkout and source should submit product-based payments through /api/user/creem/pay.",
    },
    {
      name: "waffo-checkout-smoke-and-source-covered",
      ok:
        /processWaffoPayment\(topupAmount,\s*index\)/.test(walletPage) &&
        /requestWaffoPayment/.test(waffoHook) &&
        /pay_method_index:\s*payMethodIndex/.test(waffoHook) &&
        /window\.open\(paymentUrl,\s*['"]_blank['"]\)/.test(waffoHook) &&
        /api\.post\(['"]\/api\/user\/waffo\/pay['"]/.test(api) &&
        /enable_waffo_topup:\s*true/.test(walletRuntimeSmoke) &&
        /Waffo Payment/.test(walletRuntimeSmoke) &&
        /\/api\/user\/waffo\/pay/.test(walletRuntimeSmoke) &&
        /request\.body\?\.amount === 12/.test(walletRuntimeSmoke) &&
        /request\.body\?\.pay_method_index === 1/.test(walletRuntimeSmoke) &&
        /https:\/\/payments\.example\.test\/waffo/.test(walletRuntimeSmoke),
      message:
        "Wallet runtime smoke should cover non-Pancake Waffo checkout and source should pass the selected server-side payment method index to /api/user/waffo/pay.",
    },
    {
      name: "redemption-smoke-and-source-covered",
      ok:
        /redeemTopupCode\(\{ key: code \}\)/.test(redemptionHook) &&
        /api\.post\(['"]\/api\/user\/topup['"]/.test(api) &&
        /Have a Code\?/.test(rechargeForm) &&
        /Redeem/.test(rechargeForm) &&
        /RUNTIME-CODE-123/.test(walletRuntimeSmoke) &&
        /\/api\/user\/topup/.test(walletRuntimeSmoke) &&
        /request\.body\?\.key === ["']RUNTIME-CODE-123["']/.test(
          walletRuntimeSmoke
        ),
      message:
        "Wallet runtime smoke should cover redemption codes through the wallet form and /api/user/topup.",
    },
    {
      name: "affiliate-transfer-smoke-and-source-covered",
      ok:
        /transferAffiliateQuota\(\{ quota \}\)/.test(affiliateHook) &&
        /api\.post\(['"]\/api\/user\/aff_transfer['"]/.test(api) &&
        /Transfer to Balance/.test(affiliateCard) &&
        /Transfer Rewards/.test(walletRuntimeSmoke) &&
        /\/api\/user\/aff_transfer/.test(walletRuntimeSmoke) &&
        /request\.body\?\.quota === 1000000/.test(walletRuntimeSmoke),
      message:
        "Wallet runtime smoke should cover transferring affiliate rewards to balance through /api/user/aff_transfer.",
    },
    {
      name: "waffo-pancake-checkout-smoke-and-source-covered",
      ok:
        /isWaffoPancakePayment/.test(walletPage) &&
        /processWaffoPancakePayment\(topupAmount\)/.test(walletPage) &&
        /requestWaffoPancakePayment/.test(pancakeHook) &&
        /api\.post\(['"]\/api\/user\/waffo-pancake\/pay['"]/.test(api) &&
        /enable_waffo_pancake_topup:\s*true/.test(walletRuntimeSmoke) &&
        /Waffo Pancake/.test(walletRuntimeSmoke) &&
        /\/api\/user\/waffo-pancake\/pay/.test(walletRuntimeSmoke) &&
        /request\.body\?\.amount === 1/.test(walletRuntimeSmoke),
      message:
        "Wallet runtime smoke should cover Waffo Pancake checkout and source should dispatch it through the dedicated Pancake payment hook/API.",
    },
    {
      name: "compliance-disabled-states-smoke-and-source-covered",
      ok:
        /topupInfo\?\.enable_redemption !== false/.test(rechargeForm) &&
        /topupInfo\?\.payment_compliance_confirmed !== false/.test(
          walletPage
        ) &&
        /disabled=\{!complianceConfirmed\}/.test(affiliateCard) &&
        /Redemption codes are disabled until the administrator confirms compliance terms/.test(
          rechargeForm
        ) &&
        /Referral reward transfer is disabled until the administrator confirms compliance terms/.test(
          affiliateCard
        ) &&
        /honors wallet compliance flags for redemption and affiliate transfer/.test(
          walletRuntimeSmoke
        ) &&
        /enable_redemption:\s*false/.test(walletRuntimeSmoke) &&
        /payment_compliance_confirmed:\s*false/.test(walletRuntimeSmoke) &&
        /toBeDisabled\(\)/.test(walletRuntimeSmoke),
      message:
        "Wallet runtime smoke and source should preserve compliance-disabled states for redemption codes and affiliate transfers.",
    },
    {
      name: "waffo-pancake-same-tab-checkout-covered",
      ok:
        /window\.location\.href = checkoutUrl/.test(pancakeHook) &&
        !/window\.open/.test(pancakeHook) &&
        /Only http\/https are allowed/.test(pancakeHook) &&
        /redirects Waffo Pancake checkout in the current tab/.test(
          walletRuntimeSmoke
        ) &&
        /page\.waitForURL\(["']https:\/\/payments\.example\.test\/pancake["']\)/.test(
          walletRuntimeSmoke
        ) &&
        /expect\(windowUrls\)\.toEqual\(\[\]\)/.test(walletRuntimeSmoke),
      message:
        "Waffo Pancake checkout should use same-tab navigation and smoke should assert no popup/window.open path is used.",
    },
  ];

  const failures = checks.filter((check) => !check.ok);

  return {
    checkCount: checks.length,
    failureCount: failures.length,
    checks,
    warnings,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectInvocation = invokedPath === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  const report = auditWalletRuntime();

  console.log(JSON.stringify(report, null, 2));

  if (
    process.argv.includes("--fail-on-gap") &&
    (report.failureCount > 0 || report.warnings.length > 0)
  ) {
    process.exitCode = 1;
  }
}
