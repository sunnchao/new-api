/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const gatewayAddress = "https://gateway.example.com/v1";
const encodedGatewayAddress = encodeURIComponent(gatewayAddress);
const chatLauncherUrl =
  "https://chat.example.com/#/?key={key}&url={address}";

const user = {
  id: 9401,
  username: "api-key-chat-actions-smoke",
  display_name: "API Key Chat Actions Smoke",
  email: "api-key-chat-actions-smoke@example.com",
  role: 1,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 120000,
  request_count: 42,
  permissions: {
    sidebar_settings: false,
  },
  setting: {
    language: "en",
  },
};

const statusData = {
  system_name: "new-api api key chat actions smoke",
  server_address: gatewayAddress,
  display_in_currency: false,
  quota_display_type: "TOKENS",
  default_use_auto_group: false,
  chats: [
    { "Smoke Web Chat": chatLauncherUrl },
    { "Smoke FluentRead": "fluent://new-api?key={key}&url={address}" },
  ],
};

const token = {
  id: 9402,
  name: "Row Chat Action Key",
  key: "row-chat-action-masked",
  status: 1,
  remain_quota: 400000,
  used_quota: 100000,
  unlimited_quota: false,
  expired_time: -1,
  created_time: 1717200000,
  accessed_time: 1717203600,
  group: "default",
  cross_group_retry: false,
  model_limits_enabled: false,
  model_limits: "",
  allow_ips: "",
  backup_group: "",
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function queryParams(url) {
  return Object.fromEntries(url.searchParams.entries());
}

function requestLabel(method, url) {
  return `${method} ${url.pathname}${url.search}`;
}

function paginatedTokens(params) {
  const page = Number(params.p || 1);
  const pageSize = Number(params.size || 20);
  return {
    success: true,
    data: {
      items: [clone(token)],
      total: 1,
      page,
      page_size: pageSize,
    },
  };
}

async function mockApi(page) {
  const state = {
    requests: [],
    unhandled: [],
  };

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

    if (method === "GET" && url.pathname === "/api/user/self/groups") {
      await fulfill({
        success: true,
        data: {
          default: { desc: "Default group", ratio: 1 },
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/models") {
      await fulfill({ success: true, data: ["gpt-4o-mini"] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/token/") {
      await fulfill(paginatedTokens(params));
      return;
    }

    if (method === "POST" && url.pathname === "/api/token/9402/key") {
      await fulfill({ success: true, data: { key: "row-chat-smoke-key" } });
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
      window.localStorage.setItem("chats", JSON.stringify(storedStatus.chats));
    },
    { storedUser: user, storedStatus: statusData }
  );
}

async function captureWindowOpen(page) {
  await page.addInitScript(() => {
    window.__chatActionOpenUrls = [];
    window.open = (url) => {
      if (typeof url === "string") {
        window.__chatActionOpenUrls.push(url);
      }
      return {
        closed: false,
        close() {
          this.closed = true;
        },
        focus() {},
        blur() {},
        location: { href: typeof url === "string" ? url : "" },
      };
    };
  });
}

async function captureExternalChat(page) {
  const requests = [];
  const navigations = [];

  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("https://chat.example.com")) {
      requests.push(url);
    }
  });

  page.on("framenavigated", (frame) => {
    const url = frame.url();
    if (url.startsWith("https://chat.example.com")) {
      navigations.push(url);
    }
  });

  await page.route("https://chat.example.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Smoke Web Chat</title>",
    });
  });

  return { requests, navigations };
}

function isResolvedChatUrl(url) {
  return (
    url.startsWith("https://chat.example.com") &&
    url.includes("key=sk-row-chat-smoke-key") &&
    url.includes(`url=${encodedGatewayAddress}`)
  );
}

function hasRealKeyRequest(requests) {
  return requests.some(
    (request) =>
      request.method === "POST" &&
      request.pathname === "/api/token/9402/key"
  );
}

async function openRowMenu(page, rowText) {
  const row = page.getByRole("row", { name: new RegExp(rowText) });
  await expect(row).toBeVisible();
  await row.getByRole("button").last().click();
}

async function chooseFirstChatPreset(page) {
  await page.getByRole("menuitem", { name: "Chat" }).hover();
  await expect(page.getByRole("menuitem", { name: "Smoke Web Chat" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
}

async function getOpenedChatUrls(page) {
  return page.evaluate(() => window.__chatActionOpenUrls || []);
}

test.describe("api key row chat actions parity smoke", () => {
  test("opens a configured web chat preset from the API key row action menu", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await captureWindowOpen(page);
    const externalChat = await captureExternalChat(page);
    await seedAuthenticatedUser(page);

    await page.goto("/keys");
    await expect(page.getByRole("heading", { name: "API Keys" })).toBeVisible();
    await expect(page.getByText("Row Chat Action Key")).toBeVisible();

    await openRowMenu(page, "Row Chat Action Key");
    await expect
      .poll(() => hasRealKeyRequest(requests), {
        message: "expected opening the row action menu to prefetch the real key",
      })
      .toBeTruthy();

    await chooseFirstChatPreset(page);

    expect(hasRealKeyRequest(requests)).toBeTruthy();

    await expect
      .poll(async () => {
        const candidates = [
          ...(await getOpenedChatUrls(page)),
          page.url(),
          ...externalChat.navigations,
          ...externalChat.requests,
        ];
        return candidates.some(isResolvedChatUrl);
      })
      .toBeTruthy();

    expect(unhandled).toEqual([]);
  });
});
