import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

const localeCodes = ["en", "zh", "fr", "ja", "ru", "vi"];
const publicHeaderControlLocaleKeys = ["Switch language", "Toggle theme"];

function hasPublicHeaderControlLocaleKeys() {
  return localeCodes.every((locale) => {
    const data = JSON.parse(readSource(`src/i18n/locales/${locale}.json`));
    return publicHeaderControlLocaleKeys.every(
      (key) => typeof data[key] === "string" && data[key].trim() !== "",
    );
  });
}

export function auditPublicHeaderControls() {
  const publicHeaderText = readSource("src/components/layout/public-header.tsx");
  const smokeText = readSource("scripts/public-pages-smoke.spec.js");

  const checks = [
    {
      name: "public-header-icon-controls-have-accessible-names",
      ok:
        /aria-label=\{t\(["']Switch language["']\)\}/.test(publicHeaderText) &&
        /aria-label=\{t\(["']Toggle theme["']\)\}/.test(publicHeaderText),
      message:
        "PublicHeader language and theme icon buttons must expose localized accessible names.",
    },
    {
      name: "public-header-control-copy-is-localized",
      ok: hasPublicHeaderControlLocaleKeys(),
      message:
        "PublicHeader language and theme control labels must exist in every Next locale.",
    },
    {
      name: "public-header-controls-runtime-smoke-covered",
      ok:
        /public header exposes accessible language and theme controls/.test(smokeText) &&
        /Switch language/.test(smokeText) &&
        /Toggle theme/.test(smokeText),
      message:
        "Public pages smoke must cover accessible language and theme controls in the public header.",
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
  const report = auditPublicHeaderControls();
  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
