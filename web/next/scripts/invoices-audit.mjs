import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath, warnings) {
  const fullPath = path.join(nextRoot, relativePath);
  try {
    return fs.readFileSync(fullPath, "utf8");
  } catch (error) {
    warnings.push({
      type: "read-file",
      path: fullPath,
      message: error.message,
    });
    return "";
  }
}

function readScript(relativePath, warnings) {
  const fullPath = path.join(scriptDir, relativePath);
  try {
    return fs.readFileSync(fullPath, "utf8");
  } catch (error) {
    warnings.push({
      type: "read-file",
      path: fullPath,
      message: error.message,
    });
    return "";
  }
}

export function auditInvoices() {
  const warnings = [];
  const failures = [];
  const invoicesSource = readSource("src/features/invoices/index.tsx", warnings);
  const smokeSource = readScript("invoices-smoke.spec.js", warnings);

  if (
    !/createRealNameSession\(\{\s*verify_type:\s*type,\s*provider:\s*realNameProvider,\s*\}\)/s.test(
      invoicesSource
    )
  ) {
    failures.push({
      id: "invoices-realname-session-provider-payload",
      message:
        "Invoices should create real-name sessions with verify_type and the selected provider.",
    });
  }

  if (!/window\.open\(redirectUrl,\s*'_blank',\s*'noopener,noreferrer'\)/.test(invoicesSource)) {
    failures.push({
      id: "invoices-realname-session-redirect-handoff",
      message:
        "Invoices should hand off real-name verification redirect_url through window.open.",
    });
  }

  if (
    !/creates real-name verification session with provider redirect/.test(smokeSource) ||
    !/\/api\/realname\/session/.test(smokeSource) ||
    !/verify_type:\s*"personal"/.test(smokeSource) ||
    !/provider:\s*"mockpay"/.test(smokeSource) ||
    !/https:\/\/example\.com\/verify/.test(smokeSource) ||
    !/Verification session created/.test(smokeSource)
  ) {
    failures.push({
      id: "invoices-realname-session-runtime-smoke",
      message:
        "Invoices runtime smoke should click Start verification, assert session payload, and verify redirect handoff.",
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
  const report = auditInvoices();
  console.log(JSON.stringify(report, null, 2));
  if (
    process.argv.includes("--fail-on-gap") &&
    (report.failureCount > 0 || report.warnings.length > 0)
  ) {
    process.exitCode = 1;
  }
}
