import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

const files = {
  commandMenu: path.join(nextRoot, "src/components/command-menu.tsx"),
  channelTestDialog: path.join(
    nextRoot,
    "src/features/channels/components/dialogs/channel-test-dialog.tsx",
  ),
  playgroundMessageError: path.join(
    nextRoot,
    "src/features/playground/components/message-error.tsx",
  ),
};

function readFile(file) {
  return fs.readFileSync(file, "utf8");
}

function commandItemUsesPath(text, id, target) {
  const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `id:\\s*["']${id}["'][\\s\\S]*?onSelect:\\s*\\(\\)\\s*=>\\s*go\\(["']${escapedTarget}["']\\)`,
  ).test(text);
}

export function auditLegacyNavigation() {
  const commandMenu = readFile(files.commandMenu);
  const channelTestDialog = readFile(files.channelTestDialog);
  const playgroundMessageError = readFile(files.playgroundMessageError);

  const modelPricingRoute = "/system-settings/billing/model-pricing";
  const checks = [
    {
      name: "command-menu-dashboard-uses-next-route",
      ok: commandItemUsesPath(commandMenu, "dashboard", "/dashboard"),
      message: "Command menu dashboard item should navigate to /dashboard.",
    },
    {
      name: "command-menu-keys-uses-next-route",
      ok: commandItemUsesPath(commandMenu, "keys", "/keys"),
      message: "Command menu API keys item should navigate to /keys.",
    },
    {
      name: "command-menu-channels-uses-next-route",
      ok: commandItemUsesPath(commandMenu, "channels", "/channels"),
      message: "Command menu channels item should navigate to /channels.",
    },
    {
      name: "command-menu-users-uses-next-route",
      ok: commandItemUsesPath(commandMenu, "users", "/users"),
      message:
        "Command menu users item should navigate to /users instead of the unredirected /console/users path.",
    },
    {
      name: "command-menu-playground-uses-next-route",
      ok: commandItemUsesPath(commandMenu, "playground", "/playground"),
      message: "Command menu playground item should navigate to /playground.",
    },
    {
      name: "command-menu-avoids-console-navigation",
      ok: !/go\(["']\/console(?:\/[^"']*)?["']\)/.test(commandMenu),
      message:
        "Command menu items should use native Next routes rather than legacy /console redirects.",
    },
    {
      name: "channel-test-model-price-cta-uses-next-settings-route",
      ok:
        channelTestDialog.includes(modelPricingRoute) &&
        !channelTestDialog.includes("/console/setting?tab=ratio"),
      message:
        "Channel model-price error CTA should open the Next model-pricing settings route.",
    },
    {
      name: "playground-model-price-cta-uses-next-settings-route",
      ok:
        playgroundMessageError.includes(modelPricingRoute) &&
        !playgroundMessageError.includes("/console/setting?tab=ratio"),
      message:
        "Playground model-price error CTA should open the Next model-pricing settings route.",
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
  const report = auditLegacyNavigation();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
