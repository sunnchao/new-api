import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const tablePath = path.join(
  nextRoot,
  "src/features/admin-tokens/components/admin-tokens-table.tsx",
);
const smokePath = path.join(nextRoot, "scripts/admin-tokens-smoke.spec.js");

export function auditAdminTokensSearch() {
  const tableText = fs.readFileSync(tablePath, "utf8");
  const smokeText = fs.readFileSync(smokePath, "utf8");

  const checks = [
    {
      name: "admin-tokens-removes-unsupported-status-url-filter",
      ok:
        !/columnFilters:\s*\[\s*\{\s*columnId:\s*['"]status['"]/s.test(
          tableText,
        ) && !/API_KEY_STATUS_OPTIONS/.test(tableText),
      message:
        "Admin token search backend has no status parameter; the table must not expose a URL-backed status faceted filter.",
    },
    {
      name: "admin-tokens-has-separate-token-search-input",
      ok:
        /Filter by API key/.test(tableText) &&
        /additionalSearch/.test(tableText) &&
        /tokenFilter/.test(tableText),
      message:
        "Admin token table must expose a separate API key search input backed by the token query parameter.",
    },
    {
      name: "admin-tokens-query-key-includes-token-filter",
      ok: /queryKey:\s*\[[\s\S]*tokenFilter[\s\S]*\]/.test(tableText),
      message:
        "Admin token query key must include tokenFilter so token-only searches refetch.",
    },
    {
      name: "admin-tokens-search-sends-keyword-and-token",
      ok:
        /searchAdminTokens\(\s*\{[\s\S]*keyword,[\s\S]*token:\s*tokenFilter/s.test(
          tableText,
        ) &&
        /keyword\s*\|\|\s*tokenFilter/.test(tableText),
      message:
        "Admin token table must call /api/admin/token/search when either keyword or token search is present.",
    },
    {
      name: "admin-tokens-smoke-mocks-backend-search-fields",
      ok:
        /const keyword = \(params\.keyword \|\| ""\)/.test(smokeText) &&
        /const tokenKey = \(params\.token \|\| ""\)/.test(smokeText) &&
        /request\.params\.token === "billing-secret"/.test(smokeText),
      message:
        "Admin token smoke must keep keyword and token backend search fields separate.",
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
  const report = auditAdminTokensSearch();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
