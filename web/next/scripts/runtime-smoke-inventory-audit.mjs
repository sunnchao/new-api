import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function listFiles(pattern) {
  return fs
    .readdirSync(scriptDir)
    .filter((file) => pattern.test(file))
    .sort();
}

function read(file) {
  return fs.readFileSync(path.join(scriptDir, file), "utf8");
}

function readNextRoot(relativePath) {
  return fs.readFileSync(path.join(scriptDir, "..", relativePath), "utf8");
}

function readOptionalNextRoot(relativePath) {
  const filePath = path.join(scriptDir, "..", relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function basename(file, suffix) {
  return file.slice(0, -suffix.length);
}

function referencesSpec(configText, spec) {
  const escapedSpec = spec.replaceAll(".", "\\.");
  return configText.includes(spec) || configText.includes(escapedSpec);
}

export function auditRuntimeSmokeInventory() {
  const specs = listFiles(/-smoke\.spec\.js$/);
  const runners = listFiles(/-smoke\.mjs$/);
  const configs = listFiles(/-smoke\.config\.mjs$/);
  const packageJson = JSON.parse(readNextRoot("package.json"));
  const startWrapper = readOptionalNextRoot("scripts/start-standalone.mjs");

  const specBases = new Set(specs.map((file) => basename(file, ".spec.js")));
  const runnerBases = new Set(runners.map((file) => basename(file, ".mjs")));
  const configBases = new Set(configs.map((file) => basename(file, ".config.mjs")));

  const failures = [];

  if (packageJson.scripts?.start !== "node scripts/start-standalone.mjs") {
    failures.push({
      id: "runtime-smoke-start-script-not-standalone-aware",
      file: "package.json",
      message:
        "The shared production start script must use scripts/start-standalone.mjs so smoke configs do not launch `next start` against output: standalone builds.",
    });
  }

  if (
    !/"standalone"[\s\S]*"next"[\s\S]*"server\.js"/.test(startWrapper) ||
    !/".next"[\s\S]*"static"/.test(startWrapper) ||
    !/public/.test(startWrapper) ||
    !/HOSTNAME/.test(startWrapper) ||
    !/PORT/.test(startWrapper) ||
    !/command\s*=\s*"next"/.test(startWrapper) ||
    !/commandArgs\s*=\s*\["start",\s*\.\.\.argv\]/.test(startWrapper)
  ) {
    failures.push({
      id: "runtime-smoke-start-wrapper-missing",
      file: "scripts/start-standalone.mjs",
      message:
        "The shared production start wrapper must prefer the local standalone server, prepare local static/public assets, map --hostname/--port into env vars, and keep a next start fallback for missing builds.",
    });
  }

  for (const base of specBases) {
    const runner = `${base}.mjs`;
    const config = `${base}.config.mjs`;
    if (!runnerBases.has(base)) {
      failures.push({
        id: "runtime-smoke-missing-runner",
        file: `${base}.spec.js`,
        message: `Production smoke ${base}.spec.js must have a runnable ${runner}.`,
      });
    }
    if (!configBases.has(base)) {
      failures.push({
        id: "runtime-smoke-missing-config",
        file: `${base}.spec.js`,
        message: `Production smoke ${base}.spec.js must have a Playwright ${config}.`,
      });
    }
  }

  for (const base of runnerBases) {
    if (!specBases.has(base)) {
      failures.push({
        id: "runtime-smoke-runner-without-spec",
        file: `${base}.mjs`,
        message: `Smoke runner ${base}.mjs has no matching ${base}.spec.js.`,
      });
      continue;
    }

    const runnerText = read(`${base}.mjs`);
    const config = `${base}.config.mjs`;
    if (!runnerText.includes(config)) {
      failures.push({
        id: "runtime-smoke-runner-missing-config-reference",
        file: `${base}.mjs`,
        message: `Smoke runner ${base}.mjs must invoke ${config}.`,
      });
    }
  }

  for (const base of configBases) {
    if (!specBases.has(base)) {
      failures.push({
        id: "runtime-smoke-config-without-spec",
        file: `${base}.config.mjs`,
        message: `Smoke config ${base}.config.mjs has no matching ${base}.spec.js.`,
      });
      continue;
    }

    const configText = read(`${base}.config.mjs`);
    const spec = `${base}.spec.js`;
    if (!referencesSpec(configText, spec)) {
      failures.push({
        id: "runtime-smoke-config-missing-spec-reference",
        file: `${base}.config.mjs`,
        message: `Smoke config ${base}.config.mjs must target ${spec}.`,
      });
    }
  }

  return {
    smokeSpecCount: specs.length,
    smokeRunnerCount: runners.length,
    smokeConfigCount: configs.length,
    failureCount: failures.length,
    failures,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectInvocation = invokedPath === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  const report = auditRuntimeSmokeInventory();

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-gap") && report.failureCount > 0) {
    process.exitCode = 1;
  }
}
