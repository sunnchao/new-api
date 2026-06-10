import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const ticketListPath = path.join(
  nextRoot,
  "src/features/tickets/components/ticket-list.tsx",
);
const adminTicketListPath = path.join(
  nextRoot,
  "src/features/tickets/components/admin-ticket-list.tsx",
);
const ticketDetailPath = path.join(
  nextRoot,
  "src/features/tickets/components/ticket-detail.tsx",
);
const adminTicketDetailPath = path.join(
  nextRoot,
  "src/features/tickets/components/admin-ticket-detail.tsx",
);
const ticketApiPath = path.join(nextRoot, "src/features/tickets/api.ts");

export function auditTicketSearch() {
  const listText = fs.readFileSync(ticketListPath, "utf8");
  const adminListText = fs.readFileSync(adminTicketListPath, "utf8");
  const detailText = fs.readFileSync(ticketDetailPath, "utf8");
  const adminDetailText = fs.readFileSync(adminTicketDetailPath, "utf8");
  const apiText = fs.readFileSync(ticketApiPath, "utf8");
  const searchUserTicketsBody =
    apiText
      .split("export async function searchUserTickets")[1]
      ?.split("export async function getTicketDetail")[0] ?? "";

  const checks = [
    {
      name: "user-list-imports-search-api",
      ok: /import\s*\{[^}]*searchUserTickets[^}]*\}\s*from\s*["']\.\.\/api["']/s.test(
        listText,
      ),
      message: "TicketList must import searchUserTickets for user search.",
    },
    {
      name: "user-list-has-search-input",
      ok:
        /placeholder=\{t\(["']Search tickets["']\)\}/.test(listText) &&
        /value=\{keyword\}/.test(listText),
      message: "TicketList must expose a keyword search input.",
    },
    {
      name: "user-list-has-search-and-reset-actions",
      ok:
        /handleSearch/.test(listText) &&
        /handleReset/.test(listText) &&
        /t\(["']Search["']\)/.test(listText) &&
        /t\(["']Reset["']\)/.test(listText),
      message: "TicketList must provide explicit search and reset actions.",
    },
    {
      name: "user-search-api-supports-status",
      ok:
        /status\?:\s*number/.test(searchUserTicketsBody) &&
        /query\.set\(["']status["'],\s*String\(status\)\)/.test(
          searchUserTicketsBody,
        ),
      message:
        "searchUserTickets must support status so search and status filtering can be combined.",
    },
    {
      name: "user-list-loads-ticket-categories",
      ok:
        /import\s*\{[^}]*getTicketCategories[^}]*\}\s*from\s*["']\.\.\/api["']/s.test(
          listText,
        ) && /queryFn:\s*getTicketCategories/.test(listText),
      message:
        "TicketList must load ticket categories so the list shows configured labels.",
    },
    {
      name: "user-list-renders-category-labels",
      ok: /categoryLabel\(ticket\.category\)/.test(listText),
      message:
        "TicketList must render configured category labels instead of raw category values.",
    },
    {
      name: "admin-list-loads-ticket-categories",
      ok:
        /import\s*\{[^}]*getTicketCategories[^}]*\}\s*from\s*["']\.\.\/api["']/s.test(
          adminListText,
        ) && /queryFn:\s*getTicketCategories/.test(adminListText),
      message:
        "AdminTicketList must load ticket categories for the category filter.",
    },
    {
      name: "admin-list-has-category-filter-state",
      ok: /categoryFilter/.test(adminListText) && /setCategoryFilter/.test(adminListText),
      message: "AdminTicketList must track a category filter.",
    },
    {
      name: "admin-list-passes-category-to-list-api",
      ok:
        /getAllTickets\(\{[\s\S]*category:/.test(adminListText) &&
        /queryKey:\s*\[[^\]]*categoryFilter/s.test(adminListText),
      message:
        "AdminTicketList must pass categoryFilter into getAllTickets and query keys.",
    },
    {
      name: "admin-list-renders-category-select",
      ok:
        /t\(["']All Categories["']\)/.test(adminListText) &&
        /categories\.map/.test(adminListText),
      message: "AdminTicketList must render a category Select with category options.",
    },
    {
      name: "admin-list-renders-category-labels",
      ok: /categoryLabel\(ticket\.category\)/.test(adminListText),
      message:
        "AdminTicketList must render configured category labels instead of only raw category values.",
    },
    {
      name: "admin-list-computes-status-summary",
      ok:
        /statusCounts\s*=\s*tickets\.reduce/.test(adminListText) &&
        /Record<number,\s*number>/.test(adminListText),
      message:
        "AdminTicketList must compute per-status counts for the visible ticket page.",
    },
    {
      name: "admin-list-renders-status-summary",
      ok:
        /Object\.entries\(TICKET_STATUS\)/.test(adminListText) &&
        /statusCounts\[value\]\s*\|\|\s*0/.test(adminListText) &&
        /STATUS_KEYS\[value - 1\]/.test(adminListText),
      message:
        "AdminTicketList must render pending/in-progress/replied/closed summary counts.",
    },
    {
      name: "admin-list-imports-self-assign-dependencies",
      ok:
        /import\s*\{[^}]*assignTicket[^}]*\}\s*from\s*["']\.\.\/api["']/s.test(
          adminListText,
        ) &&
        /import\s*\{[^}]*useAuthStore[^}]*\}\s*from\s*["']@\/stores\/auth-store["']/.test(
          adminListText,
        ),
      message:
        "AdminTicketList must import assignTicket and useAuthStore for assign-to-me.",
    },
    {
      name: "admin-list-has-assign-to-me-action",
      ok:
        /assignToMeMutation/.test(adminListText) &&
        /assignTicket\(id,\s*\{\s*admin_id:\s*currentAdminId\s*\}\)/.test(
          adminListText,
        ) &&
        /ticket\.status !== TICKET_STATUS\.CLOSED/.test(adminListText) &&
        /ticket\.assigned_admin_id !== currentAdminId/.test(adminListText) &&
        /t\(["']Assign to me["']\)/.test(adminListText),
      message:
        "AdminTicketList must provide Assign to me when the current admin can self-assign.",
    },
    {
      name: "user-detail-loads-ticket-categories",
      ok:
        /import\s*\{[^}]*getTicketCategories[^}]*\}\s*from\s*["']\.\.\/api["']/s.test(
          detailText,
        ) && /queryFn:\s*getTicketCategories/.test(detailText),
      message:
        "TicketDetail must load ticket categories so metadata shows configured labels.",
    },
    {
      name: "user-detail-renders-category-label",
      ok: /categoryLabel\(ticket\.category\)/.test(detailText),
      message:
        "TicketDetail must render the configured category label instead of only the raw category value.",
    },
    {
      name: "admin-detail-loads-ticket-categories",
      ok:
        /import\s*\{[^}]*getTicketCategories[^}]*\}\s*from\s*["']\.\.\/api["']/s.test(
          adminDetailText,
        ) && /queryFn:\s*getTicketCategories/.test(adminDetailText),
      message:
        "AdminTicketDetail must load ticket categories so metadata shows configured labels.",
    },
    {
      name: "admin-detail-renders-category-label",
      ok: /categoryLabel\(ticket\.category\)/.test(adminDetailText),
      message:
        "AdminTicketDetail must render the configured category label instead of only the raw category value.",
    },
    {
      name: "admin-detail-imports-self-assign-dependencies",
      ok:
        /import\s*\{[^}]*assignTicket[^}]*\}\s*from\s*["']\.\.\/api["']/s.test(
          adminDetailText,
        ) &&
        /import\s*\{[^}]*useAuthStore[^}]*\}\s*from\s*["']@\/stores\/auth-store["']/.test(
          adminDetailText,
        ),
      message:
        "AdminTicketDetail must import assignTicket and useAuthStore for assign-to-me.",
    },
    {
      name: "admin-detail-has-assign-to-me-action",
      ok:
        /assignToMeMutation/.test(adminDetailText) &&
        /assignTicket\(ticketId,\s*\{\s*admin_id:\s*currentAdminId\s*\}\)/.test(
          adminDetailText,
        ) &&
        /ticket\??\.status !== TICKET_STATUS\.CLOSED/.test(adminDetailText) &&
        /ticket\??\.assigned_admin_id !== currentAdminId/.test(adminDetailText) &&
        /t\(["']Assign to me["']\)/.test(adminDetailText),
      message:
        "AdminTicketDetail must provide Assign to me when the current admin can self-assign.",
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
  const report = auditTicketSearch();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
