import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const channelActionsPath = path.join(
  nextRoot,
  "src/features/channels/lib/channel-actions.ts",
);

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function getFunctionBody(source, name) {
  const marker = `export async function ${name}`;
  const start = source.indexOf(marker);
  if (start === -1) return "";

  const nextExport = source.indexOf("\nexport async function ", start + marker.length);
  return nextExport === -1 ? source.slice(start) : source.slice(start, nextExport);
}

function countsBusinessFailures(body) {
  return (
    /r\.status\s*===\s*['"]fulfilled['"]\s*&&\s*r\.value\.success/.test(body) &&
    /r\.status\s*===\s*['"]rejected['"][\s\S]*r\.status\s*===\s*['"]fulfilled['"]\s*&&\s*!r\.value\.success/.test(
      body,
    )
  );
}

export function auditChannelBatchBusinessFailureSemantics() {
  const source = readSource(channelActionsPath);
  const batchEnable = getFunctionBody(source, "handleBatchEnable");
  const batchDisable = getFunctionBody(source, "handleBatchDisable");

  const checks = [
    {
      name: "batch-enable-counts-only-business-success",
      ok: countsBusinessFailures(batchEnable),
      message:
        "Batch enable must not count HTTP 200 { success: false } responses as successful channel updates.",
    },
    {
      name: "batch-disable-counts-only-business-success",
      ok: countsBusinessFailures(batchDisable),
      message:
        "Batch disable must not count HTTP 200 { success: false } responses as successful channel updates.",
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
  const report = auditChannelBatchBusinessFailureSemantics();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
