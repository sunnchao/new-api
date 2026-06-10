import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const parityAuditPath = path.join(scriptDir, "parity-audit.mjs");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function listAuditFiles() {
  return fs
    .readdirSync(scriptDir)
    .filter((file) => /-audit\.mjs$/.test(file))
    .filter((file) => file !== "parity-audit.mjs")
    .sort();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findImportedAuditFunction(parityText, auditFile) {
  const importPattern = new RegExp(
    `import\\s*\\{\\s*([^}]+?)\\s*\\}\\s*from\\s*["']\\./${escapeRegExp(
      auditFile,
    )}["']`,
  );
  const match = parityText.match(importPattern);
  if (!match) return null;

  return match[1]
    .split(",")
    .map((name) => name.trim())
    .find((name) => /^audit[A-Z]/.test(name));
}

function findAssignedReportName(parityText, auditFunction) {
  if (!auditFunction) return null;
  const callPattern = new RegExp(
    `const\\s+([A-Za-z0-9_]+)\\s*=\\s*${escapeRegExp(auditFunction)}\\s*\\(`,
  );
  const match = parityText.match(callPattern);
  return match?.[1] ?? null;
}

function reportContainsName(parityText, reportName) {
  if (!reportName) return false;
  const reportObject = parityText.match(/const report = \{([\s\S]*?)\n\};/);
  return Boolean(
    reportObject?.[1] &&
      new RegExp(`(^|\\n)\\s*${escapeRegExp(reportName)}\\s*,`, "m").test(
        reportObject[1],
      ),
  );
}

function failGateContainsName(parityText, reportName) {
  if (!reportName) return false;
  const failGate = parityText.match(
    /if \(process\.argv\.includes\("--fail-on-gap"\)\) \{([\s\S]*?)\n\}/,
  );
  return Boolean(
    failGate?.[1] && new RegExp(`\\b${escapeRegExp(reportName)}\\b`).test(failGate[1]),
  );
}

export function auditParityAuditInventory() {
  const parityText = read(parityAuditPath);
  const failures = [];
  const audits = listAuditFiles().map((auditFile) => {
    const auditFunction = findImportedAuditFunction(parityText, auditFile);
    const reportName = findAssignedReportName(parityText, auditFunction);
    const imported = Boolean(auditFunction);
    const executed = Boolean(reportName);
    const reported = reportContainsName(parityText, reportName);
    const failGated = failGateContainsName(parityText, reportName);

    if (!imported) {
      failures.push({
        id: "parity-audit-missing-import",
        file: auditFile,
        message: `${auditFile} must be imported by parity-audit.mjs.`,
      });
    }

    if (imported && !executed) {
      failures.push({
        id: "parity-audit-not-executed",
        file: auditFile,
        message: `${auditFunction} from ${auditFile} must be executed by parity-audit.mjs.`,
      });
    }

    if (executed && !reported) {
      failures.push({
        id: "parity-audit-not-reported",
        file: auditFile,
        message: `${reportName} from ${auditFile} must be included in the parity audit report.`,
      });
    }

    if (executed && !failGated) {
      failures.push({
        id: "parity-audit-not-fail-gated",
        file: auditFile,
        message: `${reportName} from ${auditFile} must participate in --fail-on-gap.`,
      });
    }

    return {
      file: auditFile,
      auditFunction,
      reportName,
      imported,
      executed,
      reported,
      failGated,
    };
  });

  return {
    auditCount: audits.length,
    failureCount: failures.length,
    failures,
    audits,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectInvocation = invokedPath === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  const report = auditParityAuditInventory();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
