import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const sidebarPath = path.join(nextRoot, "src/components/layout/sidebar-nav.tsx");

export function auditSidebarConfig() {
  const text = fs.readFileSync(sidebarPath, "utf8");

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
