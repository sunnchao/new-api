import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const channelsColumnsPath = path.join(
  nextRoot,
  "src/features/channels/components/channels-columns.tsx",
);
const channelDialogsPath = path.join(
  nextRoot,
  "src/features/channels/components/channels-dialogs.tsx",
);
const channelDrawerPath = path.join(
  nextRoot,
  "src/features/channels/components/drawers/channel-mutate-drawer.tsx",
);
const channelProviderPath = path.join(
  nextRoot,
  "src/features/channels/components/channels-provider.tsx",
);
const channelPrimaryButtonsPath = path.join(
  nextRoot,
  "src/features/channels/components/channels-primary-buttons.tsx",
);
const channelRowActionsPath = path.join(
  nextRoot,
  "src/features/channels/components/data-table-row-actions.tsx",
);
const channelTagRowActionsPath = path.join(
  nextRoot,
  "src/features/channels/components/data-table-tag-row-actions.tsx",
);
const channelTestDialogPath = path.join(
  nextRoot,
  "src/features/channels/components/dialogs/channel-test-dialog.tsx",
);
const fetchModelsDialogPath = path.join(
  nextRoot,
  "src/features/channels/components/dialogs/fetch-models-dialog.tsx",
);
const modelMappingEditorPath = path.join(
  nextRoot,
  "src/features/channels/components/model-mapping-editor.tsx",
);
const channelApiPath = path.join(nextRoot, "src/features/channels/api.ts");
const channelFormPath = path.join(
  nextRoot,
  "src/features/channels/lib/channel-form.ts",
);
const channelUpstreamUpdatesPath = path.join(
  nextRoot,
  "src/features/channels/hooks/use-channel-upstream-updates.ts",
);
const channelSmokePath = path.join(
  nextRoot,
  "scripts/channel-specialist-smoke.spec.js",
);

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function auditChannelDeploymentLinks() {
  const columnsText = readSource(channelsColumnsPath);
  const dialogsText = readSource(channelDialogsPath);
  const drawerText = readSource(channelDrawerPath);
  const providerText = readSource(channelProviderPath);
  const primaryButtonsText = readSource(channelPrimaryButtonsPath);
  const rowActionsText = readSource(channelRowActionsPath);
  const tagRowActionsText = readSource(channelTagRowActionsPath);
  const testDialogText = readSource(channelTestDialogPath);
  const fetchModelsDialogText = readSource(fetchModelsDialogPath);
  const modelMappingEditorText = readSource(modelMappingEditorPath);
  const apiText = readSource(channelApiPath);
  const formText = readSource(channelFormPath);
  const upstreamUpdatesText = readSource(channelUpstreamUpdatesPath);
  const channelSmokeText = readSource(channelSmokePath);

  const checks = [
    {
      name: "ionet-link-uses-next-deployments-route",
      ok: /\/models\/deployments\?dFilter=/.test(columnsText),
      message:
        "IO.NET channel deployment links should open the Next deployments page with dFilter.",
    },
    {
      name: "ionet-link-encodes-deployment-id",
      ok: /encodeURIComponent\(String\(deploymentId\)\)/.test(columnsText),
      message:
        "IO.NET channel deployment links should URL-encode the deployment id.",
    },
    {
      name: "ionet-link-avoids-legacy-console-deployment",
      ok: !/\/console\/deployment\?deployment_id=/.test(columnsText),
      message:
        "IO.NET channel deployment links should not point to the legacy console route.",
    },
    {
      name: "codex-oauth-dialog-wired",
      ok:
        /CodexOAuthDialog/.test(drawerText) &&
        /setCodexOAuthDialogOpen\(true\)/.test(drawerText) &&
        /onKeyGenerated/.test(drawerText) &&
        /startCodexOAuth/.test(apiText) &&
        /completeCodexOAuth/.test(apiText) &&
        /refreshCodexCredential/.test(apiText),
      message:
        "Codex channels should expose OAuth authorization, insert the generated key, and support credential refresh.",
    },
    {
      name: "codex-usage-dialog-wired",
      ok:
        /getCodexUsage/.test(columnsText) &&
        /CodexUsageDialog/.test(columnsText) &&
        /channel\.type === 57/.test(columnsText) &&
        /\/api\/channel\/\$\{channelId\}\/codex\/usage/.test(apiText),
      message:
        "Codex channels should show account/usage details through the Codex usage dialog.",
    },
    {
      name: "multi-key-management-wired",
      ok:
        /multi-key-manage/.test(providerText) &&
        /MultiKeyManageDialog/.test(dialogsText) &&
        /setOpen\('multi-key-manage'\)/.test(rowActionsText) &&
        /isMultiKeyChannel/.test(rowActionsText) &&
        /manageMultiKeys/.test(apiText) &&
        /enableMultiKey/.test(apiText) &&
        /deleteDisabledMultiKeys/.test(apiText),
      message:
        "Multi-key channels should expose key management actions and multi-key API operations.",
    },
    {
      name: "param-override-editor-wired",
      ok:
        /ParamOverrideEditorDialog/.test(drawerText) &&
        /setParamOverrideEditorOpen\(true\)/.test(drawerText) &&
        /name='param_override'/.test(drawerText) &&
        /form\.setValue\('param_override'/.test(drawerText) &&
        /param_override:/.test(formText),
      message:
        "Channel parameter overrides should have the visual editor and persist through the channel form payload.",
    },
    {
      name: "status-code-risk-dialog-wired",
      ok:
        /StatusCodeRiskDialog/.test(drawerText) &&
        /collectInvalidStatusCodeEntries/.test(drawerText) &&
        /collectNewDisallowedStatusCodeRedirects/.test(drawerText) &&
        /confirmStatusCodeRisk/.test(drawerText) &&
        /name='status_code_mapping'/.test(drawerText) &&
        /status_code_mapping:/.test(formText),
      message:
        "Status-code mappings should be editable and guarded by the risk confirmation dialog.",
    },
    {
      name: "ollama-models-dialog-wired",
      ok:
        /ollama-models/.test(providerText) &&
        /OllamaModelsDialog/.test(dialogsText) &&
        /channel\.type === 4/.test(rowActionsText) &&
        /setOpen\('ollama-models'\)/.test(rowActionsText) &&
        /deleteOllamaModel/.test(apiText) &&
        /getOllamaVersion/.test(apiText),
      message:
        "Ollama channels should expose model management and the Ollama model APIs.",
    },
    {
      name: "tag-batch-edit-wired",
      ok:
        /tag-batch-edit/.test(providerText) &&
        /TagBatchEditDialog/.test(dialogsText) &&
        /setOpen\('tag-batch-edit'\)/.test(tagRowActionsText) &&
        /editTagChannels/.test(apiText) &&
        /getTagModels/.test(apiText),
      message:
        "Tag aggregate rows should expose batch edit flows backed by tag APIs.",
    },
    {
      name: "upstream-update-actions-wired",
      ok:
        /useChannelUpstreamUpdates/.test(providerText) &&
        /UpstreamUpdateDialog/.test(dialogsText) &&
        /upstream\.detectAllUpdates\(\)/.test(primaryButtonsText) &&
        /upstream\.applyAllUpdates\(\)/.test(primaryButtonsText) &&
        /upstream\.detectChannelUpdates\(channel\)/.test(rowActionsText) &&
        /\/api\/channel\/upstream_updates\/detect/.test(upstreamUpdatesText) &&
        /\/api\/channel\/upstream_updates\/apply/.test(upstreamUpdatesText),
      message:
        "Channels should support per-channel and batch upstream model update detection/application.",
    },
    {
      name: "single-model-channel-test-wired",
      ok:
        /testSingleModel/.test(testDialogText) &&
        /handleBatchTest/.test(testDialogText) &&
        /testModel:\s*model/.test(testDialogText) &&
        /endpointType:/.test(testDialogText) &&
        /stream:/.test(testDialogText),
      message:
        "Channel tests should support per-model and selected-model testing with endpoint and stream options.",
    },
    {
      name: "create-mode-fetch-models-dialog-supported",
      ok:
        /customFetcher\?:\s*\(\)\s*=>\s*Promise<string\[]>/.test(
          fetchModelsDialogText,
        ) &&
        /existingModelsOverride\?:\s*string\[]/.test(fetchModelsDialogText) &&
        /channelName\?:\s*string\s*\|\s*null/.test(fetchModelsDialogText) &&
        /activeChannel\s*=\s*customFetcher\s*\?\s*null\s*:\s*currentRow/.test(
          fetchModelsDialogText,
        ),
      message:
        "FetchModelsDialog should support create mode with a custom upstream fetcher and form-local existing models.",
    },
    {
      name: "create-mode-fetch-models-opens-selectable-dialog",
      ok:
        /const createModeFetcher = useCallback/.test(drawerText) &&
        /customFetcher=\{!isEditing \? createModeFetcher : undefined\}/.test(
          drawerText,
        ) &&
        /existingModelsOverride=\{[\s\S]*!isEditing[\s\S]*parseModelsString\(form\.getValues\('models'\)/.test(
          drawerText,
        ) &&
        !/For creation mode, fetch and fill all models/.test(drawerText),
      message:
        "Creating a channel should open the same selectable Fetch Models dialog instead of immediately appending every fetched model.",
    },
    {
      name: "model-mapping-editor-exposes-model-datalists",
      ok:
        /sourceModelOptions\?:\s*string\[]/.test(modelMappingEditorText) &&
        /targetModelOptions\?:\s*string\[]/.test(modelMappingEditorText) &&
        /useId/.test(modelMappingEditorText) &&
        /<datalist id=\{sourceListId\}>/.test(modelMappingEditorText) &&
        /<datalist id=\{targetListId\}>/.test(modelMappingEditorText),
      message:
        "Model mapping visual inputs should expose datalist suggestions for source and target model values.",
    },
    {
      name: "channel-drawer-passes-model-mapping-options",
      ok:
        /sourceModelOptions=\{currentModelsArray\}/.test(drawerText) &&
        /targetModelOptions=\{modelOptions\.map\(\s*\(option\)\s*=>\s*option\.value\s*\)\}/.test(
          drawerText,
        ),
      message:
        "Channel mutate drawer should pass current source models and provider target model options into ModelMappingEditor.",
    },
    {
      name: "model-mapping-options-runtime-smoke-covered",
      ok:
        /suggests source and target models in the mapping editor/.test(
          channelSmokeText,
        ) &&
        /input\[placeholder="gpt-3\.5-turbo"\]/.test(channelSmokeText) &&
        /input\[placeholder="gpt-3\.5-turbo-0125"\]/.test(channelSmokeText) &&
        /claude-3-7-sonnet-smoke/.test(channelSmokeText),
      message:
        "Channel specialist smoke should prove model mapping inputs expose source and target datalist suggestions.",
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
  const report = auditChannelDeploymentLinks();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
