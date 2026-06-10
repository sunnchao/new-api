/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 9381,
  username: "command-menu-smoke-user",
  display_name: "Command Menu Smoke User",
  email: "command-menu-smoke@example.com",
  role: 100,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 25000,
  request_count: 12,
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
          system_name: "new-api command menu smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          server_address: "https://gateway.example.com",
          announcements_enabled: false,
          api_info: [],
          announcements: [],
          faq: [],
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: "" });
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
        data: { items: [], total: 0, page: 1, page_size: 50 },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/models") {
      await fulfill({ success: true, data: ["gpt-command-menu"] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/data/self") {
      await fulfill({ success: true, data: [] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/perf-metrics/summary") {
      await fulfill({ success: true, data: { models: [] } });
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

async function seedAuthenticatedUser(page) {
  await page.addInitScript((storedUser) => {
    window.localStorage.setItem("user", JSON.stringify(storedUser));
    window.localStorage.setItem("uid", String(storedUser.id));
    window.localStorage.setItem("setup_required", "false");
    window.localStorage.setItem("i18nextLng", "en");
  }, user);
}

test.describe("command menu smoke", () => {
  test("authenticated shell exposes search trigger, keyboard palette, and navigation", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page);
    await seedAuthenticatedUser(page);

    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/dashboard\/overview$/);
    await expect(page.getByRole("button", { name: "Open command menu" })).toBeVisible();

    const shortcut = process.platform === "darwin" ? "Meta+K" : "Control+K";
    await page.keyboard.press(shortcut);

    await expect(
      page.getByPlaceholder("Type a command or search...")
    ).toBeVisible();
    await page
      .getByRole("dialog")
      .getByText("API Keys", { exact: true })
      .click();

    await expect(page).toHaveURL(/\/keys$/);
    expect(unhandled).toEqual([]);
  });
});
