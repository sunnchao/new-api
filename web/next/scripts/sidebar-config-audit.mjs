import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const sidebarPath = path.join(nextRoot, "src/components/layout/sidebar-nav.tsx");
const hookPath = path.join(nextRoot, "src/hooks/use-sidebar-config.ts");
const maintenanceConfigPath = path.join(
  nextRoot,
  "src/features/system-settings/maintenance/config.ts",
);
const maintenanceSectionPath = path.join(
  nextRoot,
  "src/features/system-settings/maintenance/sidebar-modules-section.tsx",
);

const requiredDefaultModules = {
  personal: ["ticket", "subscription", "subscriptions"],
  admin: [
    "deployment",
    "admin_ticket",
    "packages",
    "subscription-overview",
    "health",
    "performance",
  ],
};

const requiredUrlMappings = [
  { route: "/tickets", section: "personal", module: "ticket" },
  { route: "/admin-packages", section: "admin", module: "packages" },
  { route: "/health", section: "admin", module: "health" },
  {
    route: "/performance-metrics",
    section: "admin",
    module: "performance",
  },
  { route: "/models/deployments", section: "admin", module: "deployment" },
  {
    route: "/tickets?legacy_admin=1",
    section: "admin",
    module: "admin_ticket",
  },
  {
    route: "/subscriptions?tab=all-subscriptions",
    section: "admin",
    module: "subscription-overview",
  },
];

function hasSectionModule(text, section, module) {
  const sectionPattern = new RegExp(`${section}:\\s*{([\\s\\S]*?)\\n\\s*},`);
  const match = text.match(sectionPattern);
  if (!match) return false;
  return new RegExp(`['"]?${module}['"]?:\\s*true`).test(match[1]);
}

function hasUrlMapping(text, { route, section, module }) {
  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedModule = module.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `['"]${escapedRoute}['"]:\\s*{\\s*section:\\s*['"]${section}['"],\\s*module:\\s*['"]${escapedModule}['"],?\\s*}`,
    "s",
  ).test(text);
}

export function auditSidebarConfig() {
  const text = fs.readFileSync(sidebarPath, "utf8");
  const hookText = fs.readFileSync(hookPath, "utf8");
  const maintenanceConfigText = fs.readFileSync(maintenanceConfigPath, "utf8");
  const maintenanceSectionText = fs.readFileSync(maintenanceSectionPath, "utf8");

  const defaultModuleChecks = Object.entries(requiredDefaultModules).flatMap(
    ([section, modules]) =>
      modules.map((module) => ({
        section,
        module,
        hook: hasSectionModule(hookText, section, module),
        maintenance: hasSectionModule(maintenanceConfigText, section, module),
        label: new RegExp(`['"]?${module}['"]?\\s*:`).test(
          maintenanceSectionText,
        ),
      })),
  );

  const urlMappingChecks = requiredUrlMappings.map((mapping) => ({
    ...mapping,
    ok: hasUrlMapping(hookText, mapping),
  }));

  const checks = [
    {
      name: "imports-use-sidebar-config",
      ok: /from\s+["']@\/hooks\/use-sidebar-config["']/.test(text),
      message: "SidebarNav must import useSidebarConfig.",
    },
    {
      name: "calls-use-sidebar-config",
      ok: /useSidebarConfig\s*\(/.test(text),
      message: "SidebarNav must apply useSidebarConfig to visible nav groups.",
    },
    {
      name: "task-logs-root-entry",
      ok:
        /href:\s*["']\/usage-logs\/task["']/.test(text) &&
        /configUrls:\s*\[[^\]]*["']\/usage-logs\/drawing["'][^\]]*["']\/usage-logs\/task["'][^\]]*\]/s.test(
          text,
        ),
      message:
        "SidebarNav must expose task/drawing logs with configUrls so SidebarModulesAdmin can control them separately from common usage logs.",
    },
    {
      name: "usage-logs-common-entry",
      ok: /href:\s*["']\/usage-logs(?:\/common)?["']/.test(text),
      message: "SidebarNav must keep a common usage logs entry.",
    },
    {
      name: "system-settings-root-only",
      ok:
        /requiredRole\?:\s*number/.test(text) &&
        /href:\s*["']\/system-settings["'][\s\S]*requiredRole:\s*ROLE\.ROOT/.test(
          text,
        ),
      message:
        "System Settings navigation must require root role, matching the route guard.",
    },
    {
      name: "classic-sidebar-module-keys-preserved",
      ok: defaultModuleChecks.every(
        (check) => check.hook && check.maintenance && check.label,
      ),
      message:
        "Next sidebar defaults and maintenance UI must preserve classic SidebarModulesAdmin keys for personal tickets, model deployments, admin tickets, packages, subscription overview, health, and performance.",
      details: defaultModuleChecks,
    },
    {
      name: "classic-sidebar-routes-configured",
      ok: urlMappingChecks.every((check) => check.ok),
      message:
        "Next sidebar URL_TO_CONFIG_MAP must cover tickets, admin packages, health, performance metrics, model deployments, admin tickets, and subscription overview.",
      details: urlMappingChecks,
    },
    {
      name: "admin-parity-sidebar-items-visible",
      ok:
        /href:\s*["']\/models\/deployments["'][\s\S]*adminOnly:\s*true/.test(
          text,
        ) &&
        /href:\s*["']\/tickets\?legacy_admin=1["'][\s\S]*adminOnly:\s*true/.test(
          text,
        ) &&
        /href:\s*["']\/admin-packages["'][\s\S]*adminOnly:\s*true/.test(
          text,
        ) &&
        /href:\s*["']\/health["'][\s\S]*adminOnly:\s*true/.test(text) &&
        /href:\s*["']\/performance-metrics["'][\s\S]*adminOnly:\s*true/.test(
          text,
        ),
      message:
        "SidebarNav must expose admin entries for model deployments, admin tickets, packages, health, and performance metrics.",
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
  const report = auditSidebarConfig();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
