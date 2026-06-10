import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const channelFormPath = path.join(
  nextRoot,
  "src/features/channels/lib/channel-form.ts",
);
const channelDrawerPath = path.join(
  nextRoot,
  "src/features/channels/components/drawers/channel-mutate-drawer.tsx",
);
const channelSmokePath = path.join(
  nextRoot,
  "scripts/channel-specialist-smoke.spec.js",
);

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function getUpdateTransform(source) {
  const marker = "export function transformFormDataToUpdatePayload";
  const start = source.indexOf(marker);
  if (start === -1) return "";

  const validationMarker = "\n// ============================================================================\n// Validation Helpers";
  const end = source.indexOf(validationMarker, start);
  return end === -1 ? source.slice(start) : source.slice(start, end);
}

function getCreateTransform(source) {
  const marker = "export function transformFormDataToCreatePayload";
  const start = source.indexOf(marker);
  if (start === -1) return "";

  const updateMarker = "\n/**\n * Transform form data to API payload for updating channel";
  const end = source.indexOf(updateMarker, start);
  return end === -1 ? source.slice(start) : source.slice(start, end);
}

export function auditChannelUpdatePayload() {
  const formText = readSource(channelFormPath);
  const drawerText = readSource(channelDrawerPath);
  const smokeText = readSource(channelSmokePath);
  const createTransform = getCreateTransform(formText);
  const updateTransform = getUpdateTransform(formText);

  const checks = [
    {
      name: "update-transform-present",
      ok: updateTransform.length > 0,
      message: "Channel update payload transform should be present.",
    },
    {
      name: "base-url-clear-preserved",
      ok:
        (/base_url:\s*formData\.base_url\s*\?\?\s*''/.test(
          updateTransform,
        ) ||
          /payload\.base_url\s*=\s*normalizeBaseUrl\(formData\.base_url\)\s*\|\|\s*''/.test(
            updateTransform,
          )) &&
        !/base_url:\s*formData\.base_url\s*\|\|\s*null/.test(updateTransform),
      message:
        "Editing a channel must send base_url as an explicit empty string when cleared.",
    },
    {
      name: "base-url-normalize-helper-present",
      ok:
        /function\s+normalizeBaseUrl\(value:\s*string\s*\|\s*undefined\):\s*string/.test(
          formText,
        ) &&
        /\.trim\(\)/.test(formText) &&
        /\.replace\(\s*\/\\\/\+\$\/\s*,\s*''\s*\)/.test(formText),
      message:
        "Channel payload transforms should trim non-empty base_url values and remove trailing slashes like web/default and web/classic.",
    },
    {
      name: "base-url-normalized-on-create",
      ok:
        /base_url:\s*normalizeBaseUrl\(formData\.base_url\)\s*\|\|\s*null/.test(
          createTransform,
        ) &&
        !/base_url:\s*formData\.base_url\s*\|\|\s*null/.test(createTransform),
      message:
        "Creating a channel should normalize non-empty base_url before sending it to the backend.",
    },
    {
      name: "base-url-normalized-on-update",
      ok:
        /payload\.base_url\s*=\s*normalizeBaseUrl\(formData\.base_url\)\s*\|\|\s*''/.test(
          updateTransform,
        ) &&
        !/base_url:\s*formData\.base_url\s*\?\?\s*''/.test(updateTransform),
      message:
        "Editing a channel should normalize non-empty base_url while preserving explicit empty-string clears.",
    },
    {
      name: "organization-clear-preserved",
      ok:
        /openai_organization:\s*formData\.openai_organization\s*\?\?\s*''/.test(
          updateTransform,
        ) &&
        !/openai_organization:\s*formData\.openai_organization\s*\|\|\s*null/.test(
          updateTransform,
        ),
      message:
        "Editing a channel must send openai_organization as an explicit empty string when cleared.",
    },
    {
      name: "priority-zero-preserved",
      ok:
        /priority:\s*formData\.priority\s*\?\?\s*0/.test(updateTransform) &&
        !/priority:\s*formData\.priority\s*\|\|\s*null/.test(updateTransform),
      message:
        "Editing a channel must send priority 0 explicitly instead of null.",
    },
    {
      name: "weight-zero-preserved",
      ok:
        /weight:\s*formData\.weight\s*\?\?\s*0/.test(updateTransform) &&
        !/weight:\s*formData\.weight\s*\|\|\s*null/.test(updateTransform),
      message:
        "Editing a channel must send weight 0 explicitly instead of null.",
    },
    {
      name: "test-model-clear-preserved",
      ok:
        /test_model:\s*formData\.test_model\s*\?\?\s*''/.test(
          updateTransform,
        ) &&
        !/test_model:\s*formData\.test_model\s*\|\|\s*null/.test(
          updateTransform,
        ),
      message:
        "Editing a channel must send test_model as an explicit empty string when cleared.",
    },
    {
      name: "tag-clear-preserved",
      ok:
        /tag:\s*formData\.tag\s*\?\?\s*''/.test(updateTransform) &&
        !/tag:\s*formData\.tag\s*\|\|\s*null/.test(updateTransform),
      message:
        "Editing a channel must send tag as an explicit empty string when cleared.",
    },
    {
      name: "remark-clear-preserved",
      ok: /remark:\s*formData\.remark\s*\?\?\s*''/.test(updateTransform),
      message:
        "Editing a channel must send remark as an explicit empty string when cleared.",
    },
    {
      name: "update-transform-does-not-null-empty-strings",
      ok: !/payload\[key as keyof typeof payload\]\s*===\s*''/.test(
        updateTransform,
      ),
      message:
        "The update payload transform should not convert empty strings to null after building clearable fields.",
    },
    {
      name: "pass-through-header-schema-default-and-hydration",
      ok:
        /pass_through_header_enabled:\s*z\.boolean\(\)\.optional\(\)/.test(
          formText,
        ) &&
        /pass_through_header_enabled:\s*false/.test(formText) &&
        /pass_through_header_enabled:\s*parsed\.pass_through_header_enabled\s*\|\|\s*false/.test(
          formText,
        ),
      message:
        "Channel form schema/defaults/hydration should preserve setting.pass_through_header_enabled like web/classic and the backend DTO.",
    },
    {
      name: "pass-through-header-setting-json-preserved",
      ok:
        /pass_through_header_enabled:\s*formData\.pass_through_header_enabled\s*\|\|\s*false/.test(
          formText,
        ) &&
        /setting:\s*buildSettingJSON\(formData\)/.test(updateTransform),
      message:
        "Create/update payloads should serialize pass_through_header_enabled inside setting JSON.",
    },
    {
      name: "pass-through-header-drawer-switch-rendered",
      ok:
        /name='pass_through_header_enabled'/.test(drawerText) &&
        /Pass Through Headers/.test(drawerText) &&
        /Pass request headers directly to upstream/.test(drawerText) &&
        /values\.pass_through_header_enabled/.test(drawerText),
      message:
        "Channel advanced settings should expose and auto-expand for a Pass Through Headers switch next to Pass Through Body.",
    },
    {
      name: "pass-through-header-runtime-smoke-covered",
      ok:
        /normalizes base_url while preserving pass-through header settings when editing a channel/.test(
          smokeText,
        ) &&
        /pass_through_header_enabled:\s*true/.test(smokeText) &&
        /Pass Through Headers/.test(smokeText),
      message:
        "Channel specialist smoke should prove edit/save preserves setting.pass_through_header_enabled.",
    },
    {
      name: "base-url-normalization-runtime-smoke-covered",
      ok:
        /normalizes base_url while preserving pass-through header settings when editing a channel/.test(
          smokeText,
        ) &&
        /base_url:\s*" https:\/\/pass-through\.example\.test\/\/\/ "/.test(
          smokeText,
        ) &&
        /base_url:\s*"https:\/\/pass-through\.example\.test"/.test(smokeText),
      message:
        "Channel specialist smoke should prove edit/save trims and removes trailing slashes from base_url.",
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
  const report = auditChannelUpdatePayload();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
