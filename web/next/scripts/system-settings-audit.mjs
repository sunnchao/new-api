import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

const files = {
  api: "src/features/system-settings/api.ts",
  behaviorSection:
    "src/features/system-settings/general/system-behavior-section.tsx",
  contentIndex: "src/features/system-settings/content/index.tsx",
  operationsIndex: "src/features/system-settings/operations/index.tsx",
  operationsRegistry:
    "src/features/system-settings/operations/section-registry.tsx",
  staleRouteConfig: "src/app/(app)/system-settings/_lib/config.ts",
  staleSectionContent:
    "src/app/(app)/system-settings/_lib/section-content.tsx",
  compatibilityLayout: "src/components/system-settings-layout.tsx",
  routeSmoke: "scripts/system-settings-smoke.spec.js",
  runtimeSmoke: "scripts/system-settings-runtime-smoke.spec.js",
};

const invalidSectionCanonicalizationCases = [
  {
    from: "/system-settings/auth/not-real",
    to: "/system-settings/auth/basic-auth",
    heading: "Basic Authentication",
  },
  {
    from: "/system-settings/billing/not-real",
    to: "/system-settings/billing/quota",
    heading: "Quota Settings",
  },
  {
    from: "/system-settings/content/not-real",
    to: "/system-settings/content/dashboard",
    heading: "Data Dashboard",
  },
  {
    from: "/system-settings/models/not-real",
    to: "/system-settings/models/global",
    heading: "Global Model Configuration",
  },
  {
    from: "/system-settings/operations/not-real",
    to: "/system-settings/operations/behavior",
    heading: "System Behavior",
  },
  {
    from: "/system-settings/security/not-real",
    to: "/system-settings/security/rate-limit",
    heading: "Rate Limiting",
  },
  {
    from: "/system-settings/site/not-real",
    to: "/system-settings/site/system-info",
    heading: "System Information",
  },
];

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

function readOptionalSource(relativePath) {
  const filePath = path.join(nextRoot, relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function walkFiles(dir) {
  const output = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return output;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walkFiles(fullPath));
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) output.push(fullPath);
  }
  return output;
}

function hasStaleSystemSettingsLibReference() {
  const srcRoot = path.join(nextRoot, "src");
  return walkFiles(srcRoot).some((filePath) => {
    const text = fs.readFileSync(filePath, "utf8");
    return /system-settings\/_lib\/(?:config|section-content)|_lib\/(?:config|section-content)/.test(
      text,
    );
  });
}

export function auditSystemSettings() {
  const api = readSource(files.api);
  const behaviorSection = readSource(files.behaviorSection);
  const contentIndex = readSource(files.contentIndex);
  const operationsIndex = readSource(files.operationsIndex);
  const operationsRegistry = readSource(files.operationsRegistry);
  const staleRouteConfig = readOptionalSource(files.staleRouteConfig);
  const staleSectionContent = readOptionalSource(files.staleSectionContent);
  const compatibilityLayout = readSource(files.compatibilityLayout);
  const hasStaleReference = hasStaleSystemSettingsLibReference();
  const routeSmoke = readSource(files.routeSmoke);
  const runtimeSmoke = readSource(files.runtimeSmoke);

  const checks = [
    {
      name: "content-dashboard-exposes-classic-legacy-migration",
      ok:
        /migrateConsoleSetting/.test(api) &&
        /\/api\/option\/migrate_console_setting/.test(api) &&
        /legacyKeys\s*=\s*\[[\s\S]*ApiInfo[\s\S]*Announcements[\s\S]*FAQ[\s\S]*UptimeKumaUrl[\s\S]*UptimeKumaSlug/.test(
          contentIndex,
        ) &&
        /Legacy dashboard settings detected/.test(contentIndex) &&
        /Migrate settings/.test(contentIndex),
      message:
        "Console Content should detect classic dashboard legacy option keys and offer the backend migrate_console_setting action.",
    },
    {
      name: "content-dashboard-legacy-migration-runtime-smoke-covered",
      ok:
        /migrates legacy dashboard console settings through backend endpoint/.test(
          runtimeSmoke,
        ) &&
        /\/api\/option\/migrate_console_setting/.test(runtimeSmoke) &&
        /Legacy dashboard settings detected/.test(runtimeSmoke) &&
        /Legacy settings migrated successfully/.test(runtimeSmoke),
      message:
        "System settings runtime smoke should prove the legacy dashboard migration dialog calls POST /api/option/migrate_console_setting and refreshes options.",
    },
    {
      name: "operation-behavior-includes-classic-user-token-limit",
      ok:
        /token_setting:\s*z\.object/.test(behaviorSection) &&
        /max_user_tokens:\s*z\.coerce\.number\(\)\.int\(\)\.min\(1\)/.test(
          behaviorSection,
        ) &&
        /name=['"]token_setting\.max_user_tokens['"]/.test(behaviorSection),
      message:
        "Operations > System Behavior should expose classic token_setting.max_user_tokens using a nested React Hook Form path.",
    },
    {
      name: "operation-behavior-flattens-user-token-limit-option-key",
      ok:
        /'token_setting\.max_user_tokens':\s*values\.token_setting\.max_user_tokens/.test(
          behaviorSection,
        ) &&
        /updateOption\.mutateAsync\(\{\s*key,\s*value\s*\}\)/.test(
          behaviorSection,
        ),
      message:
        "System Behavior submit must flatten the nested field back to the backend option key token_setting.max_user_tokens.",
    },
    {
      name: "operation-defaults-include-user-token-limit",
      ok:
        /'token_setting\.max_user_tokens':\s*1000/.test(operationsIndex) &&
        /settings\['token_setting\.max_user_tokens'\]\s*\?\?\s*1000/.test(
          operationsRegistry,
        ),
      message:
        "Operations settings defaults and registry should preserve the classic default of 1000 maximum tokens per user.",
    },
    {
      name: "operation-token-limit-runtime-smoke-covered",
      ok:
        /Maximum Tokens per User/.test(runtimeSmoke) &&
        /token_setting\.max_user_tokens/.test(runtimeSmoke) &&
        /value:\s*1200/.test(runtimeSmoke),
      message:
        "System settings runtime smoke should prove the maximum-token-per-user field saves the expected /api/option/ payload.",
    },
    {
      name: "billing-checkin-runtime-smoke-covered",
      ok:
        /saves daily check-in reward settings through runtime option APIs/.test(
          runtimeSmoke,
        ) &&
        /checkin_setting\.enabled/.test(runtimeSmoke) &&
        /checkin_setting\.min_quota/.test(runtimeSmoke) &&
        /checkin_setting\.max_quota/.test(runtimeSmoke),
      message:
        "System settings runtime smoke should prove admin check-in reward settings save the backend checkin_setting option keys.",
    },
    {
      name: "split-route-invalid-section-route-smoke-covered",
      ok: invalidSectionCanonicalizationCases.every(
        ({ from, to, heading }) =>
          routeSmoke.includes(JSON.stringify(from)) &&
          routeSmoke.includes(JSON.stringify(to)) &&
          routeSmoke.includes(JSON.stringify(heading)),
      ),
      message:
        "System settings route smoke should cover invalid-section canonicalization for every split-route category.",
    },
    {
      name: "stale-parallel-route-config-removed",
      ok:
        !/export const CATEGORIES/.test(staleRouteConfig) &&
        !/export function findSection/.test(staleRouteConfig) &&
        !/branding|header-nav|payment-gateway|check-in|announcement|chat-presets|deployment|smtp|worker-proxy|log-maintenance/.test(
          staleRouteConfig,
        ) &&
        !/findSection/.test(staleSectionContent) &&
        !/SectionContent/.test(staleSectionContent) &&
        !/SubsectionTabs/.test(staleSectionContent) &&
        !/_lib\/config|_lib\/section-content/.test(compatibilityLayout) &&
        !hasStaleReference,
      message:
        "Inactive system-settings _lib files must not keep a stale parallel CATEGORIES/findSection route model or old section ids.",
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
  const report = auditSystemSettings();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
