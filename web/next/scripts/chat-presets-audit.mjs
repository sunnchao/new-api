import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(nextRoot, relativePath), "utf8");
}

export function auditChatPresets() {
  const sidebarText = readSource("src/components/layout/sidebar-nav.tsx");
  const hookText = readSource("src/features/chat/hooks/use-chat-presets.ts");
  const chatPageText = readSource("src/features/chat/chat-page.tsx");
  const chat2LinkText = readSource("src/features/chat/chat2link-page.tsx");
  const rowActionsText = readSource(
    "src/features/keys/components/data-table-row-actions.tsx",
  );
  const sidebarSmokeText = readSource(
    "scripts/chat-presets-sidebar-smoke.spec.js",
  );
  const launcherSmokeText = readSource("scripts/chat-launcher-smoke.spec.js");
  const rowActionsSmokeText = readSource(
    "scripts/api-key-chat-actions-smoke.spec.js",
  );

  const checks = [
    {
      name: "chat-presets-read-status-and-local-cache",
      ok:
        /status\?\.Chats\s*\?\?\s*status\?\.chats/.test(hookText) &&
        /getStoredStatusChats/.test(hookText) &&
        /getStoredStatusServerAddress/.test(hookText) &&
        /parseChatConfig\(raw\)/.test(hookText),
      message:
        "Chat presets should read backend status chat config and cached status fallback, preserving configured chat links when status refresh fails.",
    },
    {
      name: "sidebar-renders-configured-web-chat-presets",
      ok:
        /useChatPresets/.test(sidebarText) &&
        /preset\.type !== ["']fluent["']/.test(sidebarText) &&
        /`\/chat\/\$\{preset\.id\}`/.test(sidebarText) &&
        /chat-presets/.test(sidebarText) &&
        /authenticated sidebar exposes configured chat presets/.test(
          sidebarSmokeText,
        ) &&
        /Smoke Web Chat/.test(sidebarSmokeText) &&
        /\/chat\/0/.test(sidebarSmokeText),
      message:
        "Authenticated sidebar should expose configured web chat presets and have production smoke coverage for the /chat/:id link.",
    },
    {
      name: "sidebar-launches-external-chat-presets",
      ok:
        /ChatTokenPickerDialog/.test(sidebarText) &&
        /useEnabledChatTokens/.test(sidebarText) &&
        /chatLinkRequiresApiKey/.test(sidebarText) &&
        /fetchTokenKey/.test(sidebarText) &&
        /resolveChatUrl/.test(sidebarText) &&
        /window\.open\(resolvedUrl,\s*["_']_blank["_']/.test(sidebarText) &&
        /authenticated sidebar launches external chat presets with selected token/.test(
          sidebarSmokeText,
        ) &&
        /Smoke External Chat/.test(sidebarSmokeText) &&
        /sk-sidebar-chat-smoke-key/.test(sidebarSmokeText),
      message:
        "Authenticated sidebar should expose non-fluent external/custom-protocol chat presets and launch resolved URLs with selected token coverage.",
    },
    {
      name: "chat-launcher-token-handoff-covered",
      ok:
        /useChatPresets/.test(chatPageText) &&
        /ChatTokenPickerDialog/.test(chatPageText) &&
        /resolveChatUrl/.test(chatPageText) &&
        /\/chat\/0 launches configured web chat with selected token/.test(
          launcherSmokeText,
        ) &&
        /\/console\/chat\/0 keeps legacy chat launcher links working/.test(
          launcherSmokeText,
        ) &&
        /\/api\/token\/7001\/key/.test(launcherSmokeText) &&
        /key=sk-chat-smoke-key/.test(launcherSmokeText),
      message:
        "Chat launcher should prompt for a token, resolve the real key, preserve legacy /console/chat/:id, and prove the resolved URL in smoke.",
    },
    {
      name: "chat2link-first-web-preset-covered",
      ok:
        /firstWebPreset/.test(chat2LinkText) &&
        /chatLinkRequiresApiKey/.test(chat2LinkText) &&
        /window\.location\.href = url/.test(chat2LinkText) &&
        /\/chat2link redirects to the first configured web chat/.test(
          launcherSmokeText,
        ) &&
        /detectChat2LinkSurface/.test(launcherSmokeText) &&
        /isResolvedChatUrl/.test(launcherSmokeText),
      message:
        "/chat2link should hand off to the first configured web chat instead of falling back to the local generator when a preset exists.",
    },
    {
      name: "api-key-row-chat-actions-covered",
      ok:
        /handleMenuOpenChange/.test(rowActionsText) &&
        /void resolveRealKey\(apiKey\.id\)/.test(rowActionsText) &&
        /handleOpenChatPreset/.test(rowActionsText) &&
        /sendToFluent/.test(rowActionsText) &&
        /window\.open\(resolvedUrl,\s*['_"]_blank['_"]/.test(rowActionsText) &&
        /opens a configured web chat preset from the API key row action menu/.test(
          rowActionsSmokeText,
        ) &&
        /expected opening the row action menu to prefetch the real key/.test(
          rowActionsSmokeText,
        ) &&
        /key=sk-row-chat-smoke-key/.test(rowActionsSmokeText),
      message:
        "API key row actions should prefetch/reuse the real key and launch configured chat presets, with smoke coverage for the resolved URL.",
    },
    {
      name: "chat-smoke-runners-present",
      ok:
        fs.existsSync(path.join(nextRoot, "scripts/chat-launcher-smoke.mjs")) &&
        fs.existsSync(
          path.join(nextRoot, "scripts/chat-presets-sidebar-smoke.mjs"),
        ) &&
        fs.existsSync(
          path.join(nextRoot, "scripts/api-key-chat-actions-smoke.mjs"),
        ),
      message:
        "Chat preset runtime coverage should remain runnable through the standard smoke .mjs wrappers.",
    },
  ];

  return {
    checkCount: checks.length,
    failureCount: checks.filter((check) => !check.ok).length,
    checks,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectInvocation = invokedPath === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  const report = auditChatPresets();
  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
