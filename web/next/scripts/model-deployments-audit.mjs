import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

const sources = {
  api: "src/features/models/api.ts",
  modelsPage: "src/app/(app)/models/page.tsx",
  modelsSectionPage: "src/app/(app)/models/[section]/page.tsx",
  modelsIndex: "src/features/models/index.tsx",
  sectionRegistry: "src/features/models/section-registry.tsx",
  settingsHook: "src/features/models/hooks/use-model-deployment-settings.ts",
  accessGuard: "src/features/models/components/deployment-access-guard.tsx",
  table: "src/features/models/components/deployments-table.tsx",
  columns: "src/features/models/components/deployments-columns.tsx",
  createDrawer:
    "src/features/models/components/dialogs/create-deployment-drawer.tsx",
  updateDialog:
    "src/features/models/components/dialogs/update-config-dialog.tsx",
  extendDialog:
    "src/features/models/components/dialogs/extend-deployment-dialog.tsx",
  renameDialog:
    "src/features/models/components/dialogs/rename-deployment-dialog.tsx",
  detailsDialog:
    "src/features/models/components/dialogs/view-details-dialog.tsx",
  logsDialog: "src/features/models/components/dialogs/view-logs-dialog.tsx",
};

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

export function auditModelDeployments() {
  const api = readSource(sources.api);
  const modelsPage = readSource(sources.modelsPage);
  const modelsSectionPage = readSource(sources.modelsSectionPage);
  const modelsIndex = readSource(sources.modelsIndex);
  const sectionRegistry = readSource(sources.sectionRegistry);
  const settingsHook = readSource(sources.settingsHook);
  const accessGuard = readSource(sources.accessGuard);
  const table = readSource(sources.table);
  const columns = readSource(sources.columns);
  const createDrawer = readSource(sources.createDrawer);
  const updateDialog = readSource(sources.updateDialog);
  const extendDialog = readSource(sources.extendDialog);
  const renameDialog = readSource(sources.renameDialog);
  const detailsDialog = readSource(sources.detailsDialog);
  const logsDialog = readSource(sources.logsDialog);

  const checks = [
    {
      name: "models-routes-canonicalize-root-and-render-section",
      ok:
        /import \{ redirect \} from ["']next\/navigation["']/.test(
          modelsPage
        ) &&
        /import \{ MODELS_DEFAULT_SECTION \} from ["']@\/features\/models\/section-registry["']/.test(
          modelsPage
        ) &&
        /redirect\(`\/models\/\$\{MODELS_DEFAULT_SECTION\}`\)/.test(
          modelsPage
        ) &&
        /import \{ Models \} from ["']@\/features\/models["']/.test(
          modelsSectionPage
        ) &&
        /<Models\s*\/>/.test(modelsSectionPage),
      message:
        "/models should canonicalize to the default section, while /models/[section] renders the Next models feature.",
    },
    {
      name: "deployment-section-tab-wired",
      ok:
        /id:\s*['"]deployments['"]/.test(sectionRegistry) &&
        /basePath:\s*['"]\/models['"]/.test(sectionRegistry) &&
        /MODELS_SECTION_IDS\.map/.test(modelsIndex) &&
        /router\.push\(`\/models\/\$\{section as ModelsSectionId\}`\)/.test(
          modelsIndex
        ) &&
        /activeSection === ['"]deployments['"]/.test(modelsIndex) &&
        /<DeploymentsTable\s*\/>/.test(modelsIndex),
      message:
        "Models should expose a /models/deployments section tab that renders the deployments table.",
    },
    {
      name: "deployment-settings-access-guard-wired",
      ok:
        /useModelDeploymentSettings/.test(modelsIndex) &&
        /refreshDeploymentSettings\(\)/.test(modelsIndex) &&
        /<DeploymentAccessGuard/.test(modelsIndex) &&
        /isEnabled=\{isIoNetEnabled\}/.test(modelsIndex) &&
        /connectionOk=\{connectionOk\}/.test(modelsIndex) &&
        /onRetry=\{testConnection\}/.test(modelsIndex) &&
        /getDeploymentSettings/.test(settingsHook) &&
        /testDeploymentConnection/.test(settingsHook) &&
        /\/api\/deployments\/settings/.test(api) &&
        /\/api\/deployments\/settings\/test-connection/.test(api) &&
        /router\.push\(['"]\/system-settings\/models\/model-deployment['"]\)/.test(
          accessGuard
        ),
      message:
        "Deployments should be gated by io.net enablement and connection checks with a settings fallback.",
    },
    {
      name: "deployment-list-search-status-filter-wired",
      ok:
        /listDeployments/.test(table) &&
        /searchDeployments/.test(table) &&
        /deploymentsQueryKeys\.list/.test(table) &&
        /dPage/.test(table) &&
        /dPageSize/.test(table) &&
        /dFilter/.test(table) &&
        /dStatus/.test(table) &&
        /getDeploymentStatusOptions/.test(table) &&
        /manualPagination:\s*true/.test(table) &&
        /manualFiltering:\s*true/.test(table) &&
        /api\.get\(['"]\/api\/deployments\/['"]/.test(api) &&
        /api\.get\(['"]\/api\/deployments\/search['"]/.test(api),
      message:
        "Deployment list should support paginated list/search with status and URL-state filters.",
    },
    {
      name: "deployment-create-flow-wired",
      ok:
        /setCreateDeploymentOpen\(true\)/.test(modelsIndex) &&
        /<CreateDeploymentDrawer/.test(modelsIndex) &&
        /createDeployment/.test(createDrawer) &&
        /getHardwareTypes/.test(createDrawer) &&
        /getAvailableReplicas/.test(createDrawer) &&
        /estimatePrice/.test(createDrawer) &&
        /checkClusterNameAvailability/.test(createDrawer) &&
        /secret_env_variables/.test(createDrawer) &&
        /registry_secret/.test(createDrawer) &&
        /container_config/.test(createDrawer) &&
        /registry_config/.test(createDrawer) &&
        /api\.post\(['"]\/api\/deployments\/['"]/.test(api) &&
        /\/api\/deployments\/hardware-types/.test(api) &&
        /\/api\/deployments\/available-replicas/.test(api) &&
        /\/api\/deployments\/price-estimation/.test(api) &&
        /\/api\/deployments\/check-name/.test(api),
      message:
        "Create deployment should collect hardware/location/price/name/secret config and post to the deployment API.",
    },
    {
      name: "deployment-row-actions-open-dialogs",
      ok:
        /onViewLogs/.test(columns) &&
        /onViewDetails/.test(columns) &&
        /onUpdateConfig/.test(columns) &&
        /onExtend/.test(columns) &&
        /onRename/.test(columns) &&
        /onDelete/.test(columns) &&
        /setLogsOpen\(true\)/.test(table) &&
        /setDetailsOpen\(true\)/.test(table) &&
        /setUpdateOpen\(true\)/.test(table) &&
        /setExtendOpen\(true\)/.test(table) &&
        /setRenameOpen\(true\)/.test(table) &&
        /setDeleteOpen\(true\)/.test(table) &&
        /ViewLogsDialog/.test(table) &&
        /ViewDetailsDialog/.test(table) &&
        /UpdateConfigDialog/.test(table) &&
        /ExtendDeploymentDialog/.test(table) &&
        /RenameDeploymentDialog/.test(table),
      message:
        "Deployment row actions should open logs/details/config/extend/rename/delete flows.",
    },
    {
      name: "deployment-update-rename-extend-delete-wired",
      ok:
        /updateDeployment\(deploymentId/.test(updateDialog) &&
        /normalizeJsonObject/.test(updateDialog) &&
        /secret_env_variables/.test(updateDialog) &&
        /registry_secret/.test(updateDialog) &&
        /updateDeploymentName\(deploymentId,\s*trimmed\)/.test(renameDialog) &&
        /checkClusterNameAvailability\(trimmed\)/.test(renameDialog) &&
        /extendDeployment\(deploymentId,\s*h\)/.test(extendDialog) &&
        /estimatePrice/.test(extendDialog) &&
        /deleteDeployment\(deleteTarget\.id\)/.test(table) &&
        /api\.put\(`\/api\/deployments\/\$\{id\}`/.test(api) &&
        /api\.put\(`\/api\/deployments\/\$\{id\}\/name`/.test(api) &&
        /api\.post\(`\/api\/deployments\/\$\{id\}\/extend`/.test(api) &&
        /api\.delete\(`\/api\/deployments\/\$\{id\}`/.test(api),
      message:
        "Deployments should support update configuration, rename, extend duration, and delete API flows.",
    },
    {
      name: "deployment-details-and-status-wired",
      ok:
        /getDeployment\(deploymentId\)/.test(detailsDialog) &&
        /listDeploymentContainers\(deploymentId\)/.test(detailsDialog) &&
        /details\?\.status/.test(detailsDialog) &&
        /containers\.length/.test(detailsDialog) &&
        /Raw JSON/.test(detailsDialog) &&
        /getDeploymentStatusConfig/.test(columns) &&
        /normalizeDeploymentStatus/.test(columns) &&
        /completed_percent/.test(columns) &&
        /compute_minutes_remaining/.test(columns) &&
        /api\.get\(`\/api\/deployments\/\$\{id\}`/.test(api) &&
        /api\.get\(`\/api\/deployments\/\$\{deploymentId\}\/containers`/.test(
          api
        ),
      message:
        "Deployment details should show status/container metadata, and table status should be normalized.",
    },
    {
      name: "deployment-logs-flow-wired",
      ok:
        /listDeploymentContainers\(deploymentId\)/.test(logsDialog) &&
        /getDeploymentLogs\(deploymentId/.test(logsDialog) &&
        /container_id:\s*containerId/.test(logsDialog) &&
        /stream/.test(logsDialog) &&
        /autoRefresh/.test(logsDialog) &&
        /handleDownload/.test(logsDialog) &&
        /api\.get\(`\/api\/deployments\/\$\{deploymentId\}\/logs`/.test(api),
      message:
        "Deployment logs should select a container, support stream/refresh/download, and call the logs API.",
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
  const report = auditModelDeployments();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
