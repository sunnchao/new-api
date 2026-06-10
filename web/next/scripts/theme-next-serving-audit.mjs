import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

export function auditThemeNextServing() {
  const constants = read("common/constants.go");
  const optionController = read("controller/option.go");
  const webRouter = read("router/web-router.go");
  const systemInfo = read(
    "web/next/src/features/system-settings/general/system-info-section.tsx",
  );
  const siteSectionRegistry = read(
    "web/next/src/features/system-settings/site/section-registry.tsx",
  );

  const checks = [
    {
      name: "common-theme-accepts-next",
      ok:
        /func SetTheme\(t string\)[\s\S]*t == "next"/.test(constants) &&
        /func ThemeAwarePath\(suffix string\)[\s\S]*GetTheme\(\) != "default" && GetTheme\(\) != "next"[\s\S]*return suffix/.test(
          constants,
        ) &&
        /strings\.Replace\(suffix, "\/console\/topup", "\/wallet", 1\)/.test(
          constants,
        ),
      message:
        "common.SetTheme must accept next, and ThemeAwarePath must treat next like the modern frontend rather than classic.",
    },
    {
      name: "option-controller-validates-next-theme",
      ok:
        /case "theme\.frontend"/.test(optionController) &&
        /option\.Value != "next"/.test(optionController) &&
        /NEXT_FRONTEND_BASE_URL|FRONTEND_NEXT_BASE_URL/.test(optionController),
      message:
        "theme.frontend option validation must allow next only when a Next frontend base URL is configured.",
    },
    {
      name: "web-router-proxies-next-theme",
      ok:
        /httputil\.NewSingleHostReverseProxy/.test(webRouter) &&
        /NEXT_FRONTEND_BASE_URL|FRONTEND_NEXT_BASE_URL/.test(webRouter) &&
        /common\.GetTheme\(\) != "next"/.test(webRouter) &&
        /StatusServiceUnavailable/.test(webRouter),
      message:
        "Go web router must proxy next theme requests to the configured Next server and fail visibly when missing.",
    },
    {
      name: "next-system-settings-exposes-next-theme",
      ok:
        /z\.enum\(\[['"]default['"], ['"]classic['"], ['"]next['"]\]\)/.test(
          systemInfo,
        ) &&
        /value:\s*['"]next['"]/.test(systemInfo) &&
        !/name='theme\.frontend'[\s\S]{0,800}disabled/.test(systemInfo),
      message:
        "Next system settings must preserve and expose the next frontend theme instead of hardcoding default/disabled.",
    },
    {
      name: "next-system-settings-handoff-preserves-next",
      ok:
        /frontend:\s*settings\[['"]theme\.frontend['"]\]\s+as\s+['"]default['"]\s*\|\s*['"]classic['"]\s*\|\s*['"]next['"]/.test(
          siteSectionRegistry,
        ) ||
        (/frontend:\s*settings\[['"]theme\.frontend['"]\]/.test(
          siteSectionRegistry,
        ) &&
          !/frontend:\s*settings\[['"]theme\.frontend['"]\]\s+as\s+['"]default['"]\s*\|\s*['"]classic['"]/.test(
            siteSectionRegistry,
          )),
      message:
        "Site settings must pass theme.frontend through with next included, not narrow it to default/classic.",
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
  const report = auditThemeNextServing();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
