import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

const localeCodes = ["en", "zh", "fr", "ja", "ru", "vi"];
const shellControlLocaleKeys = [
  "Switch language",
  "Color preset",
  "Corner radius",
  "UI scale",
  "Reset theme customization",
  "Blue",
  "Violet",
  "Teal",
  "Rose",
  "Amber",
  "Sharp",
  "Small",
  "Medium",
  "Large",
  "Compact",
  "Comfortable",
  "Active",
  "Light",
  "Dark",
];

function hasShellControlLocaleKeys() {
  return localeCodes.every((locale) => {
    const data = JSON.parse(readSource(`src/i18n/locales/${locale}.json`));
    return shellControlLocaleKeys.every(
      (key) =>
        typeof data[key] === "string" &&
        data[key].trim() !== "" &&
        !Object.prototype.hasOwnProperty.call(data.translation ?? {}, key),
    );
  });
}

export function auditShellControls() {
  const appHeaderText = readSource("src/components/layout/app-header.tsx");
  const languageSwitcherText = readSource("src/components/language-switcher.tsx");
  const themeCustomizerText = readSource("src/components/theme-customizer.tsx");
  const smokeText = readSource("scripts/shell-controls-smoke.spec.js");

  const checks = [
    {
      name: "authenticated-header-mounts-language-and-theme-controls",
      ok:
        /components\/language-switcher/.test(appHeaderText) &&
        /<LanguageSwitcher\b/.test(appHeaderText) &&
        /components\/theme-customizer/.test(appHeaderText) &&
        /<ThemeCustomizer\b/.test(appHeaderText),
      message:
        "Authenticated AppHeader must expose the language switcher and theme customization controls.",
    },
    {
      name: "shell-control-copy-is-localized",
      ok:
        /t\(["']Switch language["']\)/.test(languageSwitcherText) &&
        /t\(["']Color preset["']\)/.test(themeCustomizerText) &&
        /t\(["']Corner radius["']\)/.test(themeCustomizerText) &&
        /t\(["']UI scale["']\)/.test(themeCustomizerText) &&
        /t\(["']Reset theme customization["']\)/.test(themeCustomizerText) &&
        hasShellControlLocaleKeys(),
      message:
        "Shell language and theme labels must use i18n keys present at the top level of every Next locale.",
    },
    {
      name: "light-dark-system-menu-is-localized",
      ok:
        /t\(["']Light["']\)/.test(appHeaderText) &&
        /t\(["']Dark["']\)/.test(appHeaderText) &&
        /t\(["']System["']\)/.test(appHeaderText),
      message:
        "Authenticated AppHeader light/dark/system theme menu must use i18n labels.",
    },
    {
      name: "shell-controls-runtime-smoke-covered",
      ok:
        /Switch language/.test(smokeText) &&
        /Color preset/.test(smokeText) &&
        /Corner radius/.test(smokeText) &&
        /UI scale/.test(smokeText) &&
        /data-theme-preset/.test(smokeText) &&
        /data-theme-radius/.test(smokeText) &&
        /data-theme-scale/.test(smokeText) &&
        /\/api\/user\/self/.test(smokeText),
      message:
        "Shell controls smoke must cover language persistence and theme customization attributes.",
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
  const report = auditShellControls();
  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
