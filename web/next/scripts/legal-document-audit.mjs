import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

export function auditLegalDocuments() {
  const legalDocumentText = readSource("src/features/legal/legal-document.tsx");
  const smokeText = readSource("scripts/public-pages-smoke.spec.js");

  const checks = [
    {
      name: "legal-document-gates-rendering-on-api-success",
      ok:
        /const success = data\?\.success \?\? false/.test(legalDocumentText) &&
        /!\s*success\s*\|\|\s*!\s*hasContent/.test(legalDocumentText),
      message:
        "LegalDocument must not render API data when the backend response reports success:false.",
    },
    {
      name: "legal-document-failed-api-runtime-smoke-covered",
      ok:
        /legal documents do not render failed api payload data/.test(smokeText) &&
        /Should Not Render/.test(smokeText) &&
        /Privacy policy unavailable/.test(smokeText) &&
        /success:\s*false/.test(smokeText),
      message:
        "Public pages smoke must prove failed legal-document API payloads show the message and hide response data.",
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
  const report = auditLegalDocuments();
  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
