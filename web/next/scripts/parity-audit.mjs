import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditFeatureManifest } from "./feature-manifest-audit.mjs";
import { auditAdminPackages } from "./admin-packages-audit.mjs";
import { auditAdminRouteAccess } from "./admin-route-access-audit.mjs";
import { auditAdminTokensSearch } from "./admin-tokens-search-audit.mjs";
import { auditApiKeysSearch } from "./api-keys-search-audit.mjs";
import { auditChannelActionConfig } from "./channel-action-config-audit.mjs";
import { auditChannelDeploymentLinks } from "./channel-deployment-link-audit.mjs";
import { auditChannelDoubaoCodingPlan } from "./channel-doubao-coding-plan-audit.mjs";
import { auditChannelProviderValidation } from "./channel-provider-validation-audit.mjs";
import { auditChannelUpdatePayload } from "./channel-update-payload-audit.mjs";
import { auditCommandMenu } from "./command-menu-audit.mjs";
import { auditFeatureLocalI18n } from "./feature-local-i18n-audit.mjs";
import { auditInvoices } from "./invoices-audit.mjs";
import { auditLegacyNavigation } from "./legacy-navigation-audit.mjs";
import { auditLegacyRoutes } from "./legacy-route-audit.mjs";
import { auditModelDeployments } from "./model-deployments-audit.mjs";
import { auditNotificationCenter } from "./notification-center-audit.mjs";
import { auditProfileSecurity } from "./profile-security-audit.mjs";
import { auditRedemptionCodes } from "./redemption-codes-audit.mjs";
import { auditSidebarConfig } from "./sidebar-config-audit.mjs";
import { auditSubscriptionPurchase } from "./subscription-purchase-audit.mjs";
import { auditSubscriptionRenew } from "./subscription-renew-audit.mjs";
import { auditSystemSettings } from "./system-settings-audit.mjs";
import { auditTelegramOAuth } from "./telegram-oauth-audit.mjs";
import { auditShellControls } from "./shell-controls-audit.mjs";
import { auditTicketSearch } from "./ticket-search-audit.mjs";
import { auditThemeNextServing } from "./theme-next-serving-audit.mjs";
import { auditUsageLogs } from "./usage-logs-audit.mjs";
import { auditUsers } from "./users-audit.mjs";
import { auditVibeCodingAdmin } from "./vibecoding-admin-audit.mjs";
import { auditWaffoPancakeSettings } from "./waffo-pancake-settings-audit.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const defaultRoot = path.join(repoRoot, "web/default/src");
const nextRoot = path.join(repoRoot, "web/next/src");
const warnings = [];

function walk(dir) {
  const output = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    warnings.push({
      type: "read-directory",
      path: dir,
      message: error.message,
    });
    return output;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(full));
    else output.push(full);
  }
  return output;
}

function featureStats(root) {
  const features = path.join(root, "features");
  const rows = [];
  let entries;
  try {
    entries = fs.readdirSync(features, { withFileTypes: true });
  } catch (error) {
    warnings.push({
      type: "read-features-directory",
      path: features,
      message: error.message,
    });
    return rows;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const files = walk(path.join(features, entry.name));
    rows.push({
      feature: entry.name,
      files: files.length,
      api: files.filter((file) => /api\.ts$/.test(file)).length,
      tsx: files.filter((file) => file.endsWith(".tsx")).length,
    });
  }
  return rows.sort((a, b) => a.feature.localeCompare(b.feature));
}

function endpoints(root) {
  const regex = /(?:api|axios)\.(get|post|put|patch|delete)(?:<[\s\S]*?>)?\(\s*([`'"])([^`'"]+)/g;
  const map = new Map();
  for (const file of walk(root).filter((item) => /\.(ts|tsx)$/.test(item))) {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch (error) {
      warnings.push({
        type: "read-file",
        path: file,
        message: error.message,
      });
      continue;
    }
    let match;
    while ((match = regex.exec(text))) {
      const endpoint = match[3].split("?")[0];
      if (!endpoint.startsWith("/api") && !endpoint.startsWith("/v1")) continue;
      const key = `${match[1].toUpperCase()} ${endpoint}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(path.relative(root, file));
    }
  }
  return map;
}

const defaultFeatures = featureStats(defaultRoot);
const nextFeatures = featureStats(nextRoot);
const nextFeatureMap = new Map(nextFeatures.map((row) => [row.feature, row]));
const defaultEndpoints = endpoints(defaultRoot);
const nextEndpoints = endpoints(nextRoot);
const defaultEndpointParityExceptions = new Set([
  // web/default still calls this as GET, but backend router/controller and
  // web/classic bind WeChat with POST /api/oauth/wechat/bind and JSON { code }.
  "GET /api/oauth/wechat/bind",
]);
const featureManifest = auditFeatureManifest();
const adminPackages = auditAdminPackages();
const adminRouteAccess = auditAdminRouteAccess();
const adminTokensSearch = auditAdminTokensSearch();
const apiKeysSearch = auditApiKeysSearch();
const channelActionConfig = auditChannelActionConfig();
const channelDeploymentLinks = auditChannelDeploymentLinks();
const channelDoubaoCodingPlan = auditChannelDoubaoCodingPlan();
const channelProviderValidation = auditChannelProviderValidation();
const channelUpdatePayload = auditChannelUpdatePayload();
const commandMenu = auditCommandMenu();
const featureLocalI18n = auditFeatureLocalI18n();
const invoices = auditInvoices();
const legacyNavigation = auditLegacyNavigation();
const legacyRoutes = auditLegacyRoutes();
const modelDeployments = auditModelDeployments();
const notificationCenter = auditNotificationCenter();
const profileSecurity = auditProfileSecurity();
const redemptionCodes = auditRedemptionCodes();
const sidebarConfig = auditSidebarConfig();
const subscriptionPurchase = auditSubscriptionPurchase();
const subscriptionRenew = auditSubscriptionRenew();
const systemSettings = auditSystemSettings();
const telegramOAuth = auditTelegramOAuth();
const shellControls = auditShellControls();
const ticketSearch = auditTicketSearch();
const themeNextServing = auditThemeNextServing();
const usageLogs = auditUsageLogs();
const users = auditUsers();
const vibeCodingAdmin = auditVibeCodingAdmin();
const waffoPancakeSettings = auditWaffoPancakeSettings();

const missingFeatureModules = defaultFeatures.filter((row) => {
  const next = nextFeatureMap.get(row.feature);
  return !next || next.files === 0;
});

const missingEndpoints = [...defaultEndpoints.keys()]
  .filter((key) => !defaultEndpointParityExceptions.has(key))
  .filter((key) => !nextEndpoints.has(key))
  .sort();
const ignoredDefaultEndpointParityExceptions = [
  ...defaultEndpointParityExceptions,
].filter((key) => defaultEndpoints.has(key));

const report = {
  defaultFeatureCount: defaultFeatures.length,
  defaultFeatures,
  nextFeatureCount: nextFeatures.length,
  nextFeatures,
  missingFeatureModules,
  defaultEndpointCount: defaultEndpoints.size,
  nextEndpointCount: nextEndpoints.size,
  missingEndpointCount: missingEndpoints.length,
  missingEndpoints,
  ignoredDefaultEndpointParityExceptionCount:
    ignoredDefaultEndpointParityExceptions.length,
  ignoredDefaultEndpointParityExceptions,
  featureManifest,
  adminPackages,
  adminRouteAccess,
  adminTokensSearch,
  apiKeysSearch,
  channelActionConfig,
  channelDeploymentLinks,
  channelDoubaoCodingPlan,
  channelProviderValidation,
  channelUpdatePayload,
  commandMenu,
  featureLocalI18n,
  invoices,
  legacyNavigation,
  legacyRoutes,
  modelDeployments,
  notificationCenter,
  profileSecurity,
  redemptionCodes,
  sidebarConfig,
  subscriptionPurchase,
  subscriptionRenew,
  systemSettings,
  telegramOAuth,
  shellControls,
  ticketSearch,
  themeNextServing,
  usageLogs,
  users,
  vibeCodingAdmin,
  waffoPancakeSettings,
  warnings,
};

console.log(JSON.stringify(report, null, 2));

if (process.argv.includes("--fail-on-gap")) {
  if (
    missingFeatureModules.length > 0 ||
    missingEndpoints.length > 0 ||
    featureManifest.missingFromManifestCount > 0 ||
    featureManifest.staleManifestEntryCount > 0 ||
    adminPackages.failureCount > 0 ||
    adminRouteAccess.failureCount > 0 ||
    adminTokensSearch.failureCount > 0 ||
    apiKeysSearch.failureCount > 0 ||
    channelActionConfig.failureCount > 0 ||
    channelDeploymentLinks.failureCount > 0 ||
    channelDoubaoCodingPlan.failureCount > 0 ||
    channelProviderValidation.failureCount > 0 ||
    channelUpdatePayload.failureCount > 0 ||
    commandMenu.failureCount > 0 ||
    featureLocalI18n.failureCount > 0 ||
    invoices.failureCount > 0 ||
    invoices.warnings.length > 0 ||
    legacyNavigation.failureCount > 0 ||
    legacyRoutes.missingRedirectCount > 0 ||
    legacyRoutes.mismatchedRedirectCount > 0 ||
    legacyRoutes.discoveredMissingRouteCount > 0 ||
    modelDeployments.failureCount > 0 ||
    notificationCenter.failureCount > 0 ||
    profileSecurity.failureCount > 0 ||
    redemptionCodes.failureCount > 0 ||
    redemptionCodes.warnings.length > 0 ||
    sidebarConfig.failureCount > 0 ||
    subscriptionPurchase.failureCount > 0 ||
    subscriptionRenew.failureCount > 0 ||
    systemSettings.failureCount > 0 ||
    telegramOAuth.failureCount > 0 ||
    shellControls.failureCount > 0 ||
    ticketSearch.failureCount > 0 ||
    themeNextServing.failureCount > 0 ||
    usageLogs.failureCount > 0 ||
    usageLogs.warnings.length > 0 ||
    users.failureCount > 0 ||
    vibeCodingAdmin.failureCount > 0 ||
    waffoPancakeSettings.failureCount > 0 ||
    warnings.length > 0
  ) {
    process.exitCode = 1;
  }
}
