import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

const sources = {
  api: "src/lib/api.ts",
  profile: "src/features/profile/index.tsx",
  profileI18n: "src/features/profile/i18n.ts",
  profileApi: "src/features/profile/api.ts",
  bindingsTab:
    "src/features/profile/components/tabs/account-bindings-tab.tsx",
  wechatDialog: "src/features/profile/components/dialogs/wechat-bind-dialog.tsx",
  checkinCard: "src/features/profile/components/checkin-calendar-card.tsx",
  twoFaCard: "src/features/profile/components/two-fa-card.tsx",
  twoFaHook: "src/features/profile/hooks/use-two-fa.ts",
  setupDialog:
    "src/features/profile/components/dialogs/two-fa-setup-dialog.tsx",
  disableDialog:
    "src/features/profile/components/dialogs/two-fa-disable-dialog.tsx",
  backupDialog:
    "src/features/profile/components/dialogs/two-fa-backup-dialog.tsx",
  profileBindingsSmoke: "scripts/profile-bindings-smoke.spec.js",
};

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

export function auditProfileSecurity() {
  const api = readSource(sources.api);
  const profile = readSource(sources.profile);
  const profileI18n = readSource(sources.profileI18n);
  const profileApi = readSource(sources.profileApi);
  const bindingsTab = readSource(sources.bindingsTab);
  const wechatDialog = readSource(sources.wechatDialog);
  const checkinCard = readSource(sources.checkinCard);
  const twoFaCard = readSource(sources.twoFaCard);
  const twoFaHook = readSource(sources.twoFaHook);
  const setupDialog = readSource(sources.setupDialog);
  const disableDialog = readSource(sources.disableDialog);
  const backupDialog = readSource(sources.backupDialog);
  const profileBindingsSmoke = readSource(sources.profileBindingsSmoke);

  const checks = [
    {
      name: "profile-renders-two-fa-card",
      ok: /<TwoFACard\s+loading=\{loading\}\s*\/>/.test(profile),
      message:
        "Profile should render the 2FA card so users can manage two-factor authentication.",
    },
    {
      name: "two-fa-status-hook-loads-status-api",
      ok: /get2FAStatus/.test(twoFaHook) && /\/api\/user\/2fa\/status/.test(api),
      message:
        "2FA status should be loaded from /api/user/2fa/status through the profile hook.",
    },
    {
      name: "two-fa-card-wires-setup-disable-backup-dialogs",
      ok:
        /TwoFASetupDialog/.test(twoFaCard) &&
        /TwoFADisableDialog/.test(twoFaCard) &&
        /TwoFABackupDialog/.test(twoFaCard) &&
        /dialogs\.open\('setup'\)/.test(twoFaCard) &&
        /dialogs\.open\('disable'\)/.test(twoFaCard) &&
        /dialogs\.open\('backup'\)/.test(twoFaCard) &&
        /onSuccess=\{refetch\}/.test(twoFaCard),
      message:
        "2FA card should expose setup, disable, and backup-code regeneration dialogs and refresh status after success.",
    },
    {
      name: "two-fa-setup-dialog-uses-qr-secret-backup-and-enable-api",
      ok:
        /setup2FA/.test(setupDialog) &&
        /enable2FA\(code\)/.test(setupDialog) &&
        /QRCodeSVG/.test(setupDialog) &&
        /setupData\.qr_code_data/.test(setupDialog) &&
        /setupData\.secret/.test(setupDialog) &&
        /setupData\.backup_codes/.test(setupDialog) &&
        /\/api\/user\/2fa\/setup/.test(api) &&
        /\/api\/user\/2fa\/enable/.test(api),
      message:
        "2FA setup should create setup data, show QR/manual secret/backup codes, and enable with a verification code.",
    },
    {
      name: "two-fa-disable-dialog-uses-code-or-backup-code-api",
      ok:
        /disable2FA\(code\)/.test(disableDialog) &&
        /Enter code or backup code/.test(disableDialog) &&
        /confirmed/.test(disableDialog) &&
        /\/api\/user\/2fa\/disable/.test(api),
      message:
        "2FA disable should require confirmation and accept an authenticator code or backup code.",
    },
    {
      name: "two-fa-backup-dialog-regenerates-and-copies-codes",
      ok:
        /regenerate2FABackupCodes\(code\)/.test(backupDialog) &&
        /backupCodes\.map/.test(backupDialog) &&
        /backupCodes\.join\('\\n'\)/.test(backupDialog) &&
        /CopyButton/.test(backupDialog) &&
        /\/api\/user\/2fa\/backup_codes/.test(api),
      message:
        "2FA backup-code dialog should regenerate, display, and copy new backup codes.",
    },
    {
      name: "profile-renders-checkin-card-from-status",
      ok:
        /status\?\.checkin_enabled\s*===\s*true/.test(profile) &&
        /<CheckinCalendarCard/.test(profile) &&
        /turnstileEnabled=\{turnstileEnabled\}/.test(profile) &&
        /turnstileSiteKey=\{turnstileSiteKey\}/.test(profile),
      message:
        "Profile should render the daily check-in card only when /api/status enables check-in and pass Turnstile settings through.",
    },
    {
      name: "checkin-card-uses-backend-checkin-apis",
      ok:
        /getCheckinStatus\(currentMonthStr\)/.test(checkinCard) &&
        /performCheckin\(token\)/.test(checkinCard) &&
        /refetch\(\)/.test(checkinCard) &&
        /\/api\/user\/checkin\?month=\$\{month\}/.test(profileApi) &&
        /\/api\/user\/checkin\?turnstile=\$\{encodeURIComponent\(turnstileToken\)\}/.test(
          profileApi
        ),
      message:
        "The check-in card should load monthly status, POST daily check-ins, support Turnstile tokens, and refresh status after success.",
    },
    {
      name: "checkin-copy-is-feature-localized",
      ok:
        /'This month': '本月获得'/.test(profileI18n) &&
        /'Total earned': '累计获得'/.test(profileI18n) &&
        /'Today': '今日'/.test(profileI18n) &&
        /'Rewards will be added directly to your balance'/.test(profileI18n) &&
        /'Do not repeat check-in; only once per day'/.test(profileI18n) &&
        /Check-in successful! Received \{\{q\}\}/.test(checkinCard),
      message:
        "Profile check-in copy should be registered in the profile feature i18n bundle, and the success toast should use the interpolated translation key.",
    },
    {
      name: "wechat-bind-api-uses-backend-post-contract",
      ok:
        /api\.post\('\/api\/oauth\/wechat\/bind'/.test(profileApi) &&
        /\{\s*code,?\s*\}/.test(profileApi) &&
        !/\/api\/oauth\/wechat\/bind\?code=/.test(profileApi),
      message:
        "WeChat self-binding must use the backend POST /api/oauth/wechat/bind contract with a JSON code body.",
    },
    {
      name: "wechat-bind-dialog-renders-status-qr-and-code-submit",
      ok:
        /qrCodeUrl/.test(wechatDialog) &&
        /<img/.test(wechatDialog) &&
        /alt=\{t\('WeChat QR code'\)\}/.test(wechatDialog) &&
        /bindWeChat\(trimmedCode\)/.test(wechatDialog) &&
        /Verification Code/.test(wechatDialog) &&
        /Bind WeChat/.test(wechatDialog) &&
        /toast\.success/.test(wechatDialog) &&
        /onSuccess\(\)/.test(wechatDialog) &&
        /onOpenChange\(false\)/.test(wechatDialog) &&
        /qrCodeUrl=\{weChatQrCodeUrl\}/.test(bindingsTab) &&
        /value:\s*wechatId/.test(bindingsTab),
      message:
        "WeChat bind dialog should display the status QR code, accept a verification code, bind through the API, close, refresh the profile, and show the bound id.",
    },
    {
      name: "wechat-bind-runtime-smoke-covered",
      ok:
        /binds WeChat using the status QR code and verification code/.test(
          profileBindingsSmoke
        ) &&
        /wechat_login:\s*true/.test(profileBindingsSmoke) &&
        /wechat_qrcode:\s*"https:\/\/example\.test\/wechat\.png"/.test(
          profileBindingsSmoke
        ) &&
        /\/api\/oauth\/wechat\/bind/.test(profileBindingsSmoke) &&
        /code:\s*"WX-SMOKE"/.test(profileBindingsSmoke),
      message:
        "Profile bindings smoke should cover the runtime WeChat QR-code/code binding flow.",
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
  const report = auditProfileSecurity();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
