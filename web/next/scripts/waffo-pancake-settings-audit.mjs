import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

export function auditWaffoPancakeSettings() {
  const sectionText = readSource(
    "src/features/system-settings/integrations/waffo-pancake-settings-section.tsx",
  );
  const apiText = readSource("src/features/system-settings/api.ts");
  const registryText = readSource(
    "src/features/system-settings/billing/section-registry.tsx",
  );

  const obsoleteKeys = [
    "WaffoPancakeEnabled",
    "WaffoPancakeSandbox",
    "WaffoPancakeWebhookPublicKey",
    "WaffoPancakeWebhookTestKey",
    "WaffoPancakeCurrency",
  ];

  const checks = [
    {
      name: "catalog-pair-save-api-helpers-present",
      ok:
        /listWaffoPancakeCatalog/.test(apiText) &&
        /\/api\/option\/waffo-pancake\/catalog/.test(apiText) &&
        /createWaffoPancakePair/.test(apiText) &&
        /\/api\/option\/waffo-pancake\/pair/.test(apiText) &&
        /saveWaffoPancakeConfig/.test(apiText) &&
        /\/api\/option\/waffo-pancake\/save/.test(apiText),
      message:
        "Waffo Pancake settings should use backend catalog, pair, and save endpoints.",
    },
    {
      name: "settings-section-uses-catalog-pair-save-flow",
      ok:
        /listWaffoPancakeCatalog/.test(sectionText) &&
        /createWaffoPancakePair/.test(sectionText) &&
        /saveWaffoPancakeConfig/.test(sectionText),
      message:
        "The Waffo Pancake section should verify credentials, create a store/product pair, and save through the Pancake save endpoint.",
    },
    {
      name: "settings-section-does-not-use-obsolete-option-keys",
      ok: obsoleteKeys.every((key) => !sectionText.includes(key)),
      message:
        "The Waffo Pancake section should not expose obsolete enabled/sandbox/webhook/currency option keys.",
    },
    {
      name: "section-registry-does-not-seed-obsolete-option-keys",
      ok: obsoleteKeys.every((key) => !registryText.includes(key)),
      message:
        "System settings defaults should not seed obsolete Waffo Pancake option keys.",
    },
    {
      name: "save-payload-uses-store-and-product-binding",
      ok:
        /storeID/.test(sectionText) &&
        /productID/.test(sectionText) &&
        /merchantID/.test(sectionText) &&
        /privateKey/.test(sectionText) &&
        /returnURL/.test(sectionText),
      message:
        "The final Waffo Pancake save payload should include merchant credentials, return URL, store ID, and product ID.",
    },
    {
      name: "save-success-refreshes-saved-binding",
      ok:
        /useQueryClient/.test(sectionText) &&
        /response\.data/.test(sectionText) &&
        /setValues\(\(previous\)/.test(sectionText) &&
        /WaffoPancakeStoreID:\s*saved\.store_id/.test(sectionText) &&
        /WaffoPancakeProductID:\s*saved\.product_id/.test(sectionText) &&
        /invalidateQueries\(\{\s*queryKey:\s*\['system-options'\]/.test(
          sectionText,
        ),
      message:
        "After /api/option/waffo-pancake/save succeeds, the Next section should consume the returned store/product binding and invalidate system-options so the saved binding UI is not stale.",
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
  const report = auditWaffoPancakeSettings();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
