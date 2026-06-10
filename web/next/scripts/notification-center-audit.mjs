import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

export function auditNotificationCenter() {
  const notificationText = readSource("src/components/notification-button.tsx");
  const appHeaderText = readSource("src/components/layout/app-header.tsx");
  const publicHeaderText = readSource("src/components/layout/public-header.tsx");
  const dashboardSmokeText = readSource("scripts/dashboard-smoke.spec.js");

  const checks = [
    {
      name: "notification-center-mounted-in-app-header",
      ok:
        /import\s+\{\s*NotificationButton\s*\}/.test(appHeaderText) &&
        /<NotificationButton\b/.test(appHeaderText),
      message:
        "Authenticated app header should expose the global notification center like web/default.",
    },
    {
      name: "notification-center-mounted-in-public-header",
      ok:
        /import\s+\{\s*NotificationButton\s*\}/.test(publicHeaderText) &&
        /<NotificationButton\b/.test(publicHeaderText),
      message:
        "Public header should expose the global notification center like web/default.",
    },
    {
      name: "notification-center-fetches-notice-and-status-announcements",
      ok:
        /getNotice/.test(notificationText) &&
        /useStatus/.test(notificationText) &&
        /announcements_enabled/.test(notificationText) &&
        /status\?\.announcements/.test(notificationText),
      message:
        "Notification center should merge /api/notice with /api/status announcements.",
    },
    {
      name: "notification-center-renders-notice-and-timeline-tabs",
      ok:
        /TabsTrigger\s+value="notice"/.test(notificationText) &&
        /TabsTrigger\s+value="timeline"/.test(notificationText) &&
        /System Announcements/.test(notificationText),
      message:
        "Notification center should provide Notice and Timeline tabs.",
    },
    {
      name: "notification-center-runtime-smoke-covered",
      ok:
        /shows the global notification center with notice and timeline entries/.test(
          dashboardSmokeText,
        ) &&
        /\/api\/notice/.test(dashboardSmokeText) &&
        /Smoke global notice/.test(dashboardSmokeText) &&
        /Smoke dashboard announcement/.test(dashboardSmokeText),
      message:
        "Dashboard smoke should prove the header notification center renders notice and timeline content.",
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
  const report = auditNotificationCenter();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
