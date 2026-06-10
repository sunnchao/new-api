import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.RANKINGS_SMOKE_PORT || 3355);
const outputDir =
  process.env.RANKINGS_SMOKE_OUTPUT_DIR ||
  join(tmpdir(), "new-api-rankings-smoke");
const { FORCE_COLOR, NO_COLOR, ...webServerEnv } = process.env;

export default {
  testDir: scriptsDir,
  testMatch: /rankings-smoke\.spec\.js$/,
  outputDir,
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 1100 },
      },
    },
  ],
  webServer: {
    command: `bun run start -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...webServerEnv,
      NEXT_PUBLIC_API_BASE:
        process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:9",
    },
  },
};
