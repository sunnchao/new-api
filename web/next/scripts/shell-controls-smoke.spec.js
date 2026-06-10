/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const baseUser = {
  id: 9382,
  username: "shell-controls-smoke-user",
  display_name: "Shell Controls Smoke User",
  email: "shell-controls-smoke@example.com",
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
  const userUpdates = [];
  const unhandled = [];
  let currentUser = { ...baseUser };

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    const params = Object.fromEntries(url.searchParams.entries());
    const body = request.postDataJSON?.();
    requests.push({ method, pathname: url.pathname, params, body });

    const fulfill = (responseBody, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(responseBody),
      });

    if (method === "GET" && url.pathname === "/api/setup") {
      await fulfill({ success: true, data: { required: false } });
      return;
    }

    if (method === "GET" && url.pathname === "/api/status") {
      await fulfill({
        success: true,
        data: {
          system_name: "new-api shell controls smoke",
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
      await fulfill({ success: true, data: currentUser });
      return;
    }

    if (method === "PUT" && url.pathname === "/api/user/self") {
      currentUser = { ...currentUser, ...body };
      userUpdates.push(body);
      await fulfill({ success: true, data: currentUser });
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
      await fulfill({ success: true, data: ["gpt-shell-controls"] });
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
      404,
    );
  });

  return { requests, userUpdates, unhandled };
}

async function seedAuthenticatedUser(page) {
  await page.addInitScript((storedUser) => {
    window.localStorage.setItem("user", JSON.stringify(storedUser));
    window.localStorage.setItem("uid", String(storedUser.id));
    window.localStorage.setItem("setup_required", "false");
    window.localStorage.setItem("i18nextLng", "en");
    window.localStorage.removeItem("theme-customization");
  }, baseUser);
}

test.describe("shell controls smoke", () => {
  test("authenticated header exposes language persistence and theme customization controls", async ({
    page,
  }) => {
    const { unhandled, userUpdates } = await mockApi(page);
    await seedAuthenticatedUser(page);

    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/dashboard\/overview$/);

    await page.getByRole("button", { name: "Color preset" }).click();
    await page.getByRole("menuitem", { name: /Teal/ }).click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.getAttribute("data-theme-preset"),
        ),
      )
      .toBe("teal");

    await page.getByRole("button", { name: "Corner radius" }).click();
    await page.getByRole("menuitem", { name: "Sharp" }).click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.getAttribute("data-theme-radius"),
        ),
      )
      .toBe("sharp");

    await page.getByRole("button", { name: "UI scale" }).click();
    await page.getByRole("menuitem", { name: "Comfortable" }).click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.getAttribute("data-theme-scale"),
        ),
      )
      .toBe("comfortable");

    await page.getByRole("button", { name: "Switch language" }).click();
    await page.getByRole("menuitem", { name: /中文/ }).click();

    await expect
      .poll(() => userUpdates.some((body) => body?.language === "zh"))
      .toBe(true);
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem("i18nextLng")))
      .toBe("zh");
    expect(unhandled).toEqual([]);
  });
});
