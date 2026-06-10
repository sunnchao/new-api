/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");
const { test, expect } = require("@playwright/test");

const repoRoot = resolve(__dirname, "../../..");

test.describe("theme next serving smoke", () => {
  test("proxies the real Next standalone server through the Go web router", () => {
    const result = spawnSync(
      "go",
      [
        "test",
        "./router",
        "-run",
        "TestThemeNextServingSmokeProxiesStandaloneNext",
        "-count=1",
        "-v",
      ],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          THEME_NEXT_SERVING_SMOKE: "1",
        },
        encoding: "utf8",
      }
    );

    const output = `${result.stdout || ""}${result.stderr || ""}`;
    expect(output).toContain("TestThemeNextServingSmokeProxiesStandaloneNext");
    expect(result.status, output).toBe(0);
  });
});
