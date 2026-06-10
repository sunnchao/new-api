import { spawnSync } from "node:child_process";

const passthroughArgs = process.argv.slice(2);
const { FORCE_COLOR, NO_COLOR, ...smokeEnv } = process.env;
const command = [
  "BIN=$(command -v playwright)",
  'ROOT=$(cd "$(dirname "$BIN")/.." && pwd)',
  'NODE_PATH=$ROOT playwright test --config=./scripts/invoices-smoke.config.mjs "$@"',
].join("; ");

const result = spawnSync(
  "npm",
  [
    "exec",
    "--yes",
    "--package",
    "@playwright/test",
    "--",
    "sh",
    "-c",
    command,
    "invoices-smoke",
    ...passthroughArgs,
  ],
  {
    cwd: new URL("..", import.meta.url),
    stdio: "inherit",
    env: smokeEnv,
  }
);

process.exit(result.status ?? 1);
