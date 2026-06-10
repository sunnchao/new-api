import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(scriptDir, "../../..");
const appRoot = path.join(nextRoot, "src/app");
const configPath = path.join(nextRoot, "next.config.ts");
const classicAppPath = path.join(repoRoot, "web/classic/src/App.jsx");
const classicSettingPath = path.join(repoRoot, "web/classic/src/pages/Setting/index.jsx");
const defaultRoutesRoot = path.join(repoRoot, "web/default/src/routes");
const consoleSettingPath = path.join(appRoot, "console/setting/page.tsx");
const consoleTopupPath = path.join(appRoot, "console/topup/page.tsx");
const walletPagePath = path.join(appRoot, "(app)/wallet/page.tsx");
const profileSecuritySmokePath = path.join(
  nextRoot,
  "scripts/profile-security-smoke.spec.js",
);
const walletHistorySmokePath = path.join(
  nextRoot,
  "scripts/wallet-history-smoke.spec.js",
);
const legacyRouteRedirectSmokePath = path.join(
  nextRoot,
  "scripts/legacy-route-redirect-smoke.spec.js",
);
const vibeCodingConstantsPath = path.join(
  nextRoot,
  "src/features/vibecoding/constants.ts",
);

export const requiredLegacyRoutes = [
  { source: "/forbidden", destination: "/403" },
  { source: "/login", destination: "/sign-in" },
  { source: "/register", destination: "/sign-up" },
  { source: "/console", destination: "/dashboard" },
  { source: "/console/models", destination: "/models" },
  { source: "/console/deployment", destination: "/models/deployments" },
  { source: "/console/health", destination: "/health" },
  { source: "/console/subscription", destination: "/subscriptions" },
  { source: "/console/subscription-overview", destination: "/subscriptions?tab=all-subscriptions" },
  { source: "/console/channel", destination: "/channels" },
  { source: "/console/token", destination: "/keys" },
  { source: "/console/admin/token", destination: "/admin-tokens" },
  { source: "/console/playground", destination: "/playground" },
  { source: "/console/redemption", destination: "/redemption-codes" },
  { source: "/console/tickets", destination: "/tickets?legacy_admin=1" },
  { source: "/console/ticket/:id", destination: "/tickets/:id?legacy_admin=1" },
  { source: "/console/user", destination: "/users" },
  { source: "/console/setting", destination: "/system-settings" },
  { source: "/console/personal", destination: "/profile" },
  { source: "/console/topup", destination: "/wallet" },
  { source: "/console/subscriptions", destination: "/my-subscriptions" },
  { source: "/console/packages", destination: "/admin-packages" },
  { source: "/console/log", destination: "/usage-logs" },
  { source: "/console/midjourney", destination: "/usage-logs/drawing" },
  { source: "/console/task", destination: "/usage-logs/task" },
  { source: "/console/chat", destination: "/chat/new" },
  { source: "/console/chat/:id", destination: "/chat/:id" },
  { source: "/ticket/:id", destination: "/tickets/:id" },
  { source: "/vibecoding/claude/admin", destination: "/vibecoding/admin" },
  { source: "/vibecoding/claude/subscription", destination: "/my-subscriptions" },
  { source: "/vibecoding/claude", destination: "/vibecoding/claude" },
  { source: "/vibecoding/codex", destination: "/vibecoding/codex" },
  { source: "/vibecoding/gemini", destination: "/vibecoding/gemini" },
  { source: "/openclaw", destination: "/vibecoding/openclaw" },
];

function walk(dir) {
  const output = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return output;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(full));
    else output.push(full);
  }
  return output;
}

function appRoutes() {
  return new Set(
    walk(appRoot)
      .filter((file) => /\/page\.(t|j)sx?$/.test(file))
      .map((file) => {
        let route = file
          .slice(appRoot.length)
          .replace(/\/page\.(t|j)sx?$/, "")
          .replace(/\/\([^)]*\)/g, "");
        route = route.replace(/\[([^\]]+)\]/g, ":$1");
        return route || "/";
      }),
  );
}

function normalizeRoute(route) {
  let normalized = route
    .replace(/\/\([^)]*\)/g, "")
    .replace(/\/_authenticated/g, "")
    .replace(/\/index$/, "")
    .replace(/\$([A-Za-z0-9_]+)/g, ":$1");

  normalized = normalized.replace(/\/$/, "") || "/";
  normalized = normalized.replace(/:chatId\?$/, ":chatId");
  normalized = normalized.replace(/:id\?$/, ":id");
  return normalized;
}

function sourceRoutesFromClassic() {
  let text = "";
  try {
    text = fs.readFileSync(classicAppPath, "utf8");
  } catch {
    return [];
  }

  return [...text.matchAll(/<Route\s+(?:[^>]*\s)?path=['"]([^'"]+)['"]/g)]
    .map((match) => normalizeRoute(match[1]))
    .filter((route) => route !== "*");
}

function sourceRoutesFromDefault() {
  return walk(defaultRoutesRoot)
    .filter((file) => /\.(t|j)sx?$/.test(file))
    .flatMap((file) => {
      let text = "";
      try {
        text = fs.readFileSync(file, "utf8");
      } catch {
        return [];
      }
      return [...text.matchAll(/createFileRoute\(['"]([^'"]+)['"]\)/g)].map(
        (match) => normalizeRoute(match[1]),
      );
    })
    .filter(
      (route) =>
        route &&
        !["/(auth)", "/_authenticated", "/_authenticated/system-settings"].includes(
          route,
        ),
    );
}

function classicSettingsTabs() {
  let text = "";
  try {
    text = fs.readFileSync(classicSettingPath, "utf8");
  } catch {
    return [];
  }

  return [...text.matchAll(/itemKey:\s*["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
}

function nextClassicSettingsTabRoutes() {
  let text = "";
  try {
    text = fs.readFileSync(consoleSettingPath, "utf8");
  } catch {
    return new Map();
  }

  const routesMatch = text.match(
    /CLASSIC_SETTINGS_TAB_ROUTES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/,
  );
  if (!routesMatch) return new Map();

  const routes = new Map();
  const entryRegex = /^\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_-]+)):\s*["']([^"']+)["']/gm;
  let match;
  while ((match = entryRegex.exec(routesMatch[1]))) {
    routes.set(match[1] ?? match[2] ?? match[3], match[4]);
  }
  return routes;
}

function configuredRedirects() {
  let text = "";
  try {
    text = fs.readFileSync(configPath, "utf8");
  } catch {
    return new Map();
  }

  const redirects = new Map();
  const entryRegex =
    /source:\s*["']([^"']+)["'][\s\S]*?destination:\s*["']([^"']+)["']/g;
  let match;
  while ((match = entryRegex.exec(text))) {
    redirects.set(match[1], match[2]);
  }
  return redirects;
}

function vibeCodingSupportedSlugs() {
  let text = "";
  try {
    text = fs.readFileSync(vibeCodingConstantsPath, "utf8");
  } catch {
    return new Set();
  }

  const aliasesMatch = text.match(
    /TOOL_ID_ALIASES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/,
  );
  const aliases = aliasesMatch
    ? [...aliasesMatch[1].matchAll(/^\s*([A-Za-z0-9_-]+):\s*["'][^"']+["']/gm)]
        .map((match) => match[1])
    : [];
  const ids = [...text.matchAll(/id:\s*["']([^"']+)["']/g)].map(
    (match) => match[1],
  );

  return new Set([...aliases, ...ids]);
}

function consoleTopupRedirectOk() {
  let text = "";
  try {
    text = fs.readFileSync(consoleTopupPath, "utf8");
  } catch {
    return false;
  }

  const objectEntriesIndex = text.search(/Object\.entries\(search\)/);
  const showHistorySetIndex = text.search(
    /params\.set\(\s*["']show_history["']\s*,\s*["']true["']\s*\)/,
  );

  return (
    /redirect\(\s*`\/wallet\?\$\{params\.toString\(\)\}`\s*\)/.test(text) &&
    objectEntriesIndex >= 0 &&
    showHistorySetIndex > objectEntriesIndex
  );
}

function walletShowHistoryOk() {
  let text = "";
  try {
    text = fs.readFileSync(walletPagePath, "utf8");
  } catch {
    return false;
  }

  return (
    /searchParams/.test(text) &&
    /show_history/.test(text) &&
    /initialShowHistory/.test(text) &&
    !/export\s+default\s+Wallet\s*;/.test(text)
  );
}

function profileLegacyRuntimeSmokeOk() {
  let text = "";
  try {
    text = fs.readFileSync(profileSecuritySmokePath, "utf8");
  } catch {
    return false;
  }

  return (
    /page\.goto\(\s*["']\/console\/personal\b/.test(text) &&
    /toHaveURL\([^)]*\/profile/.test(text) &&
    /legacy/i.test(text)
  );
}

function consoleTopupRuntimeSmokeOk() {
  let text = "";
  try {
    text = fs.readFileSync(walletHistorySmokePath, "utf8");
  } catch {
    return false;
  }

  return (
    /page\.goto\(\s*["']\/console\/topup\b/.test(text) &&
    /show_history=false/.test(text) &&
    /Billing History/.test(text) &&
    /\/api\/user\/topup\/self/.test(text)
  );
}

function staticRedirectRuntimeMatrixSmokeOk() {
  let text = "";
  try {
    text = fs.readFileSync(legacyRouteRedirectSmokePath, "utf8");
  } catch {
    return false;
  }

  const redirectMap = configuredRedirects();
  const expectedCases = [...redirectMap.entries()].map(([source, destination]) => ({
    source: materializeRoutePattern(source),
    destination: materializeRoutePattern(destination),
  }));
  const smokeCases = [...text.matchAll(
    /\{\s*source:\s*["']([^"']+)["']\s*,\s*destination:\s*["']([^"']+)["']\s*\}/g,
  )].map((match) => ({
    source: match[1],
    destination: match[2],
  }));
  const hardcodedCoverage =
    expectedCases.length > 0 &&
    expectedCases.every((expected) =>
      smokeCases.some(
        (actual) =>
          actual.source === expected.source &&
          actual.destination === expected.destination,
      ),
    );
  const dynamicCoverage =
    /next\.config\.ts/.test(text) &&
    /configuredRedirectCases/.test(text) &&
    /entryRegex/.test(text) &&
    /materializeRoutePattern/.test(text);

  return (
    expectedCases.length > 0 &&
    /maxRedirects:\s*0/.test(text) &&
    /headers\(\)\[['"]location['"]\]/.test(text) &&
    /redirectQueryCases/.test(text) &&
    /searchParams\.get/.test(text) &&
    text.includes("/console/subscription-overview?tab=plans&plan=7007") &&
    text.includes("/console/tickets?status=1&keyword=billing") &&
    text.includes("/console/ticket/7201?from=list") &&
    (hardcodedCoverage || dynamicCoverage)
  );
}

function materializeRoutePattern(route) {
  const replacements = {
    id: "7201",
    chatId: "chat-smoke",
  };
  return route.replace(/:([A-Za-z0-9_]+)/g, (_match, name) => {
    return replacements[name] ?? `${name}-smoke`;
  });
}

function classicSettingsTabMappingOk() {
  const classicTabs = [...new Set(classicSettingsTabs())].sort();
  const nextRoutes = nextClassicSettingsTabRoutes();
  const nextTabs = [...nextRoutes.keys()].sort();

  return (
    classicTabs.length > 0 &&
    classicTabs.length === nextTabs.length &&
    classicTabs.every((tab, index) => tab === nextTabs[index]) &&
    nextRoutes.get("system") === "/system-settings/auth/basic-auth" &&
    nextRoutes.get("other") === "/system-settings/site/system-info"
  );
}

function classicSettingsFallbackSmokeOk() {
  let text = "";
  try {
    text = fs.readFileSync(path.join(nextRoot, "scripts/system-settings-smoke.spec.js"), "utf8");
  } catch {
    return false;
  }

  return (
    text.includes('"/console/setting"') &&
    text.includes('"/console/setting?tab=not-real"') &&
    text.includes('"/system-settings/operations/behavior"') &&
    text.includes('"System Behavior"')
  );
}

function routePatternMatches(pattern, route) {
  const patternParts = pattern.split("/").filter(Boolean);
  const routeParts = route.split("/").filter(Boolean);
  if (patternParts.length !== routeParts.length) return false;
  return patternParts.every((part, index) => {
    if (part.startsWith(":")) return routeParts[index].length > 0;
    return part === routeParts[index];
  });
}

export function auditLegacyRoutes() {
  const routeSet = appRoutes();
  const redirectMap = configuredRedirects();
  const supportedVibeCodingSlugs = vibeCodingSupportedSlugs();
  const missing = [];
  const mismatched = [];
  const alreadyRouted = [];
  const discoveredSourceRoutes = [
    ...new Set([...sourceRoutesFromClassic(), ...sourceRoutesFromDefault()]),
  ].sort();
  const discoveredMissing = [];

  if (!walletShowHistoryOk()) {
    missing.push({
      source: "/wallet",
      destination: "/wallet",
      reason:
        "The /wallet page must pass show_history=true to Wallet.initialShowHistory for legacy /console/topup parity.",
    });
  }

  if (!profileLegacyRuntimeSmokeOk()) {
    missing.push({
      source: "/console/personal",
      destination: "/profile",
      reason:
        "Legacy /console/personal routing must have a production browser smoke proving it redirects to /profile and loads the profile surface.",
    });
  }

  if (!consoleTopupRuntimeSmokeOk()) {
    missing.push({
      source: "/console/topup",
      destination: "/wallet",
      reason:
        "Legacy /console/topup routing must have a production browser smoke proving it forces show_history=true and opens billing history from the wallet surface.",
    });
  }

  if (!staticRedirectRuntimeMatrixSmokeOk()) {
    missing.push({
      source: "static legacy redirects",
      destination: "next.config.ts redirects",
      reason:
        "Static legacy redirects need a production HTTP smoke matrix proving representative Next temporary redirects still emit the expected Location headers.",
    });
  }

  if (!classicSettingsTabMappingOk()) {
    missing.push({
      source: "/console/setting?tab=<classic>",
      destination: "modern system-settings sections",
      reason:
        "Classic settings bookmark tabs must keep the same key set as web/classic and map system/other to semantically matching modern sections.",
    });
  }

  if (!classicSettingsFallbackSmokeOk()) {
    missing.push({
      source: "/console/setting",
      destination: "/system-settings/operations/behavior",
      reason:
        "Classic settings fallback routes must have runtime smoke coverage for missing or unknown tab values.",
    });
  }

  for (const route of requiredLegacyRoutes) {
    if (
      [...routeSet].some((pattern) => routePatternMatches(pattern, route.source))
    ) {
      if (route.source === "/console/topup" && !consoleTopupRedirectOk()) {
        missing.push({
          ...route,
          reason:
            "Dynamic /console/topup route exists, but it must redirect to /wallet with show_history=true and preserve existing query params.",
        });
        continue;
      }
      const vibeCodingTool = route.source.match(/^\/vibecoding\/([^/]+)$/)?.[1];
      if (vibeCodingTool && !supportedVibeCodingSlugs.has(vibeCodingTool)) {
        missing.push({
          ...route,
          reason: `Dynamic vibecoding route exists, but slug "${vibeCodingTool}" is not supported by constants.ts.`,
        });
        continue;
      }
      alreadyRouted.push(route);
      continue;
    }
    const destination = redirectMap.get(route.source);
    if (!destination) {
      missing.push(route);
    } else if (destination !== route.destination) {
      mismatched.push({ ...route, actualDestination: destination });
    }
  }

  for (const source of discoveredSourceRoutes) {
    const hasRoute = [...routeSet].some((pattern) =>
      routePatternMatches(pattern, source),
    );
    if (!hasRoute && !redirectMap.has(source)) {
      discoveredMissing.push(source);
    }
  }

  return {
    requiredLegacyRouteCount: requiredLegacyRoutes.length,
    alreadyRoutedCount: alreadyRouted.length,
    configuredRedirectCount: redirectMap.size,
    missingRedirectCount: missing.length,
    mismatchedRedirectCount: mismatched.length,
    discoveredSourceRouteCount: discoveredSourceRoutes.length,
    discoveredMissingRouteCount: discoveredMissing.length,
    missing,
    mismatched,
    discoveredMissing,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectInvocation = invokedPath === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  const report = auditLegacyRoutes();

  console.log(JSON.stringify(report, null, 2));

  if (
    process.argv.includes("--fail-on-gap") &&
    (report.missing.length > 0 ||
      report.mismatched.length > 0 ||
      report.discoveredMissing.length > 0)
  ) {
    process.exitCode = 1;
  }
}
