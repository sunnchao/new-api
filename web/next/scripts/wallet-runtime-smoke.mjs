import { spawnSync } from "node:child_process";

const passthroughArgs = process.argv.slice(2);
const { FORCE_COLOR, NO_COLOR, ...smokeEnv } = process.env;
const command = [
  "BIN=$(command -v playwright)",
  'ROOT=$(cd "$(dirname "$BIN")/.." && pwd)',
  'NODE_PATH=$ROOT playwright test --config=./scripts/wallet-runtime-smoke.config.mjs "$@"',
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
    "wallet-runtime-smoke",
    ...passthroughArgs,
  ],
  {
    cwd: new URL("..", import.meta.url),
    stdio: "inherit",
    env: smokeEnv,
  }
);

process.exit(result.status ?? 1);
