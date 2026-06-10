import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

const sources = {
  api: "src/features/tickets/api.ts",
  createDialog: "src/features/tickets/components/create-ticket-dialog.tsx",
  userDetail: "src/features/tickets/components/ticket-detail.tsx",
  adminDetail: "src/features/tickets/components/admin-ticket-detail.tsx",
  adminList: "src/features/tickets/components/admin-ticket-list.tsx",
  assignDialog: "src/features/tickets/components/assign-ticket-dialog.tsx",
  smoke: "scripts/tickets-smoke.spec.js",
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

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

export function auditTicketBusinessFailureSemantics() {
  const warnings = [];
  const api = readSource(sources.api, warnings);
  const createDialog = readSource(sources.createDialog, warnings);
  const userDetail = readSource(sources.userDetail, warnings);
  const adminDetail = readSource(sources.adminDetail, warnings);
  const adminList = readSource(sources.adminList, warnings);
  const assignDialog = readSource(sources.assignDialog, warnings);
  const smoke = readSource(sources.smoke, warnings);

  const mutationSources = [
    createDialog,
    userDetail,
    adminDetail,
    adminList,
    assignDialog,
  ].join("\n");

  const checks = [
    {
      name: "ticket-action-success-helper-present",
      ok:
        /export function isTicketActionSuccess/.test(api) &&
        /response\?\.(success)\s*===\s*true/.test(api),
      message:
        "Tickets need a shared response-body success guard so HTTP 200 { success: false } does not trigger success-side effects.",
    },
    {
      name: "ticket-mutations-check-business-success-before-side-effects",
      ok:
        countMatches(mutationSources, /onSuccess:\s*\(response\)\s*=>\s*\{\s*if\s*\(!isTicketActionSuccess\(response\)\)\s*return/g) >=
        11,
      message:
        "Ticket create/reply/close/status/priority/delete/assign mutations must check response.success before resetting forms, closing dialogs, invalidating queries, or navigating.",
    },
    {
      name: "ticket-business-failure-runtime-smoke-covered",
      ok:
        /keeps user reply draft when the API reports a business failure/.test(
          smoke
        ) &&
        /failUserReply/.test(smoke) &&
        /success:\s*false,\s*message:\s*["']reply rejected["']/.test(smoke) &&
        /toHaveValue\(["']This reply should remain["']\)/.test(smoke) &&
        /detailRequestsAfter\)\.toBe\(detailRequestsBefore\)/.test(smoke),
      message:
        "Tickets smoke must prove a business-failed reply keeps the draft and does not refetch as if the reply succeeded.",
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
  const report = auditTicketBusinessFailureSemantics();

  console.log(JSON.stringify(report, null, 2));

  if (
    process.argv.includes("--fail-on-gap") &&
    (report.failureCount > 0 || report.warnings.length > 0)
  ) {
    process.exitCode = 1;
  }
}
