import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const usersTablePath = path.join(
  nextRoot,
  "src/features/users/components/users-table.tsx",
);
const usersApiPath = path.join(nextRoot, "src/features/users/api.ts");
const usersSmokePath = path.join(nextRoot, "scripts/users-smoke.spec.js");

export function auditUsers() {
  const text = fs.readFileSync(usersTablePath, "utf8");
  const apiText = fs.readFileSync(usersApiPath, "utf8");
  const smokeText = fs.readFileSync(usersSmokePath, "utf8");

  const checks = [
    {
      name: "users-query-key-includes-url-column-filters",
      ok: /queryKey:\s*\[[\s\S]*userSearchFilters[\s\S]*\]/.test(text),
      message:
        "Users query key must include URL-backed status/role/group filters so filter-only URLs refetch.",
    },
    {
      name: "users-search-runs-for-column-filters",
      ok:
        /hasServerFilter/.test(text) &&
        /\?\s*await searchUsers\(\s*\{[\s\S]*userSearchFilters/.test(text),
      message:
        "Users table must call /api/user/search when status, role, or group filters are present, not only when keyword is present.",
    },
    {
      name: "users-search-sends-status-role-group",
      ok:
        /status:\s*getFirstColumnFilterValue\(\s*columnFilters,\s*['"]status['"]\s*\)/.test(
          text,
        ) &&
        /role:\s*getFirstColumnFilterValue\(\s*columnFilters,\s*['"]role['"]\s*\)/.test(
          text,
        ) &&
        /group:\s*getFirstColumnFilterValue\(\s*columnFilters,\s*['"]group['"]\s*\)/.test(
          text,
        ),
      message:
        "Users table must map URL-backed status, role, and group filters into searchUsers params.",
    },
    {
      name: "users-pagination-remains-server-side-for-search",
      ok: /manualPagination:\s*true/.test(text),
      message:
        "Users table pagination must stay server-side when keyword or column filters use backend search.",
    },
    {
      name: "users-delete-uses-manage-soft-delete-action",
      ok:
        /export\s+async\s+function\s+deleteUser\([\s\S]*api\.post\(\s*['"]\/api\/user\/manage['"]\s*,\s*\{\s*id\s*,\s*action:\s*['"]delete['"]\s*\}/.test(
          apiText,
        ) && !/api\.delete\(\s*`\/api\/user\/\$\{id\}\/`/.test(apiText),
      message:
        "Users delete must follow classic/backend soft-delete semantics through POST /api/user/manage with action=delete, not hard-delete via DELETE /api/user/:id/.",
    },
    {
      name: "users-smoke-covers-manage-delete-and-rejects-hard-delete",
      ok:
        /body\.action === ["']delete["']/.test(smokeText) &&
        /request\.body\?\.action === ["']delete["']/.test(smokeText) &&
        /not\.toBeTruthy\(\)/.test(smokeText) &&
        /DELETE[\s\S]*\/api\/user\/9100\//.test(smokeText),
      message:
        "Users runtime smoke must prove deletion uses the manage delete action and does not call the hard-delete endpoint.",
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
  const report = auditUsers();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
