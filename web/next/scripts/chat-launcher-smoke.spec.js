/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const gatewayAddress = "https://gateway.example.com";
const encodedGatewayAddress = encodeURIComponent(gatewayAddress);
const chatLauncherUrl =
  "https://chat.example.com/#/?key={key}&url={address}";

const user = {
  id: 9371,
  username: "chat-launcher-smoke-user",
  display_name: "Chat Launcher Smoke User",
  email: "chat-launcher-smoke@example.com",
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
  system_name: "new-api chat launcher smoke",
  server_address: gatewayAddress,
  display_in_currency: false,
  quota_display_type: "TOKENS",
  chats: [{ "Smoke Web Chat": chatLauncherUrl }],
};

const token = {
  id: 7001,
  name: "Smoke Chat Token",
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

async function mockApi(page, options = {}) {
  const statusMode = options.statusMode || "ok";
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
      if (statusMode === "error") {
        await fulfill({ success: false, message: "status unavailable" }, 503);
        return;
      }
      await fulfill({ success: true, data: statusData });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: user });
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

    if (method === "POST" && url.pathname === "/api/token/7001/key") {
      await fulfill({ success: true, data: { key: "chat-smoke-key" } });
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
    url.includes("key=sk-chat-smoke-key") &&
    url.includes(`url=${encodedGatewayAddress}`)
  );
}

async function expectTokenPicker(page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Select token" })).toBeVisible();
  await expect(page.getByText("Smoke Chat Token")).toBeVisible();
}

async function selectSmokeToken(page) {
  await page.getByRole("button", { name: /Smoke Chat Token/ }).click();
}

async function expectResolvedChatIframe(page) {
  const iframe = page.locator("iframe").first();
  await expect(iframe).toHaveAttribute("src", /https:\/\/chat\.example\.com/);

  const iframeSrc = await iframe.getAttribute("src");
  expect(iframeSrc).toContain("https://chat.example.com");
  expect(iframeSrc).toContain("key=sk-chat-smoke-key");
  expect(iframeSrc).toContain(`url=${encodedGatewayAddress}`);
}

async function detectChat2LinkSurface(page, externalChat) {
  const dialog = page.getByRole("dialog");
  if (
    (await dialog.isVisible()) &&
    (await dialog.getByRole("heading", { name: "Select token" }).isVisible())
  ) {
    return "token-picker";
  }

  const candidates = [
    page.url(),
    ...externalChat.navigations,
    ...externalChat.requests,
  ];
  if (candidates.some((url) => url.startsWith("https://chat.example.com"))) {
    return "external-chat";
  }

  if (
    (await page.getByRole("heading", { name: "Chat to Link" }).isVisible()) ||
    (await page.getByText("Create shareable chat link").isVisible()) ||
    (await page.getByRole("button", { name: "Generate link" }).isVisible())
  ) {
    return "local-generator";
  }

  return "pending";
}

function expectTokenKeyRequest(requests) {
  expect(
    requests.some(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/token/7001/key"
    )
  ).toBeTruthy();
}

test.afterEach(async ({ page }) => {
  const state = apiStates.get(page);
  if (state) {
    expect(state.unhandled).toEqual([]);
  }
});

test.describe("chat launcher parity smoke", () => {
  test("/chat/0 launches configured web chat with selected token", async ({
    page,
  }) => {
    const { requests } = await mockApi(page);
    await captureExternalChat(page);
    await seedAuthenticatedUser(page);

    await page.goto("/chat/0");

    await expectTokenPicker(page);
    await selectSmokeToken(page);

    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "POST" &&
            request.pathname === "/api/token/7001/key"
        )
      )
      .toBeTruthy();

    await expectResolvedChatIframe(page);
    expectTokenKeyRequest(requests);
  });

  test("/console/chat/0 keeps legacy chat launcher links working", async ({
    page,
  }) => {
    const { requests } = await mockApi(page);
    await captureExternalChat(page);
    await seedAuthenticatedUser(page);

    await page.goto("/console/chat/0");
    await expect(page).toHaveURL(/\/chat\/0$/);

    await expectTokenPicker(page);
    await selectSmokeToken(page);

    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "POST" &&
            request.pathname === "/api/token/7001/key"
        )
      )
      .toBeTruthy();

    await expectResolvedChatIframe(page);
    expectTokenKeyRequest(requests);
  });

  test("/chat2link redirects to the first configured web chat", async ({
    page,
  }) => {
    const { requests } = await mockApi(page);
    const externalChat = await captureExternalChat(page);
    await seedAuthenticatedUser(page);

    await page.goto("/chat2link");

    await expect
      .poll(() => detectChat2LinkSurface(page, externalChat))
      .not.toBe("pending");

    await expect(
      page.getByRole("heading", { name: "Chat to Link" })
    ).toBeHidden();
    await expect(page.getByText("Create shareable chat link")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Generate link" })
    ).toBeHidden();

    await expectTokenPicker(page);
    await selectSmokeToken(page);

    await expect
      .poll(() => {
        const candidates = [
          page.url(),
          ...externalChat.navigations,
          ...externalChat.requests,
        ];
        return candidates.some(isResolvedChatUrl);
      })
      .toBeTruthy();

    expectTokenKeyRequest(requests);
  });

  test("/chat/0 uses cached status server address when status request fails", async ({
    page,
  }) => {
    const { requests } = await mockApi(page, { statusMode: "error" });
    await captureExternalChat(page);
    await seedAuthenticatedUser(page);

    await page.goto("/chat/0");

    await expectTokenPicker(page);
    await selectSmokeToken(page);

    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "POST" &&
            request.pathname === "/api/token/7001/key"
        )
      )
      .toBeTruthy();

    await expectResolvedChatIframe(page);

    const iframeSrc = await page.locator("iframe").first().getAttribute("src");
    const frontendOrigin = new URL(page.url()).origin;
    expect(iframeSrc).not.toContain(`url=${encodeURIComponent(frontendOrigin)}`);
    expectTokenKeyRequest(requests);
  });
});
