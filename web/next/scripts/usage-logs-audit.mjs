import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "../src");

function readSource(relativePath, warnings) {
  const fullPath = path.join(nextRoot, relativePath);
  try {
    return fs.readFileSync(fullPath, "utf8");
  } catch (error) {
    warnings.push({
      type: "read-file",
      path: fullPath,
      message: error.message,
    });
    return "";
  }
}

function readScript(relativePath, warnings) {
  const fullPath = path.join(scriptDir, relativePath);
  try {
    return fs.readFileSync(fullPath, "utf8");
  } catch (error) {
    warnings.push({
      type: "read-file",
      path: fullPath,
      message: error.message,
    });
    return "";
  }
}

export function auditUsageLogs() {
  const warnings = [];
  const failures = [];
  const typesSource = readSource("features/usage-logs/types.ts", warnings);
  const taskColumnsSource = readSource(
    "features/usage-logs/components/columns/task-logs-columns.tsx",
    warnings
  );
  const commonColumnsSource = readSource(
    "features/usage-logs/components/columns/common-logs-columns.tsx",
    warnings
  );
  const tableSource = readSource(
    "features/usage-logs/components/usage-logs-table.tsx",
    warnings
  );
  const formatSource = readSource("features/usage-logs/lib/format.ts", warnings);
  const detailsDialogSource = readSource(
    "features/usage-logs/components/dialogs/details-dialog.tsx",
    warnings
  );
  const mobileCardSource = readSource(
    "features/usage-logs/components/usage-logs-mobile-card.tsx",
    warnings
  );
  const logsFilterToolbarSource = readSource(
    "features/usage-logs/components/logs-filter-toolbar.tsx",
    warnings
  );
  const commonFilterBarSource = readSource(
    "features/usage-logs/components/common-logs-filter-bar.tsx",
    warnings
  );
  const taskFilterBarSource = readSource(
    "features/usage-logs/components/task-logs-filter-bar.tsx",
    warnings
  );
  const cacheStatsDialogSource = readSource(
    "features/system-settings/general/channel-affinity/cache-stats-dialog.tsx",
    warnings
  );
  const usageLogsSmokeSource = readScript("usage-logs-smoke.spec.js", warnings);

  if (!/result_url\??:\s*string/.test(typesSource)) {
    failures.push({
      id: "usage-logs-task-result-url-type",
      message: "TaskLog type should expose optional result_url.",
    });
  }

  if (!/log\.result_url\?\.trim\(\)/.test(taskColumnsSource)) {
    failures.push({
      id: "usage-logs-task-result-url-preview",
      message: "Task video details should trim and prefer log.result_url for previews.",
    });
  }

  if (!/startsWith\(['"]\/['"]\)/.test(taskColumnsSource)) {
    failures.push({
      id: "usage-logs-task-result-url-relative-preview",
      message: "Task video details should accept relative result_url preview paths.",
    });
  }

  if (!/failReason\?\.startsWith\(['"]http/.test(taskColumnsSource)) {
    failures.push({
      id: "usage-logs-task-fail-reason-url-fallback",
      message: "Task video details should retain fail_reason URL fallback.",
    });
  }

  if (
    !/REQUEST_RULE_ACTION_FIXED/.test(formatSource) ||
    !/splitBillingExprAndRequestRules/.test(formatSource) ||
    !/tryParseRequestRuleExpr/.test(formatSource) ||
    !/export function getMatchedFixedRequestRule/.test(formatSource) ||
    !/request_fixed_/.test(formatSource)
  ) {
    failures.push({
      id: "usage-logs-fixed-request-rule-parser",
      message:
        "Usage logs should resolve tiered_expr request_fixed_N matches from encoded request rules.",
    });
  }

  if (
    !/getMatchedFixedRequestRule/.test(commonColumnsSource) ||
    !/matchedFixedRequestRule/.test(commonColumnsSource) ||
    !/Fixed price/.test(commonColumnsSource) ||
    !/\/\$\{t\(['"]request['"]\)\}/.test(commonColumnsSource)
  ) {
    failures.push({
      id: "usage-logs-table-fixed-request-rule-display",
      message:
        "Common log table details should show fixed per-request pricing when a request rule matches.",
    });
  }

  if (
    !/getMatchedFixedRequestRule/.test(detailsDialogSource) ||
    !/matchedFixedRequestRule/.test(detailsDialogSource) ||
    !/label:\s*t\(['"]Rule['"]\)/.test(detailsDialogSource) ||
    !/label:\s*t\(['"]Fixed price['"]\)/.test(detailsDialogSource) ||
    !/\/\$\{t\(['"]request['"]\)\}/.test(detailsDialogSource)
  ) {
    failures.push({
      id: "usage-logs-dialog-fixed-request-rule-display",
      message:
        "Usage log details dialog should show the matched request-rule number and fixed request price.",
    });
  }

  if (!/manualFiltering:\s*true/.test(tableSource)) {
    failures.push({
      id: "usage-logs-table-manual-filtering",
      message: "Usage logs table should use manualFiltering with server filters.",
    });
  }

  if (
    !/export function UsageLogsMobileList/.test(mobileCardSource) ||
    !/function CommonLogsCard/.test(mobileCardSource) ||
    !/function TaskLogsCard/.test(mobileCardSource) ||
    !/function DrawingLogsCard/.test(mobileCardSource)
  ) {
    failures.push({
      id: "usage-logs-mobile-card-list",
      message:
        "Usage logs should provide dedicated compact mobile cards for common, task, and drawing logs.",
    });
  }

  if (
    !/UsageLogsMobileList/.test(tableSource) ||
    !/mobile=\{\s*<UsageLogsMobileList[\s\S]*logCategory=\{logCategory\}/.test(
      tableSource
    )
  ) {
    failures.push({
      id: "usage-logs-table-mobile-card-list",
      message:
        "Usage logs table should render UsageLogsMobileList through DataTablePage.mobile.",
    });
  }

  if (
    !/export function LogsFilterToolbar/.test(logsFilterToolbarSource) ||
    !/DrawerContent/.test(logsFilterToolbarSource) ||
    !/mobilePinnedFilters/.test(logsFilterToolbarSource) ||
    !/mobileFilters/.test(logsFilterToolbarSource) ||
    !/mobileFilterCount/.test(logsFilterToolbarSource)
  ) {
    failures.push({
      id: "usage-logs-mobile-filter-toolbar",
      message:
        "Usage logs should provide a dedicated filter toolbar with a mobile drawer for secondary filters.",
    });
  }

  if (
    !/LogsFilterToolbar/.test(commonFilterBarSource) ||
    /DataTableToolbar/.test(commonFilterBarSource) ||
    !/mobilePinnedFilters=\{dateRangeFilter\}/.test(commonFilterBarSource) ||
    !/mobileFilters=/.test(commonFilterBarSource) ||
    !/mobileFilterCount=/.test(commonFilterBarSource)
  ) {
    failures.push({
      id: "usage-logs-common-mobile-filter-drawer",
      message:
        "Common logs filters should use LogsFilterToolbar with date range pinned and secondary filters in the mobile drawer.",
    });
  }

  if (
    !/LogsFilterToolbar/.test(taskFilterBarSource) ||
    /DataTableToolbar/.test(taskFilterBarSource) ||
    !/mobilePinnedFilters=\{dateRangeFilter\}/.test(taskFilterBarSource) ||
    !/mobileFilters=/.test(taskFilterBarSource) ||
    !/mobileFilterCount=/.test(taskFilterBarSource)
  ) {
    failures.push({
      id: "usage-logs-task-mobile-filter-drawer",
      message:
        "Task and drawing log filters should use LogsFilterToolbar with mobile drawer filters.",
    });
  }

  if (
    !/cached_token_rate_mode/.test(cacheStatsDialogSource) ||
    !/formatCachedTokenRate/.test(cacheStatsDialogSource)
  ) {
    failures.push({
      id: "usage-logs-channel-affinity-cache-rate-mode",
      message:
        "Channel affinity usage cache dialog should display cached-token rates using the backend cached_token_rate_mode.",
    });
  }

  if (!/prompt_cache_hit_tokens/.test(cacheStatsDialogSource)) {
    failures.push({
      id: "usage-logs-channel-affinity-prompt-cache-hit-tokens",
      message:
        "Channel affinity usage cache dialog should expose prompt_cache_hit_tokens from the backend stats response.",
    });
  }

  if (
    !/opens channel affinity usage cache details with backend token-rate fields/.test(
      usageLogsSmokeSource
    ) ||
    !/\/api\/log\/channel_affinity_usage_cache/.test(usageLogsSmokeSource) ||
    !/Prompt cache hit tokens/.test(usageLogsSmokeSource)
  ) {
    failures.push({
      id: "usage-logs-channel-affinity-cache-runtime-smoke",
      message:
        "Usage logs runtime smoke should cover channel affinity cache details, request params, and prompt cache hit token display.",
    });
  }

  if (
    !/renders fixed request rule pricing in common log table and details/.test(
      usageLogsSmokeSource
    ) ||
    !/request_fixed_1/.test(usageLogsSmokeSource) ||
    !/Fixed price \$0\.125\/request/.test(usageLogsSmokeSource)
  ) {
    failures.push({
      id: "usage-logs-fixed-request-rule-runtime-smoke",
      message:
        "Usage logs runtime smoke should prove fixed request-rule pricing renders in the table and details dialog.",
    });
  }

  return {
    failureCount: failures.length,
    failures,
    warnings,
  };
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const report = auditUsageLogs();
  console.log(JSON.stringify(report, null, 2));
  if (
    process.argv.includes("--fail-on-gap") &&
    (report.failureCount > 0 || report.warnings.length > 0)
  ) {
    process.exitCode = 1;
  }
}
