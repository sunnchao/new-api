import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const channelDrawerPath = path.join(
  nextRoot,
  "src/features/channels/components/drawers/channel-mutate-drawer.tsx",
);

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function auditChannelDoubaoCodingPlan() {
  const drawerText = readSource(channelDrawerPath);

  const checks = [
    {
      name: "doubao-coding-plan-deprecated-constant-present",
      ok: /DEPRECATED_DOUBAO_CODING_PLAN_BASE_URL\s*=\s*'doubao-coding-plan'/.test(
        drawerText,
      ),
      message:
        "VolcEngine Doubao Coding Plan should use a named deprecated base-url constant.",
    },
    {
      name: "doubao-coding-plan-captures-initial-base-url",
      ok:
        /initialBaseUrlRef\s*=\s*useRef<string>\(''\)/.test(drawerText) &&
        /initialBaseUrlRef\.current\s*=\s*channelData\.data\.base_url\s*\|\|\s*''/.test(
          drawerText,
        ) &&
        /initialBaseUrlRef\.current\s*=\s*''/.test(drawerText),
      message:
        "Editing should capture the loaded channel base_url, while create mode resets it.",
    },
    {
      name: "doubao-coding-plan-keep-only-for-existing-legacy-channel",
      ok:
        /canKeepDeprecatedDoubaoCodingPlan\s*=/.test(drawerText) &&
        /initialBaseUrlRef\.current\s*===\s*DEPRECATED_DOUBAO_CODING_PLAN_BASE_URL/.test(
          drawerText,
        ),
      message:
        "Existing legacy Doubao Coding Plan channels may keep the deprecated option.",
    },
    {
      name: "doubao-coding-plan-disabled-for-new-volcengine-channels",
      ok:
        /SelectItem\s+value=\{DEPRECATED_DOUBAO_CODING_PLAN_BASE_URL\}\s+disabled=\{!canKeepDeprecatedDoubaoCodingPlan\}/.test(
          drawerText,
        ) &&
        !/<SelectItem\s+value='doubao-coding-plan'>/.test(drawerText),
      message:
        "New VolcEngine channels must not be able to select the deprecated Doubao Coding Plan option.",
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
  const report = auditChannelDoubaoCodingPlan();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
