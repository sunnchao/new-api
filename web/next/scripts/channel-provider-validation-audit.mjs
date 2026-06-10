import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const channelFormPath = path.join(
  nextRoot,
  "src/features/channels/lib/channel-form.ts",
);
const channelSmokePath = path.join(
  nextRoot,
  "scripts/channel-specialist-smoke.spec.js",
);
const drawerPath = path.join(
  nextRoot,
  "src/features/channels/components/drawers/channel-mutate-drawer.tsx",
);
const libIndexPath = path.join(nextRoot, "src/features/channels/lib/index.ts");
const formErrorsPath = path.join(
  nextRoot,
  "src/features/channels/lib/channel-form-errors.ts",
);

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function auditChannelProviderValidation() {
  const formText = readSource(channelFormPath);
  const smokeText = readSource(channelSmokePath);
  const drawerText = readSource(drawerPath);
  const libIndexText = readSource(libIndexPath);
  const formErrorsText = fs.existsSync(formErrorsPath)
    ? readSource(formErrorsPath)
    : "";

  const checks = [
    {
      name: "provider-validation-super-refine-present",
      ok: /\.superRefine\(\(data,\s*ctx\)\s*=>/.test(formText),
      message:
        "Channel form schema should use provider-specific refinements like web/default.",
    },
    {
      name: "provider-required-base-url-types-guarded",
      ok:
        /\[3,\s*8,\s*36,\s*45\]\.includes\(data\.type\)/.test(formText) &&
        /Base URL is required for this channel type/.test(formText),
      message:
        "Channel types with required base_url should be blocked client-side before submit.",
    },
    {
      name: "provider-required-other-types-guarded",
      ok:
        /\[3,\s*18,\s*21,\s*39,\s*41,\s*49\]\.includes\(data\.type\)/.test(
          formText,
        ) &&
        /This channel type requires additional configuration/.test(formText),
      message:
        "Provider-specific extra configuration should be required for Azure/Xunfei/Baidu/Vertex-like channels.",
    },
    {
      name: "codex-credential-json-guarded",
      ok:
        /isCodexCredential/.test(formText) &&
        /Codex channels do not support batch creation/.test(formText) &&
        /Codex credential must be a JSON object with access_token and account_id/.test(
          formText,
        ),
      message:
        "Codex channels should be locally validated for single-key mode and JSON credential shape.",
    },
    {
      name: "vertex-key-mode-guards-present",
      ok:
        /isVertexJsonKey/.test(formText) &&
        /Vertex AI service account key must be valid JSON/.test(formText) &&
        /Vertex AI API Key mode does not support batch creation/.test(
          formText,
        ),
      message:
        "Vertex AI should locally validate JSON key shape and API-key mode limitations.",
    },
    {
      name: "vertex-region-json-default-guarded",
      ok:
        /isVertexRegionMap/.test(formText) &&
        /Deployment Region must be JSON with a default region/.test(formText) &&
        /Object\.prototype\.hasOwnProperty\.call\(parsed,\s*'default'\)/.test(
          formText,
        ),
      message:
        "Vertex AI Deployment Region should match the backend contract: JSON object with a default field.",
    },
    {
      name: "vertex-missing-region-runtime-smoke-covered",
      ok:
        /blocks Vertex AI create when deployment region is empty/.test(
          smokeText,
        ) &&
        /request\.method === "POST" && request\.pathname === "\/api\/channel"/.test(
          smokeText,
        ) &&
        /This channel type requires additional configuration/.test(smokeText),
      message:
        "Channel specialist smoke should prove empty Vertex Deployment Region blocks create before POST /api/channel.",
    },
    {
      name: "vertex-invalid-region-runtime-smoke-covered",
      ok:
        /blocks Vertex AI create when deployment region JSON lacks default/.test(
          smokeText,
        ) &&
        /"gemini-1\.5-pro": "us-central1"/.test(smokeText) &&
        /Deployment Region must be JSON with a default region/.test(smokeText),
      message:
        "Channel specialist smoke should prove Vertex region JSON without default blocks before POST /api/channel.",
    },
    {
      name: "advanced-settings-error-helper-exported",
      ok:
        /ADVANCED_SETTINGS_FIELDS/.test(formErrorsText) &&
        /hasAdvancedSettingsErrors/.test(formErrorsText) &&
        /export \* from ['"]\.\/channel-form-errors['"]/.test(libIndexText),
      message:
        "Channel lib should expose the same advanced-settings error helper as web/default.",
    },
    {
      name: "advanced-settings-helper-covers-hidden-header-passthrough",
      ok: /['"]pass_through_header_enabled['"]/.test(formErrorsText),
      message:
        "Advanced Settings error detection should include the hidden Pass Through Headers field.",
    },
    {
      name: "advanced-settings-invalid-submit-opens-section",
      ok:
        /SubmitErrorHandler/.test(drawerText) &&
        /const onInvalid:\s*SubmitErrorHandler<ChannelFormValues>/.test(
          drawerText,
        ) &&
        /hasAdvancedSettingsErrors\(errors\)/.test(drawerText) &&
        /form\.handleSubmit\(onSubmit,\s*onInvalid\)/.test(drawerText),
      message:
        "Invalid submit should open Advanced Settings when a hidden advanced field has a validation error.",
    },
    {
      name: "advanced-settings-runtime-smoke-covered",
      ok:
        /opens Advanced Settings when a hidden advanced field is invalid/.test(
          smokeText,
        ) &&
        /Remark must be less than 255 characters/.test(smokeText) &&
        /request\.method === "POST" && request\.pathname === "\/api\/channel"/.test(
          smokeText,
        ),
      message:
        "Channel specialist smoke should prove hidden advanced validation errors are surfaced before update.",
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
  const report = auditChannelProviderValidation();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
