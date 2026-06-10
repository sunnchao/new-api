import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

const sources = {
  authApi: "src/features/auth/api.ts",
  authGuard: "src/components/auth-guard.tsx",
  authRedirect: "src/features/auth/hooks/use-auth-redirect.ts",
  emailVerificationHook: "src/features/auth/hooks/use-email-verification.ts",
  oauthCallback: "src/features/auth/oauth-callback.tsx",
  oauthLogin: "src/features/auth/hooks/use-oauth-login.ts",
  otpForm: "src/features/auth/otp/components/otp-form.tsx",
  resetConfirm: "src/features/auth/reset-password-confirm/index.tsx",
  signUpForm: "src/features/auth/sign-up/components/sign-up-form.tsx",
  authSmoke: "scripts/auth-smoke.spec.js",
};

function readSource(relativePath, warnings) {
  try {
    return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
  } catch (error) {
    warnings.push({
      type: "read-file",
      path: relativePath,
      message: error.message,
    });
    return "";
  }
}

export function auditAuth() {
  const warnings = [];
  const authApi = readSource(sources.authApi, warnings);
  const authGuard = readSource(sources.authGuard, warnings);
  const authRedirect = readSource(sources.authRedirect, warnings);
  const emailVerificationHook = readSource(
    sources.emailVerificationHook,
    warnings
  );
  const oauthCallback = readSource(sources.oauthCallback, warnings);
  const oauthLogin = readSource(sources.oauthLogin, warnings);
  const otpForm = readSource(sources.otpForm, warnings);
  const resetConfirm = readSource(sources.resetConfirm, warnings);
  const signUpForm = readSource(sources.signUpForm, warnings);
  const authSmoke = readSource(sources.authSmoke, warnings);

  const checks = [
    {
      name: "oauth-redirect-storage-handoff-covered",
      ok:
        /saveOAuthRedirectForState\(state,\s*redirectTo\)/.test(oauthLogin) &&
        /consumeOAuthRedirectForState\(state\)/.test(oauthCallback) &&
        /oauth:redirect:oauth-start-state/.test(authSmoke) &&
        /\.toBe\(["']\/wallet\?tab=billing["']\)/.test(authSmoke) &&
        /\.toBeNull\(\)/.test(authSmoke),
      message:
        "OAuth login should save redirect targets by state, the callback should consume them, and auth smoke should assert the handoff is cleared after use.",
    },
    {
      name: "oauth-bind-action-or-message-covered",
      ok:
        /message\s*===\s*['"]bind['"]/.test(oauthCallback) &&
        /isOAuthBindPayload\(responseData\)/.test(oauthCallback) &&
        /\(value as \{ action\?: unknown \}\)\.action === ['"]bind['"]/.test(
          oauthCallback
        ) &&
        /recognizes OAuth binding action returned in response data/.test(
          authSmoke
        ) &&
        /data:\s*\{\s*action:\s*["']bind["']/.test(authSmoke) &&
        /oauth:binding:result/.test(authSmoke),
      message:
        "OAuth callback should treat both message=bind and data.action=bind as binding success, with smoke coverage for the data.action form.",
    },
    {
      name: "protected-route-query-redirect-covered",
      ok:
        /\$\{window\.location\.pathname\}\$\{window\.location\.search\}\$\{window\.location\.hash\}/.test(
          authGuard
        ) &&
        /encodeURIComponent\(getCurrentRedirectTarget\(\)\)/.test(authGuard) &&
        /preserves protected-route query params in the sign-in redirect/.test(
          authSmoke
        ) &&
        /\/my-subscriptions\?plan_id=7007/.test(authSmoke) &&
        /\.toBe\(\s*["']\/my-subscriptions\?plan_id=7007["']\s*\)/.test(
          authSmoke
        ),
      message:
        "Protected routes should preserve pathname and query params when redirecting unauthenticated users to sign-in.",
    },
    {
      name: "wallet-oauth-redirect-preserved-covered",
      ok:
        /\/sign-in\?redirect=%2Fwallet%3Ftab%3Dbilling/.test(authSmoke) &&
        /saveOAuthRedirectForState\(state,\s*redirectTo\)/.test(oauthLogin) &&
        /searchParams\.get\(['"]redirect['"]\)\s*\|\|\s*consumeOAuthRedirectForState\(state\)/.test(
          oauthCallback
        ) &&
        /\/oauth\/github\?code=oauth-login-code&state=oauth-start-state/.test(
          authSmoke
        ) &&
        /\/wallet\\\?tab=billing/.test(authSmoke),
      message:
        "Wallet redirects with query params should survive OAuth start and callback via the state storage handoff.",
    },
    {
      name: "otp-redirect-covered",
      ok:
        /const redirectTo = searchParams\.get\(['"]redirect['"]\) \?\? undefined/.test(
          otpForm
        ) &&
        /handleLoginSuccess\(userData,\s*redirectTo\)/.test(otpForm) &&
        /const targetPath = redirectTo \|\| ['"]\/dashboard['"]/.test(
          authRedirect
        ) &&
        /\/otp\?redirect=%2Fkeys/.test(authSmoke) &&
        /Verify and Sign In/.test(authSmoke) &&
        /toHaveURL\(\/\\\/keys\$\/\)/.test(authSmoke),
      message:
        "OTP verification should read the redirect query, pass it through login success handling, and smoke-test navigation to the target.",
    },
    {
      name: "reset-confirm-failure-display-covered",
      ok:
        /skipBusinessError:\s*true/.test(resetConfirm) &&
        /setErrorMessage\(message\)/.test(resetConfirm) &&
        /<AlertDescription>\{errorMessage\}<\/AlertDescription>/.test(
          resetConfirm
        ) &&
        /surfaces reset confirmation business failures/.test(authSmoke) &&
        /Reset link expired by smoke/.test(authSmoke) &&
        /getByRole\(["']alert["']\)/.test(authSmoke) &&
        /getByLabel\(["']New password["']\)\)\.toHaveCount\(0\)/.test(
          authSmoke
        ),
      message:
        "Reset confirmation should surface backend business failures without rendering a generated password field.",
    },
    {
      name: "registration-email-verification-covered",
      ok:
        /emailVerificationRequired\s*=\s*!!status\?\.email_verification/.test(
          signUpForm
        ) &&
        /sendCode\(emailValue\s*\|\|\s*['"]['"]\)/.test(signUpForm) &&
        /verification_code:\s*verificationCode\s*\|\|\s*undefined/.test(
          signUpForm
        ) &&
        /api\.get\(['"]\/api\/verification['"]/.test(authApi) &&
        /api\.post\(`?['"]?\/api\/user\/register/.test(authApi) &&
        /sendEmailVerification\(email,\s*options\?\.turnstileToken\)/.test(
          emailVerificationHook
        ) &&
        /registers with email verification code/.test(authSmoke) &&
        /email_verification:\s*true/.test(authSmoke) &&
        /\/api\/verification/.test(authSmoke) &&
        /\/api\/user\/register/.test(authSmoke) &&
        /request\.body\?\.verification_code === ["']654321["']/.test(
          authSmoke
        ),
      message:
        "Sign-up should smoke-test the email verification flow: visible email/code fields, GET /api/verification, and POST /api/user/register with verification_code.",
    },
  ];

  const failures = checks.filter((check) => !check.ok);

  return {
    checkCount: checks.length,
    failureCount: failures.length,
    checks,
    warnings,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectInvocation = invokedPath === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  const report = auditAuth();

  console.log(JSON.stringify(report, null, 2));

  if (
    process.argv.includes("--fail-on-gap") &&
    (report.failureCount > 0 || report.warnings.length > 0)
  ) {
    process.exitCode = 1;
  }
}
