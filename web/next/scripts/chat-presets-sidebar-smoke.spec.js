/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const gatewayAddress = "https://gateway.example.com";
const chatLauncherUrl =
  "https://chat.example.com/#/?key={key}&url={address}";

const user = {
  id: 9372,
  username: "chat-presets-sidebar-smoke-user",
  display_name: "Chat Presets Sidebar Smoke User",
  email: "chat-presets-sidebar-smoke@example.com",
  role: 1,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 0,
  request_count: 0,
  permissions: {
    sidebar_settings: false,
  },
  setting: {
    language: "en",
  },
};

const statusData = {
  system_name: "new-api chat presets sidebar smoke",
  server_address: gatewayAddress,
  display_in_currency: false,
  quota_display_type: "TOKENS",
  chats: [{ "Smoke Web Chat": chatLauncherUrl }],
};

const token = {
  id: 7002,
  name: "Smoke Sidebar Chat Token",
  key: "chat_masked",
  status: 1,
  group: "default",
  backup_group: "pro",
  remain_quota: 500000,
  used_quota: 0,
  unlimited_quota: false,
  expired_time: -1,
  created_time: 1717200000,
  accessed_time: 0,
  model_limits_enabled: false,
  model_limits: "",
  allow_ips: "",
  cross_group_retry: false,
};

const apiStates = new WeakMap();

function queryParams(url) {
  return Object.fromEntries(url.searchParams.entries());
}

function requestLabel(method, url) {
  return `${method} ${url.pathname}${url.search}`;
}

async function mockApi(page) {
  const state = {
    requests: [],
    unhandled: [],
  };
  apiStates.set(page, state);

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    const params = queryParams(url);
    state.requests.push({ method, pathname: url.pathname, params });

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
      await fulfill({ success: true, data: statusData });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: user });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: "" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/models") {
      await fulfill({ success: true, data: ["gpt-4o-mini"] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self/groups") {
      await fulfill({
        success: true,
        data: {
          default: { desc: "Default", ratio: 1 },
        },
      });
      return;
    }

    if (
      method === "GET" &&
      url.pathname === "/api/token/" &&
      params.p === "1" &&
      params.size === "50"
    ) {
      await fulfill({
        success: true,
        data: {
          items: [token],
          total: 1,
          page: 1,
          page_size: 50,
        },
      });
      return;
    }

    state.unhandled.push(requestLabel(method, url));
    await fulfill(
      { success: false, message: `Unhandled ${requestLabel(method, url)}` },
      404
    );
  });

  return state;
}

async function seedAuthenticatedUser(page) {
  await page.addInitScript(
    ({ storedUser, storedStatus }) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
      window.localStorage.setItem("status", JSON.stringify(storedStatus));
    },
    { storedUser: user, storedStatus: statusData }
  );
}

test.afterEach(async ({ page }) => {
  const state = apiStates.get(page);
  if (state) {
    expect(state.unhandled).toEqual([]);
  }
});

test.describe("chat presets sidebar parity smoke", () => {
  test("authenticated sidebar exposes configured chat presets", async ({
    page,
  }) => {
    await mockApi(page);
    await seedAuthenticatedUser(page);

    await page.goto("/playground");

    const desktopSidebar = page.locator("aside").first();
    await expect(
      desktopSidebar.getByRole("link", { name: "Playground" })
    ).toBeVisible();

    const presetLink = desktopSidebar.getByRole("link", {
      name: "Smoke Web Chat",
    });
    await expect(presetLink).toBeVisible();
    await expect(presetLink).toHaveAttribute("href", "/chat/0");

    await presetLink.click();
    await expect(page).toHaveURL(/\/chat\/0$/);
    await expect(page.getByRole("heading", { name: "Select token" })).toBeVisible();
  });
});
