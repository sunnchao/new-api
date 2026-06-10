import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

export function auditAdminRouteAccess() {
  const authGuardText = readSource("src/components/auth-guard.tsx");
  const smokeText = readSource("scripts/admin-route-access-smoke.spec.js");

  const checks = [
    {
      name: "dashboard-users-route-is-admin-only",
      ok:
        /ADMIN_ROUTE_PREFIXES/.test(authGuardText) &&
        /["']\/dashboard\/users["']/.test(authGuardText),
      message:
        "AuthGuard must treat /dashboard/users as admin-only so common users cannot mount user analytics from a direct URL.",
    },
    {
      name: "vibecoding-admin-route-is-admin-only",
      ok:
        /ADMIN_ROUTE_PREFIXES/.test(authGuardText) &&
        /["']\/vibecoding\/admin["']/.test(authGuardText),
      message:
        "AuthGuard must treat /vibecoding/admin as admin-only so common users cannot mount VibeCoding subscription management from a direct URL.",
    },
    {
      name: "dashboard-users-route-smoke-covered",
      ok:
        /adminOnlyRoutes[\s\S]*["']\/dashboard\/users["']/.test(smokeText) &&
        /forbiddenAdminApiPrefixes[\s\S]*["']\/api\/data\/users["']/.test(
          smokeText,
        ),
      message:
        "Admin route access smoke must cover /dashboard/users and forbid /api/data/users for common users.",
    },
    {
      name: "vibecoding-admin-route-smoke-covered",
      ok:
        /adminOnlyRoutes[\s\S]*["']\/vibecoding\/admin["']/.test(smokeText) &&
        /forbiddenAdminApiPrefixes[\s\S]*["']\/api\/subscription\/admin["']/.test(
          smokeText,
        ),
      message:
        "Admin route access smoke must cover /vibecoding/admin and forbid /api/subscription/admin for common users.",
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
  const report = auditAdminRouteAccess();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
