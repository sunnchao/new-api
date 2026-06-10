import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

export function auditPublicMobileNav() {
  const publicHeaderText = readSource("src/components/layout/public-header.tsx");
  const smokeText = readSource("scripts/public-pages-smoke.spec.js");

  const checks = [
    {
      name: "public-header-has-mobile-menu-trigger",
      ok:
        /Menu/.test(publicHeaderText) &&
        /aria-label=\{t\(["']Toggle navigation menu["']\)\}/.test(
          publicHeaderText,
        ) &&
        /setMobileMenuOpen/.test(publicHeaderText),
      message:
        "PublicHeader must expose a mobile menu trigger for public navigation links below the desktop breakpoint.",
    },
    {
      name: "public-header-renders-mobile-nav-links",
      ok:
        /mobileMenuOpen/.test(publicHeaderText) &&
        /navLinks\.map/.test(publicHeaderText) &&
        /mobileNavLinks/.test(publicHeaderText) &&
        /displayUser/.test(publicHeaderText) &&
        /\/my-subscriptions/.test(publicHeaderText),
      message:
        "PublicHeader mobile menu must render the same dynamic public links plus auth-aware account links.",
    },
    {
      name: "public-mobile-nav-runtime-smoke-covered",
      ok:
        /mobile public header exposes navigation drawer/.test(smokeText) &&
        /Toggle navigation menu/.test(smokeText) &&
        /setViewportSize\(\{\s*width:\s*390,\s*height:\s*844\s*\}\)/.test(
          smokeText,
        ) &&
        /\/subscription-plans/.test(smokeText) &&
        /\/sign-in/.test(smokeText),
      message:
        "Public pages smoke must cover the public mobile nav drawer and auth CTA on a phone-sized viewport.",
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
  const report = auditPublicMobileNav();
  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
