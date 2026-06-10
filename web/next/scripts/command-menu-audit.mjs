import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

const localeCodes = ["en", "zh", "fr", "ja", "ru", "vi"];
const commandMenuLocaleKeys = [
  "Open command menu",
  "Navigate",
  "Account",
  "Tools",
  "Type a command or search...",
];

function hasCommandMenuLocaleKeys() {
  return localeCodes.every((locale) => {
    const data = JSON.parse(readSource(`src/i18n/locales/${locale}.json`));
    return commandMenuLocaleKeys.every(
      (key) =>
        typeof data[key] === "string" &&
        data[key].trim() !== "" &&
        !Object.prototype.hasOwnProperty.call(data.translation ?? {}, key),
    );
  });
}

export function auditCommandMenu() {
  const providersText = readSource("src/app/providers.tsx");
  const appHeaderText = readSource("src/components/layout/app-header.tsx");
  const commandMenuText = readSource("src/components/command-menu.tsx");
  const sidebarText = readSource("src/components/layout/sidebar-nav.tsx");
  const searchText = readSource("src/components/search.tsx");
  const smokeText = readSource("scripts/command-menu-smoke.spec.js");
  const requiredSidebarRoutes = [
    "/playground",
    "/dashboard",
    "/keys",
    "/tickets",
    "/usage-logs",
    "/usage-logs/task",
    "/wallet",
    "/my-subscriptions",
    "/invoices",
    "/profile",
    "/channels",
    "/models",
    "/models/deployments",
    "/users",
    "/redemption-codes",
    "/subscriptions",
    "/tickets?legacy_admin=1",
    "/admin-packages",
    "/admin-tokens",
    "/health",
    "/performance-metrics",
    "/system-settings",
  ];

  const checks = [
    {
      name: "command-menu-mounted-in-next-providers",
      ok:
        /CommandMenu/.test(providersText) &&
        /<CommandMenu\s*\/>/.test(providersText),
      message:
        "Next providers must mount CommandMenu so Cmd/Ctrl+K can open the palette from authenticated pages.",
    },
    {
      name: "authenticated-header-exposes-search-trigger",
      ok:
        /components\/search/.test(appHeaderText) &&
        /<Search/.test(appHeaderText),
      message:
        "Authenticated AppHeader must expose the Search trigger that opens the command menu.",
    },
    {
      name: "command-menu-copy-is-localized",
      ok:
        /t\(["']Open command menu["']\)/.test(searchText) &&
        /t\(["']Type a command or search\.\.\.["']\)/.test(commandMenuText) &&
        /t\(["']common\.noResults["']\)/.test(commandMenuText) &&
        hasCommandMenuLocaleKeys(),
      message:
        "Command menu prompt, trigger label, groups, and empty state must use i18n keys present at the top level of every Next locale.",
    },
    {
      name: "command-menu-runtime-smoke-covered",
      ok:
        /Open command menu/.test(smokeText) &&
        /Type a command or search/.test(smokeText) &&
        /API Keys/.test(smokeText) &&
        /\/keys/.test(smokeText),
      message:
        "Command menu smoke must cover search trigger visibility, keyboard opening, and navigation.",
    },
    {
      name: "command-menu-uses-sidebar-nav-source",
      ok:
        /useNavItems/.test(commandMenuText) &&
        /from\s+["']@\/components\/layout\/sidebar-nav["']/.test(
          commandMenuText,
        ) &&
        /!item\.chatPreset/.test(commandMenuText) &&
        /router\.push\(path\)/.test(commandMenuText),
      message:
        "Command menu must derive default navigation commands from the sidebar item source so route coverage stays in parity with sidebar visibility/config.",
    },
    {
      name: "command-menu-sidebar-route-coverage",
      ok: requiredSidebarRoutes.every((route) =>
        sidebarText.includes(`href: "${route}"`),
      ),
      message:
        "Sidebar source used by the command menu must include all expected Next navigation routes.",
      missingRoutes: requiredSidebarRoutes.filter(
        (route) => !sidebarText.includes(`href: "${route}"`),
      ),
    },
  ];

  return {
    checkCount: checks.length,
    failureCount: checks.filter((check) => !check.ok).length,
    checks,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectInvocation = invokedPath === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  const report = auditCommandMenu();
  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
