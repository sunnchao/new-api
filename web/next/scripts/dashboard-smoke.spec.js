/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 9352,
  username: "dashboard-smoke-admin",
  display_name: "Dashboard Smoke Admin",
  email: "dashboard-smoke-admin@example.com",
  role: 100,
  status: 1,
  group: "default",
  quota: 250000,
  used_quota: 15000,
  request_count: 37,
  permissions: {
    sidebar_settings: false,
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
          system_name: "new-api dashboard smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          server_address: "https://gateway.example.com",
          announcements_enabled: true,
          api_info: [
            {
              url: "https://gateway.example.com/v1",
              route: "Smoke Route",
              description: "Dashboard route compatibility smoke",
              color: "teal",
            },
          ],
          announcements: [
            {
              id: 1,
              content: "Smoke dashboard announcement",
              publishDate: "2026-06-01T00:00:00Z",
              type: "success",
            },
          ],
          faq: [
            {
              id: 1,
              question: "Smoke FAQ question",
              answer: "Smoke FAQ answer",
            },
          ],
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: "Smoke global notice" });
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
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/token/") {
      await fulfill({
        success: true,
        data: {
          items: [
            {
              id: 301,
              name: "Dashboard Smoke Key",
              status: 1,
              remain_quota: 50000,
              unlimited_quota: false,
              expired_time: -1,
              created_time: 1760000000,
              accessed_time: 0,
              used_quota: 0,
            },
          ],
          total: 1,
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/token/301/key") {
      await fulfill({ success: true, data: { key: "dashboard-smoke-key" } });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/models") {
      await fulfill({ success: true, data: ["gpt-smoke-dashboard"] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/data/self") {
      await fulfill({
        success: true,
        data: [
          {
            created_at: 1760000000,
            quota: 1200,
            count: 3,
            token_used: 2400,
          },
        ],
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/perf-metrics/summary") {
      await fulfill({
        success: true,
        data: {
          models: [
            {
              model_name: "gpt-smoke-dashboard",
              avg_latency_ms: 320,
              success_rate: 99.95,
              avg_tps: 24,
            },
          ],
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/uptime/status") {
      await fulfill({ success: true, data: [] });
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

test.describe("dashboard overview smoke", () => {
  test("renders status content when dashboard enabled flags are omitted", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
      window.localStorage.removeItem("new-api-dashboard-setup-expanded");
    }, user);

    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/dashboard\/overview$/);
    await expect(
      page.getByRole("heading", { name: "Overview" })
    ).toBeVisible();
    await expect(page.getByText("Smoke Route")).toBeVisible();
    await expect(page.getByText("Smoke dashboard announcement")).toBeVisible();
    await expect(page.getByText("Smoke FAQ question")).toBeVisible();

    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/data/self" &&
          request.params.default_time === "hour"
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("shows the global notification center with notice and timeline entries", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/dashboard");

    await page.getByRole("button", { name: "Notifications" }).click();
    await expect(page.getByText("Smoke global notice")).toBeVisible();
    await page.getByRole("tab", { name: /Timeline/i }).click();
    await expect(
      page
        .getByRole("tabpanel", { name: /Timeline/i })
        .getByText("Smoke dashboard announcement")
    ).toBeVisible();
    expect(unhandled).toEqual([]);
  });

  test("canonicalizes invalid dashboard sections to overview", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/dashboard/not-real");

    await expect(page).toHaveURL(/\/dashboard\/overview$/);
    await expect(
      page.getByRole("heading", { name: "Overview" })
    ).toBeVisible();
    expect(unhandled).toEqual([]);
  });
});
