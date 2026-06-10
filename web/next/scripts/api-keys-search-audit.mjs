import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const tablePath = path.join(
  nextRoot,
  "src/features/keys/components/api-keys-table.tsx",
);
const smokePath = path.join(nextRoot, "scripts/api-keys-smoke.spec.js");

export function auditApiKeysSearch() {
  const tableText = fs.readFileSync(tablePath, "utf8");
  const smokeText = fs.readFileSync(smokePath, "utf8");

  const checks = [
    {
      name: "api-keys-has-url-backed-token-search-filter",
      ok:
        /columnId:\s*['"]_tokenSearch['"][\s\S]*searchKey:\s*['"]token['"][\s\S]*type:\s*['"]string['"]/.test(
          tableText,
        ) && /tokenFilterFromUrl/.test(tableText),
      message:
        "API Keys table must keep a URL-backed token query filter separate from the name keyword filter.",
    },
    {
      name: "api-keys-has-separate-token-search-input",
      ok:
        /Filter by API key/.test(tableText) &&
        /additionalSearch/.test(tableText) &&
        /tokenFilterInput/.test(tableText),
      message:
        "API Keys table must expose a separate API key search input backed by the token query parameter.",
    },
    {
      name: "api-keys-query-key-includes-token-filter",
      ok: /queryKey:\s*\[[\s\S]*tokenFilter[\s\S]*\]/.test(tableText),
      message:
        "API Keys query key must include tokenFilter so token-only searches refetch.",
    },
    {
      name: "api-keys-search-sends-keyword-and-token",
      ok:
        /searchApiKeys\(\s*\{[\s\S]*keyword:\s*globalFilter,[\s\S]*token:\s*tokenFilter/s.test(
          tableText,
        ) &&
        /globalFilter\?\.\s*trim\(\)\s*\|\|\s*tokenFilter\.trim\(\)/.test(
          tableText,
        ),
      message:
        "API Keys table must call /api/token/search when either keyword or API-key fragment search is present.",
    },
    {
      name: "api-keys-smoke-keeps-keyword-and-token-separate",
      ok:
        /const keyword = \(params\.keyword \|\| ""\)/.test(smokeText) &&
        /const token = \(params\.token \|\| ""\)/.test(smokeText) &&
        /request\.params\.token === "billing-secret"/.test(smokeText),
      message:
        "API Keys smoke must prove backend keyword and token search fields stay separate.",
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
  const report = auditApiKeysSearch();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
