import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

export function auditVibeCodingSubscription() {
  const apiText = readSource("src/features/vibecoding/api.ts");
  const componentText = readSource(
    "src/features/vibecoding/components/claude-code-subscription.tsx",
  );
  const nextConfigText = readSource("next.config.ts");
  const routeText = readSource(
    "src/app/(app)/vibecoding/claude/subscription/page.tsx",
  );
  const smokeText = readSource("scripts/vibecoding-subscription-smoke.spec.js");
  const runnerText = readSource("scripts/vibecoding-subscription-smoke.mjs");

  const checks = [
    {
      name: "claude-subscription-route-renders-user-component",
      ok:
        /ClaudeCodeSubscription/.test(routeText) &&
        /return\s+<ClaudeCodeSubscription\s*\/>/.test(routeText),
      message:
        "Next must expose the classic /vibecoding/claude/subscription user route by rendering ClaudeCodeSubscription inside the authenticated app tree.",
    },
    {
      name: "claude-subscription-route-is-not-shadowed-by-redirect",
      ok:
        !/source:\s*["']\/vibecoding\/claude\/subscription["'][\s\S]*?destination:\s*["']\/my-subscriptions["']/.test(
          nextConfigText,
        ),
      message:
        "Next redirects run before filesystem routes, so /vibecoding/claude/subscription must not be redirected away from its app route.",
    },
    {
      name: "claude-subscription-uses-generic-subscription-apis",
      ok:
        /getMyClaudeCodeSubscriptions[\s\S]*\/api\/subscription\/self/.test(
          apiText,
        ) &&
        /getClaudeCodePlans[\s\S]*\/api\/subscription\/plans/.test(apiText) &&
        /purchaseClaudeCodeSubscription[\s\S]*\/api\/subscription\/balance\/pay/.test(
          apiText,
        ) &&
        !/\/api\/vibecoding\/subscription/.test(apiText),
      message:
        "ClaudeCode user subscription APIs must use the shared backend subscription endpoints, not obsolete VibeCoding-specific endpoints.",
    },
    {
      name: "claude-subscription-component-loads-status-and-plans",
      ok:
        /getMyClaudeCodeSubscriptions/.test(componentText) &&
        /getClaudeCodePlans/.test(componentText) &&
        /purchaseClaudeCodeSubscription/.test(componentText) &&
        /Your Claude Code subscription is active/.test(componentText) &&
        /My Subscriptions/.test(componentText) &&
        /Available Plans/.test(componentText),
      message:
        "ClaudeCodeSubscription must load the user's subscription status, available plans, and purchase action.",
    },
    {
      name: "claude-subscription-runtime-smoke-covered",
      ok:
        /VibeCoding Claude subscription route/.test(smokeText) &&
        /\/vibecoding\/claude\/subscription/.test(smokeText) &&
        /\/api\/subscription\/self/.test(smokeText) &&
        /\/api\/subscription\/plans/.test(smokeText) &&
        /\/api\/vibecoding/.test(smokeText) &&
        /expect\(unhandled\)\.toEqual\(\[\]\)/.test(smokeText),
      message:
        "A browser smoke must prove the user route renders and calls the generic subscription APIs without unhandled requests.",
    },
    {
      name: "claude-subscription-smoke-runner-present",
      ok:
        /vibecoding-subscription-smoke\.config\.mjs/.test(runnerText) &&
        /@playwright\/test/.test(runnerText),
      message:
        "The ClaudeCode subscription smoke should have the same runnable .mjs wrapper pattern as other production smokes.",
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
  const report = auditVibeCodingSubscription();
  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
