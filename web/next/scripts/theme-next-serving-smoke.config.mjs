import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const outputDir =
  process.env.THEME_NEXT_SERVING_SMOKE_OUTPUT_DIR ||
  join(tmpdir(), "new-api-theme-next-serving-smoke");

export default {
  testDir: scriptsDir,
  testMatch: /theme-next-serving-smoke\.spec\.js$/,
  outputDir,
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 960 },
      },
    },
  ],
};
