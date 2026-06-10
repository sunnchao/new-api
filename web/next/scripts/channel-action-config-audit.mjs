import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const apiPath = path.join(nextRoot, "src/features/channels/api.ts");
const upstreamUpdatesPath = path.join(
  nextRoot,
  "src/features/channels/hooks/use-channel-upstream-updates.ts",
);
const channelDrawerPath = path.join(
  nextRoot,
  "src/features/channels/components/drawers/channel-mutate-drawer.tsx",
);

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function getFunctionBody(source, name) {
  const marker = `export async function ${name}`;
  const start = source.indexOf(marker);
  if (start === -1) return "";

  const nextExport = source.indexOf("\nexport async function ", start + marker.length);
  return nextExport === -1 ? source.slice(start) : source.slice(start, nextExport);
}

function hasActionConfig(body, endpointPattern) {
  return (
    endpointPattern.test(body) &&
    /channelActionConfig\(/.test(body)
  );
}

export function auditChannelActionConfig() {
  const api = readSource(apiPath);
  const upstreamUpdates = readSource(upstreamUpdatesPath);
  const channelDrawer = readSource(channelDrawerPath);
  const checks = [
    {
      name: "channel-action-config-helper-sets-skip-flags",
      ok:
        /channelActionConfig/.test(api) &&
        /skipBusinessError:\s*true/.test(api) &&
        /skipErrorHandler:\s*true/.test(api),
      message:
        "Channel action helpers should opt out of global business and HTTP error handlers so local channel handlers own error messages.",
    },
    {
      name: "channel-crud-actions-use-action-config",
      ok:
        hasActionConfig(getFunctionBody(api, "createChannel"), /\/api\/channel/) &&
        hasActionConfig(getFunctionBody(api, "updateChannel"), /\/api\/channel\//) &&
        hasActionConfig(getFunctionBody(api, "deleteChannel"), /\/api\/channel\/\$\{id\}/) &&
        hasActionConfig(getFunctionBody(api, "batchDeleteChannels"), /\/api\/channel\/batch/) &&
        hasActionConfig(getFunctionBody(api, "batchSetChannelTag"), /\/api\/channel\/batch\/tag/),
      message:
        "Create, update, delete, batch-delete, and batch-tag channel mutations should use channelActionConfig.",
    },
    {
      name: "channel-runtime-actions-use-action-config",
      ok:
        hasActionConfig(getFunctionBody(api, "testChannel"), /\/api\/channel\/test\/\$\{id\}/) &&
        hasActionConfig(getFunctionBody(api, "updateChannelBalance"), /\/api\/channel\/update_balance\/\$\{id\}/) &&
        hasActionConfig(getFunctionBody(api, "fetchUpstreamModels"), /\/api\/channel\/fetch_models\/\$\{id\}/) &&
        hasActionConfig(getFunctionBody(api, "copyChannel"), /\/api\/channel\/copy\/\$\{id\}/) &&
        hasActionConfig(getFunctionBody(api, "fixChannelAbilities"), /\/api\/channel\/fix/) &&
        hasActionConfig(getFunctionBody(api, "deleteDisabledChannels"), /\/api\/channel\/disabled/) &&
        hasActionConfig(getFunctionBody(api, "getChannelKey"), /\/api\/channel\/\$\{id\}\/key/),
      message:
        "Channel test, balance, fetch-models, copy, fix, disabled-delete, and key reveal actions should use channelActionConfig.",
    },
    {
      name: "channel-specialist-actions-use-action-config",
      ok:
        hasActionConfig(getFunctionBody(api, "startCodexOAuth"), /\/api\/channel\/codex\/oauth\/start/) &&
        hasActionConfig(getFunctionBody(api, "completeCodexOAuth"), /\/api\/channel\/codex\/oauth\/complete/) &&
        hasActionConfig(getFunctionBody(api, "refreshCodexCredential"), /\/api\/channel\/\$\{channelId\}\/codex\/refresh/) &&
        hasActionConfig(getFunctionBody(api, "getCodexUsage"), /\/api\/channel\/\$\{channelId\}\/codex\/usage/) &&
        hasActionConfig(getFunctionBody(api, "manageMultiKeys"), /\/api\/channel\/multi_key\/manage/) &&
        hasActionConfig(getFunctionBody(api, "enableTagChannels"), /\/api\/channel\/tag\/enabled/) &&
        hasActionConfig(getFunctionBody(api, "disableTagChannels"), /\/api\/channel\/tag\/disabled/) &&
        hasActionConfig(getFunctionBody(api, "editTagChannels"), /\/api\/channel\/tag/) &&
        hasActionConfig(getFunctionBody(api, "fetchModels"), /\/api\/channel\/fetch_models/) &&
        hasActionConfig(getFunctionBody(api, "deleteOllamaModel"), /\/api\/channel\/ollama\/delete/) &&
        hasActionConfig(getFunctionBody(api, "testAllChannels"), /\/api\/channel\/test/) &&
        hasActionConfig(getFunctionBody(api, "updateAllChannelsBalance"), /\/api\/channel\/update_balance/),
      message:
        "Specialist channel actions should use the same local-error-handling config as default.",
    },
    {
      name: "channel-upstream-update-actions-skip-global-errors",
      ok:
        /upstreamUpdateRequestConfig/.test(upstreamUpdates) &&
        /skipBusinessError:\s*true/.test(upstreamUpdates) &&
        /skipErrorHandler:\s*true/.test(upstreamUpdates) &&
        /\/api\/channel\/upstream_updates\/apply[\s\S]*upstreamUpdateRequestConfig/.test(
          upstreamUpdates,
        ) &&
        /\/api\/channel\/upstream_updates\/apply_all[\s\S]*upstreamUpdateRequestConfig/.test(
          upstreamUpdates,
        ) &&
        /\/api\/channel\/upstream_updates\/detect[\s\S]*upstreamUpdateRequestConfig/.test(
          upstreamUpdates,
        ) &&
        /\/api\/channel\/upstream_updates\/detect_all[\s\S]*upstreamUpdateRequestConfig/.test(
          upstreamUpdates,
        ),
      message:
        "Upstream update actions call channel APIs directly and must skip global business/HTTP errors while preserving local toast handling.",
    },
    {
      name: "channel-create-update-surface-business-failures",
      ok:
        /const response = await updateChannel[\s\S]*if \(!response\.success\)[\s\S]*throw new Error/.test(
          channelDrawer,
        ) &&
        /const response = await createChannel[\s\S]*if \(!response\.success\)[\s\S]*throw new Error/.test(
          channelDrawer,
        ),
      message:
        "Channel create/update submit logic should surface success:false responses locally now that API wrappers skip global business toasts.",
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
  const report = auditChannelActionConfig();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
