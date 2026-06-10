import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

function readSourceIfExists(relativePath) {
  const fullPath = path.join(nextRoot, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
}

function registersBundle(source) {
  return (
    /from ['"]@\/i18n\/config['"]/.test(source) &&
    /addResourceBundle\(/.test(source)
  );
}

const rankingsRequiredKeys = [
  "+{{count}} more",
  "All-time",
  "By model author",
  "Compare the most popular models on the platform",
  "Daily token usage by model across the past month",
  "Discover the most-used models and rising vendors on the platform, updated from live usage data.",
  "Hourly",
  "Hourly token usage by model across the last 24 hours",
  "Leaderboards",
  "LLM Leaderboard",
  "Market Share",
  "Models climbing the leaderboard",
  "Models losing positions",
  "Month",
  "No history data available",
  "No models match the selected filters",
  "No notable climbers right now",
  "No notable drops right now",
  "No vendor data available",
  "Period",
  "Rankings",
  "Today",
  "Token share by model author across the last 24 hours",
  "Token share by model author across the past few weeks",
  "Token share by model author across the past month",
  "Token share by model author across the past year",
  "Token share by model author since launch",
  "Token usage by model since launch",
  "tokens",
  "Top Models",
  "Total:",
  "Trending down",
  "Trending up",
  "Unable to load rankings",
  "Unable to load rankings data",
  "Vendors ranked by aggregated token volume",
  "Week",
  "Weekly token usage by model across the past few weeks",
  "Weekly token usage by model across the past year",
  "Year",
];

const systemSettingsRequiredKeys = [
  "Next.js Frontend",
  "Switch between default, classic, and Next.js frontends. The Next.js option requires NEXT_FRONTEND_BASE_URL or FRONTEND_NEXT_BASE_URL to point at a running Next server.",
];

export function auditFeatureLocalI18n() {
  const pricingIndex = readSource("src/features/pricing/index.tsx");
  const pricingI18n = readSource("src/features/pricing/i18n.ts");
  const usageLogsIndex = readSource("src/features/usage-logs/index.tsx");
  const usageLogsI18n = readSource("src/features/usage-logs/i18n.ts");
  const invoicesIndex = readSource("src/features/invoices/index.tsx");
  const invoicesI18n = readSource("src/features/invoices/i18n.ts");
  const rankingsIndex = readSource("src/features/rankings/index.tsx");
  const rankingsI18n = readSourceIfExists("src/features/rankings/i18n.ts");
  const systemSettingsLayout = readSource(
    "src/app/(app)/system-settings/layout.tsx",
  );
  const systemSettingsI18n = readSourceIfExists(
    "src/features/system-settings/i18n.ts",
  );

  const checks = [
    {
      name: "pricing-registers-local-i18n",
      ok: registersBundle(pricingI18n),
      message:
        "Pricing feature-local translations should be registered with i18next.",
    },
    {
      name: "pricing-imports-local-i18n",
      ok: /import ['"]\.\/i18n['"]/.test(pricingIndex),
      message:
        "Pricing feature entry should import its local i18n bundle before rendering translated pricing details.",
    },
    {
      name: "usage-logs-registers-local-i18n",
      ok: registersBundle(usageLogsI18n),
      message:
        "Usage logs feature-local translations should be registered with i18next.",
    },
    {
      name: "usage-logs-imports-local-i18n",
      ok: /import ['"]\.\/i18n['"]/.test(usageLogsIndex),
      message:
        "Usage logs feature entry should import its local i18n bundle so columns like request_ip are translated.",
    },
    {
      name: "invoices-registers-local-i18n",
      ok: registersBundle(invoicesI18n),
      message:
        "Invoices feature-local translations should be registered with i18next.",
    },
    {
      name: "invoices-imports-local-i18n",
      ok: /import ['"]\.\/i18n['"]/.test(invoicesIndex),
      message:
        "Invoices feature entry should import its local i18n bundle before rendering invoice copy.",
    },
    {
      name: "rankings-registers-local-i18n",
      ok: registersBundle(rankingsI18n),
      message:
        "Rankings feature-local translations should be registered with i18next.",
    },
    {
      name: "rankings-imports-local-i18n",
      ok: /import ['"]\.\/i18n['"]/.test(rankingsIndex),
      message:
        "Rankings feature entry should import its local i18n bundle before rendering leaderboard copy.",
    },
    {
      name: "rankings-local-i18n-covers-flat-keys",
      ok: rankingsRequiredKeys.every((key) =>
        rankingsI18n.includes(JSON.stringify(key).slice(1, -1))
      ),
      message:
        "Rankings feature-local translations should cover the flat English keys used by the copied leaderboard components.",
    },
    {
      name: "system-settings-registers-local-i18n",
      ok: registersBundle(systemSettingsI18n),
      message:
        "System settings feature-local translations should be registered with i18next.",
    },
    {
      name: "system-settings-imports-local-i18n",
      ok: /import ['"]@\/features\/system-settings\/i18n['"]/.test(
        systemSettingsLayout,
      ),
      message:
        "System settings layout should import its local i18n bundle before rendering settings copy.",
    },
    {
      name: "system-settings-local-i18n-covers-next-theme-copy",
      ok: systemSettingsRequiredKeys.every((key) =>
        systemSettingsI18n.includes(JSON.stringify(key).slice(1, -1))
      ),
      message:
        "System settings feature-local translations should cover Next frontend theme labels and descriptions.",
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
  const report = auditFeatureLocalI18n();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
