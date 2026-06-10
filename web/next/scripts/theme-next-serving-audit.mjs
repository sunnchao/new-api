import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function readOptional(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

export function auditThemeNextServing() {
  const constants = read("common/constants.go");
  const optionController = read("controller/option.go");
  const webRouter = read("router/web-router.go");
  const dockerfile = read("Dockerfile");
  const dockerignore = read(".dockerignore");
  const dockerCompose = read("docker-compose.yml");
  const dockerComposeDev = read("docker-compose.dev.yml");
  const nextConfig = read("web/next/next.config.ts");
  const systemInfo = read(
    "web/next/src/features/system-settings/general/system-info-section.tsx",
  );
  const siteSectionRegistry = read(
    "web/next/src/features/system-settings/site/section-registry.tsx",
  );
  const defaultSystemInfo = read(
    "web/default/src/features/system-settings/general/system-info-section.tsx",
  );
  const defaultSiteSectionRegistry = read(
    "web/default/src/features/system-settings/site/section-registry.tsx",
  );
  const themeNextServingSmokeSpec = readOptional(
    "web/next/scripts/theme-next-serving-smoke.spec.js",
  );
  const themeNextServingSmokeConfig = readOptional(
    "web/next/scripts/theme-next-serving-smoke.config.mjs",
  );
  const themeNextServingSmokeRunner = readOptional(
    "web/next/scripts/theme-next-serving-smoke.mjs",
  );
  const webRouterTest = read("router/web_router_test.go");
  const dockerfileStages = dockerfile.match(/^FROM .+$/gm) ?? [];
  const lastDockerfileStage = dockerfileStages[dockerfileStages.length - 1] ?? "";
  const rateLimitIndex = webRouter.indexOf("middleware.GlobalWebRateLimit()");
  const proxyIndex = webRouter.indexOf("proxyNextFrontendWhenSelected()");
  const gzipIndex = webRouter.indexOf("gzip.Gzip(");
  const cacheIndex = webRouter.indexOf("middleware.Cache()");

  const checks = [
    {
      name: "common-theme-accepts-next",
      ok:
        /func SetTheme\(t string\)[\s\S]*t == "next"/.test(constants) &&
        /func ThemeAwarePath\(suffix string\)[\s\S]*GetTheme\(\) != "default" && GetTheme\(\) != "next"[\s\S]*return suffix/.test(
          constants,
        ) &&
        /strings\.Replace\(suffix, "\/console\/topup", "\/wallet", 1\)/.test(
          constants,
        ),
      message:
        "common.SetTheme must accept next, and ThemeAwarePath must treat next like the modern frontend rather than classic.",
    },
    {
      name: "option-controller-validates-next-theme",
      ok:
        /case "theme\.frontend"/.test(optionController) &&
        /option\.Value != "next"/.test(optionController) &&
        /NEXT_FRONTEND_BASE_URL|FRONTEND_NEXT_BASE_URL/.test(optionController),
      message:
        "theme.frontend option validation must allow next only when a Next frontend base URL is configured.",
    },
    {
      name: "web-router-proxies-next-theme",
      ok:
        /httputil\.NewSingleHostReverseProxy/.test(webRouter) &&
        /NEXT_FRONTEND_BASE_URL|FRONTEND_NEXT_BASE_URL/.test(webRouter) &&
        /common\.GetTheme\(\) != "next"/.test(webRouter) &&
        /StatusServiceUnavailable/.test(webRouter),
      message:
        "Go web router must proxy next theme requests to the configured Next server and fail visibly when missing.",
    },
    {
      name: "web-router-proxies-next-before-go-cache-compression",
      ok:
        rateLimitIndex >= 0 &&
        proxyIndex > rateLimitIndex &&
        gzipIndex > proxyIndex &&
        cacheIndex > proxyIndex,
      message:
        "Go web router must run the Next proxy before Go gzip/cache middleware so proxied Next responses keep their own compression and cache headers.",
    },
    {
      name: "next-system-settings-exposes-next-theme",
      ok:
        /z\.enum\(\[['"]default['"], ['"]classic['"], ['"]next['"]\]\)/.test(
          systemInfo,
        ) &&
        /value:\s*['"]next['"]/.test(systemInfo) &&
        !/name='theme\.frontend'[\s\S]{0,800}disabled/.test(systemInfo),
      message:
        "Next system settings must preserve and expose the next frontend theme instead of hardcoding default/disabled.",
    },
    {
      name: "next-system-settings-handoff-preserves-next",
      ok:
        /frontend:\s*settings\[['"]theme\.frontend['"]\]\s+as\s+['"]default['"]\s*\|\s*['"]classic['"]\s*\|\s*['"]next['"]/.test(
          siteSectionRegistry,
        ) ||
        (/frontend:\s*settings\[['"]theme\.frontend['"]\]/.test(
          siteSectionRegistry,
        ) &&
          !/frontend:\s*settings\[['"]theme\.frontend['"]\]\s+as\s+['"]default['"]\s*\|\s*['"]classic['"]/.test(
            siteSectionRegistry,
          )),
      message:
        "Site settings must pass theme.frontend through with next included, not narrow it to default/classic.",
    },
    {
      name: "default-system-settings-exposes-next-theme",
      ok:
        /z\.enum\(\[['"]default['"], ['"]classic['"], ['"]next['"]\]\)/.test(
          defaultSystemInfo,
        ) &&
        /normalizeFrontendTheme/.test(defaultSystemInfo) &&
        /value:\s*['"]next['"]/.test(defaultSystemInfo) &&
        /Next\.js Frontend/.test(defaultSystemInfo) &&
        /NEXT_FRONTEND_BASE_URL|FRONTEND_NEXT_BASE_URL/.test(defaultSystemInfo),
      message:
        "The existing default frontend settings page must also expose theme.frontend=next so admins can switch into the Next frontend from the current UI.",
    },
    {
      name: "default-system-settings-handoff-preserves-next",
      ok:
        /frontend:\s*settings\[['"]theme\.frontend['"]\]\s+as\s+['"]default['"]\s*\|\s*['"]classic['"]\s*\|\s*['"]next['"]/.test(
          defaultSiteSectionRegistry,
        ) ||
        (/frontend:\s*settings\[['"]theme\.frontend['"]\]/.test(
          defaultSiteSectionRegistry,
        ) &&
          !/frontend:\s*settings\[['"]theme\.frontend['"]\]\s+as\s+['"]default['"]\s*\|\s*['"]classic['"]/.test(
            defaultSiteSectionRegistry,
          )),
      message:
        "The default frontend site settings registry must pass through next values instead of narrowing theme.frontend to default/classic.",
    },
    {
      name: "next-config-produces-standalone-server",
      ok:
        /output:\s*['"]standalone['"]/.test(nextConfig) &&
        /outputFileTracingRoot:\s*workspaceRoot/.test(nextConfig),
      message:
        "Next config must emit a standalone server and trace from the web workspace so Docker can run web/next without the full monorepo.",
    },
    {
      name: "dockerfile-builds-next-standalone-target",
      ok:
        /AS builder-next/.test(dockerfile) &&
        /cd next[\s\S]*bun run build/.test(dockerfile) &&
        /AS web-next/.test(dockerfile) &&
        /COPY --from=builder-next[\s\S]*\.next\/standalone/.test(dockerfile) &&
        /COPY --from=builder-next[\s\S]*\.next\/static/.test(dockerfile) &&
        /COPY --from=builder-next[\s\S]*\/public/.test(dockerfile) &&
        /PORT=3001/.test(dockerfile) &&
        /CMD \[\s*["']node["'],\s*["']server\.js["']\s*\]/.test(dockerfile),
      message:
        "Dockerfile must include a web-next target that builds the Next standalone output and runs server.js on port 3001.",
    },
    {
      name: "dockerfile-default-target-remains-go-runtime",
      ok:
        /debian:bookworm-slim/.test(lastDockerfileStage) &&
        /ENTRYPOINT \[\s*["']\/new-api["']\s*\]\s*$/.test(dockerfile.trim()),
      message:
        "The default Dockerfile target must remain the Go runtime image; web-next should only build via --target web-next.",
    },
    {
      name: "dockerignore-excludes-next-build-context-noise",
      ok:
        /^\.worktrees$/m.test(dockerignore) &&
        /^\/web\/next\/node_modules$/m.test(dockerignore) &&
        /^\/web\/next\/\.next$/m.test(dockerignore),
      message:
        "Docker context must exclude local worktrees and web/next build artifacts so the web-next target stays practical to build.",
    },
    {
      name: "dockerignore-excludes-local-env-files",
      ok:
        /^\.env$/m.test(dockerignore) &&
        /^\.env\.\*$/m.test(dockerignore) &&
        /^!\.env\.example$/m.test(dockerignore) &&
        /^!\*\*\/\.env\.example$/m.test(dockerignore),
      message:
        "Docker context must exclude local .env files so web-next builds cannot leak or bake developer-specific environment values.",
    },
    {
      name: "compose-wires-next-service-to-go-proxy",
      ok:
        /web-next:\n[\s\S]*target:\s*web-next/.test(dockerCompose) &&
        /NEXT_FRONTEND_BASE_URL=http:\/\/web-next:3001/.test(dockerCompose) &&
        /new-api:[\s\S]*depends_on:[\s\S]*-\s*web-next/.test(dockerCompose),
      message:
        "Production compose must run the Next service and configure Go to proxy theme.frontend=next requests to it.",
    },
    {
      name: "dev-compose-documents-next-dev-proxy",
      ok:
        /NEXT_FRONTEND_BASE_URL=http:\/\/host\.docker\.internal:3001/.test(
          dockerComposeDev,
        ) && /host\.docker\.internal:host-gateway/.test(dockerComposeDev),
      message:
        "Development compose must expose a host Next dev server URL so a containerized backend can proxy theme.frontend=next locally.",
    },
    {
      name: "theme-next-serving-runtime-smoke-covered",
      ok:
        themeNextServingSmokeConfig.includes(
          "theme-next-serving-smoke\\.spec\\.js$",
        ) &&
        themeNextServingSmokeRunner.includes(
          "theme-next-serving-smoke.config.mjs",
        ) &&
        /TestThemeNextServingSmokeProxiesStandaloneNext/.test(
          themeNextServingSmokeSpec,
        ) &&
        /spawnSync\(\s*["']go["']/.test(themeNextServingSmokeSpec) &&
        /["']test["'][\s\S]*["']\.\/router["']/.test(
          themeNextServingSmokeSpec,
        ) &&
        /TestThemeNextServingSmokeProxiesStandaloneNext/.test(webRouterTest) &&
        /web\/next\/\.next\/standalone\/next\/server\.js/.test(
          webRouterTest,
        ) &&
        /proxyNextFrontendWhenSelected/.test(webRouterTest) &&
        /NEXT_FRONTEND_BASE_URL/.test(webRouterTest),
      message:
        "Theme-next serving needs a runtime smoke trio that runs a Go integration test against the real Next standalone server through the Go proxy.",
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
  const report = auditThemeNextServing();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
