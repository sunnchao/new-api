import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const nextRoot = path.join(repoRoot, "web/next/src");
const backendRoot = repoRoot;

function readFile(filePath, warnings) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    warnings.push({
      type: "read-file",
      path: filePath,
      message: error.message,
    });
    return "";
  }
}

export function auditRedemptionCodes() {
  const warnings = [];
  const failures = [];
  const tableSource = readFile(
    path.join(
      nextRoot,
      "features/redemption-codes/components/redemptions-table.tsx",
    ),
    warnings,
  );
  const controllerSource = readFile(
    path.join(backendRoot, "controller/redemption.go"),
    warnings,
  );

  if (
    /columnId:\s*['"]status['"][\s\S]*?options:\s*redemptionStatusOptions/.test(
      tableSource,
    ) &&
    !/columnId:\s*['"]status['"][\s\S]*?singleSelect:\s*true/.test(tableSource)
  ) {
    failures.push({
      id: "redemption-status-filter-single-select",
      message:
        "Redemption status is a client-side page filter because the backend list/search endpoints do not accept status; keep the toolbar single-select to match web/default and avoid multi-status page-count confusion.",
    });
  }

  if (
    /func SearchRedemptions\(c \*gin\.Context\)/.test(controllerSource) &&
    !/keyword := c\.Query\(['"]keyword['"]\)/.test(controllerSource)
  ) {
    failures.push({
      id: "redemption-backend-search-keyword-contract",
      message:
        "Backend redemption search contract should be audited before changing frontend status filtering.",
    });
  }

  return {
    failureCount: failures.length,
    failures,
    warnings,
  };
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const report = auditRedemptionCodes();
  console.log(JSON.stringify(report, null, 2));
  if (
    process.argv.includes("--fail-on-gap") &&
    (report.failureCount > 0 || report.warnings.length > 0)
  ) {
    process.exitCode = 1;
  }
}
