import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  try {
    return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
  } catch {
    return "";
  }
}

export function auditTelegramOAuth() {
  const authApi = readSource("src/features/auth/api.ts");
  const oauthHook = readSource("src/features/auth/hooks/use-oauth-login.ts");
  const telegramLib = readSource("src/features/auth/lib/telegram.ts");
  const profileApi = readSource("src/features/profile/api.ts");
  const bindDialog = readSource(
    "src/features/profile/components/dialogs/telegram-bind-dialog.tsx"
  );
  const authSmoke = readSource("scripts/auth-smoke.spec.js");
  const profileSmoke = readSource("scripts/profile-bindings-smoke.spec.js");

  const checks = [
    {
      name: "telegram-login-calls-backend-endpoint",
      ok:
        /telegramLoginByData/.test(authApi) &&
        /\/api\/oauth\/telegram\/login/.test(authApi),
      message:
        "Telegram sign-in must submit signed Telegram auth params to GET /api/oauth/telegram/login.",
    },
    {
      name: "telegram-popup-filters-signed-fields",
      ok:
        /TELEGRAM_AUTH_FIELDS/.test(telegramLib) &&
        /sanitizeTelegramAuthData/.test(telegramLib) &&
        /source/.test(telegramLib) &&
        /oauth\.telegram\.org\/authorize/.test(telegramLib),
      message:
        "Telegram popup helper must parse hash/postMessage data and filter it to backend-signed Telegram fields only.",
    },
    {
      name: "telegram-login-is-not-coming-soon-placeholder",
      ok:
        !/Telegram login requires widget integration; coming soon/.test(
          oauthHook
        ) &&
        /handleTelegramLogin\s*=\s*async/.test(oauthHook) &&
        /telegramLoginByData/.test(oauthHook) &&
        /handleLoginSuccess/.test(oauthHook),
      message:
        "Telegram provider button should run the real popup/login flow and hydrate the logged-in user.",
    },
    {
      name: "telegram-bind-dialog-calls-bind-endpoint",
      ok:
        !/Telegram Login Widget/.test(bindDialog) &&
        /TelegramAuthButton/.test(bindDialog) &&
        /bindTelegram/.test(bindDialog) &&
        /\/api\/oauth\/telegram\/bind/.test(profileApi) &&
        /onSuccess\(\)/.test(bindDialog),
      message:
        "Profile Telegram binding dialog should use the Telegram popup and bind endpoint instead of a widget placeholder.",
    },
    {
      name: "telegram-login-runtime-smoke-covered",
      ok:
        /signs in through Telegram popup auth data/.test(authSmoke) &&
        /\/api\/oauth\/telegram\/login/.test(authSmoke) &&
        /telegram-smoke-hash/.test(authSmoke),
      message:
        "Auth smoke should prove the Telegram button submits signed popup data and redirects after login.",
    },
    {
      name: "telegram-bind-runtime-smoke-covered",
      ok:
        /binds Telegram through popup auth data/.test(profileSmoke) &&
        /\/api\/oauth\/telegram\/bind/.test(profileSmoke) &&
        /telegram-bind-hash/.test(profileSmoke),
      message:
        "Profile bindings smoke should prove the Telegram bind dialog sends signed popup data to the bind endpoint.",
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
  const report = auditTelegramOAuth();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
