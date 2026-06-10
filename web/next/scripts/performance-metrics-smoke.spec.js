/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 8701,
  username: "performance-metrics-smoke-admin",
  display_name: "Performance Metrics Smoke Admin",
  email: "performance-metrics-smoke-admin@example.com",
  role: 100,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 0,
  request_count: 0,
  permissions: {
    sidebar_settings: false,
  },
};

const perfSummary = {
  success: true,
  data: {
    models: [
      {
        model_name: "gpt-4o-smoke",
        avg_latency_ms: 610,
        success_rate: 99.8,
        avg_tps: 42.5,
      },
      {
        model_name: "claude-3-5-smoke",
        avg_latency_ms: 920,
        success_rate: 98.75,
        avg_tps: 25,
      },
    ],
  },
};

async function mockApi(page) {
  const requests = [];
  const unhandled = [];

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    const params = Object.fromEntries(url.searchParams.entries());
    requests.push({ method, pathname: url.pathname, params });

    const fulfill = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (method === "GET" && url.pathname === "/api/setup") {
      await fulfill({ success: true, data: { required: false } });
      return;
    }

    if (method === "GET" && url.pathname === "/api/status") {
      await fulfill({
        success: true,
        data: {
          system_name: "new-api performance metrics smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: user });
      return;
    }

    if (method === "GET" && url.pathname === "/api/option/") {
      await fulfill({ success: true, data: null });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self/groups") {
      await fulfill({
        success: true,
        data: {
          default: { desc: "Default group", ratio: 1 },
          pro: { desc: "Pro group", ratio: 1 },
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/perf-metrics/summary") {
      await fulfill(perfSummary);
      return;
    }

    if (method === "GET" && url.pathname === "/api/perf-metrics") {
      await fulfill(
        { success: false, message: "model is required" },
        400
      );
      return;
    }

    unhandled.push(`${method} ${url.pathname}`);
    await fulfill(
      { success: false, message: `Unhandled ${method} ${url.pathname}` },
      404
    );
  });

  return { requests, unhandled };
}

async function authenticate(page) {
  await page.addInitScript((storedUser) => {
    window.localStorage.setItem("i18nextLng", "en");
    window.localStorage.setItem("user", JSON.stringify(storedUser));
    window.localStorage.setItem("uid", String(storedUser.id));
    window.localStorage.setItem("setup_required", "false");
  }, user);
}

test.describe("performance metrics runtime surface", () => {
  test("renders the backend summary contract on the performance metrics page", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/performance-metrics");
    await expect(
      page.getByRole("heading", { name: "Performance Metrics" })
    ).toBeVisible();

    const gptRow = page.getByRole("row", { name: /gpt-4o-smoke/ });
    await expect(gptRow.getByRole("cell", { name: "gpt-4o-smoke" })).toBeVisible();
    await expect(gptRow.getByRole("cell", { name: "610ms" })).toBeVisible();
    await expect(gptRow.getByRole("cell", { name: "99.80%" })).toBeVisible();
    await expect(gptRow.getByRole("cell", { name: "42.5 t/s" })).toBeVisible();

    const claudeRow = page.getByRole("row", { name: /claude-3-5-smoke/ });
    await expect(
      claudeRow.getByRole("cell", { name: "claude-3-5-smoke" })
    ).toBeVisible();
    await expect(page.getByText("No data")).toBeHidden();

    const summaryRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/perf-metrics/summary" &&
        request.params.hours === "24"
    );
    const emptyModelRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/perf-metrics" &&
        !request.params.model
    );

    expect(summaryRequest).toBeTruthy();
    expect(emptyModelRequest).toBeFalsy();
    expect(unhandled).toEqual([]);
  });
});
