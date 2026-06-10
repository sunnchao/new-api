/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 6262,
  username: "profile-bindings-smoke",
  display_name: "Profile Bindings Smoke",
  role: 1,
  status: 1,
  group: "default",
  quota: 100000,
  used_quota: 0,
  request_count: 0,
  email: "profile-bindings-smoke@example.com",
  aff_count: 0,
  aff_quota: 0,
  aff_history_quota: 0,
  created_time: 1717200000,
  setting: JSON.stringify({ language: "en" }),
  permissions: {
    sidebar_settings: false,
  },
};

const customProvider = {
  id: 77,
  name: "Smoke IDP",
  slug: "smoke-idp",
  icon: "",
  client_id: "smoke-client",
  authorization_endpoint: "https://idp.example.com/oauth/authorize",
  scopes: "openid profile email",
};

function baseStatus() {
  return {
    system_name: "new-api profile bindings smoke",
    display_in_currency: false,
    quota_display_type: "TOKENS",
    checkin_enabled: false,
    turnstile_check: false,
    passkey_login: false,
    github_oauth: false,
    discord_oauth: false,
    oidc_enabled: false,
    telegram_oauth: false,
    wechat_login: false,
    linuxdo_oauth: false,
    custom_oauth_providers: [customProvider],
  };
}

async function seedAuth(page) {
  await page.addInitScript((storedUser) => {
    window.localStorage.setItem("i18nextLng", "en");
    window.localStorage.setItem("user", JSON.stringify(storedUser));
    window.localStorage.setItem("uid", String(storedUser.id));
    window.localStorage.setItem("setup_required", "false");
  }, user);
}

async function seedAuthWithLanguage(page, language, userOverrides = {}) {
  await page.addInitScript(
    ({ storedUser, lng }) => {
      window.localStorage.setItem("i18nextLng", lng);
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    },
    { storedUser: { ...user, ...userOverrides }, lng: language }
  );
}

async function installOpenSpy(page) {
  await page.addInitScript(() => {
    window.__openedUrls = [];
    window.open = (url, target) => {
      window.__openedUrls.push({
        url: String(url),
        target: target == null ? "" : String(target),
      });
      return null;
    };
  });
}

function xpathLiteral(value) {
  if (!value.includes('"')) return `"${value}"`;
  if (!value.includes("'")) return `'${value}'`;
  return `concat(${value
    .split('"')
    .map((part) => `"${part}"`)
    .join(', \'"\', ')})`;
}

function bindingCard(page, label) {
  return page.locator(
    `xpath=//p[normalize-space()=${xpathLiteral(
      label
    )}]/ancestor::div[contains(concat(" ", normalize-space(@class), " "), " rounded-lg ") and .//button][1]`
  );
}

function providerCard(page) {
  return bindingCard(page, customProvider.name);
}

async function mockApi(page, options = {}) {
  const requests = [];
  const unhandled = [];
  const backendOAuthCallbacks = [];
  const deletedProviderIds = [];
  const testNotificationBodies = [];
  let apiUser = { ...user, ...(options.userOverrides || {}) };
  let bindings = options.bindings ? [...options.bindings] : [];

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    const params = Object.fromEntries(url.searchParams.entries());
    requests.push({ method, pathname: url.pathname, search: url.search, params });

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
        data: { ...baseStatus(), ...(options.statusOverrides || {}) },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: "" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: apiUser });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/passkey") {
      await fulfill({
        success: true,
        data: {
          enabled: false,
          last_used_at: null,
          backup_eligible: false,
          backup_state: false,
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/2fa/status") {
      await fulfill({
        success: true,
        data: {
          enabled: false,
          locked: false,
          backup_codes_remaining: 0,
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/oauth/bindings") {
      await fulfill({ success: true, data: bindings });
      return;
    }

    if (method === "GET" && url.pathname === "/api/oauth/state") {
      await fulfill({ success: true, data: "state-smoke" });
      return;
    }

    if (method === "PUT" && url.pathname === "/api/user/setting") {
      const body = request.postDataJSON();
      requests.push({ method, pathname: url.pathname, body });
      await fulfill({ success: true, message: "settings updated" });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/setting/test_notify") {
      const body = request.postDataJSON();
      testNotificationBodies.push(body);
      requests.push({ method, pathname: url.pathname, body });
      await fulfill({ success: true, message: "test notification sent" });
      return;
    }

    if (method === "POST" && url.pathname === "/api/oauth/wechat/bind") {
      const body = request.postDataJSON();
      requests.push({ method, pathname: url.pathname, body });
      apiUser = { ...apiUser, wechat_id: "wx-smoke-openid" };
      await fulfill({ success: true, message: "WeChat account bound" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/oauth/telegram/bind") {
      apiUser = { ...apiUser, telegram_id: "telegram-bind-smoke-id" };
      await fulfill({ success: true, message: "Telegram account bound" });
      return;
    }

    if (
      method === "DELETE" &&
      url.pathname.startsWith("/api/user/oauth/bindings/")
    ) {
      const providerId = decodeURIComponent(
        url.pathname.split("/").filter(Boolean).at(-1)
      );
      deletedProviderIds.push(providerId);
      bindings = bindings.filter(
        (binding) => String(binding.provider_id) !== providerId
      );
      await fulfill({ success: true, message: "unbound" });
      return;
    }

    if (url.pathname.startsWith("/api/oauth/")) {
      backendOAuthCallbacks.push(`${method} ${url.pathname}${url.search}`);
    }

    unhandled.push(`${method} ${url.pathname}${url.search}`);
    await fulfill({ success: true, data: null });
  });

  return {
    requests,
    unhandled,
    backendOAuthCallbacks,
    deletedProviderIds,
    testNotificationBodies,
  };
}

test.describe("profile custom OAuth bindings", () => {
  test("binds WeChat using the status QR code and verification code", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, {
      statusOverrides: {
        wechat_login: true,
        wechat_qrcode: "https://example.test/wechat.png",
      },
      userOverrides: {
        wechat_id: "",
      },
    });
    await seedAuth(page);
    await installOpenSpy(page);

    await page.goto("/profile");

    const card = bindingCard(page, "WeChat");
    await expect(card.getByText("Not bound")).toBeVisible();
    await card.getByRole("button", { name: "Bind", exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Bind WeChat Account" })
    ).toBeVisible();
    await expect(
      dialog.getByRole("img", { name: "WeChat QR code" })
    ).toHaveAttribute("src", "https://example.test/wechat.png");

    await dialog.getByLabel("Verification Code").fill("WX-SMOKE");
    await dialog.getByRole("button", { name: "Bind WeChat" }).click();

    await expect(page.getByText("WeChat account bound")).toBeVisible();
    await expect
      .poll(
        () =>
          requests
            .filter(
              (request) =>
                request.method === "POST" &&
                request.pathname === "/api/oauth/wechat/bind" &&
                request.body
            )
            .map((request) => request.body),
        { timeout: 3000 }
      )
      .toEqual([{ code: "WX-SMOKE" }]);
    await expect(card.getByText("wx-smoke-openid")).toBeVisible();
    await expect(card.getByRole("button", { name: "Bound" })).toBeDisabled();
    expect(unhandled).toEqual([]);
  });

  test("opens the custom provider authorization endpoint when binding", async ({
    page,
    baseURL,
  }) => {
    const { requests, unhandled, backendOAuthCallbacks } = await mockApi(page);
    await seedAuth(page);
    await installOpenSpy(page);

    await page.goto("/profile");

    const card = providerCard(page);
    await expect(card.getByText("Not bound")).toBeVisible();
    await card.getByRole("button", { name: "Bind", exact: true }).click();

    await expect
      .poll(
        () =>
          page.evaluate(
            () => Array.isArray(window.__openedUrls) && window.__openedUrls.length
          ),
        { timeout: 3000 }
      )
      .toBe(1);

    const opened = await page.evaluate(() => window.__openedUrls[0]);
    const authUrl = new URL(opened.url);
    expect(opened.target).toBe("_blank");
    expect(`${authUrl.origin}${authUrl.pathname}`).toBe(
      customProvider.authorization_endpoint
    );
    expect(authUrl.searchParams.get("client_id")).toBe(
      customProvider.client_id
    );
    expect(authUrl.searchParams.get("redirect_uri")).toBe(
      `${baseURL}/oauth/${customProvider.slug}`
    );
    expect(authUrl.searchParams.get("response_type")).toBe("code");
    expect(authUrl.searchParams.get("state")).toBe("state-smoke");
    expect(authUrl.searchParams.get("scope")).toBe(customProvider.scopes);
    expect(
      requests.some(
        (request) =>
          request.method === "GET" && request.pathname === "/api/oauth/state"
      )
    ).toBe(true);
    expect(backendOAuthCallbacks).toEqual([]);
    expect(unhandled).toEqual([]);
  });

  test("binds Telegram through popup auth data", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page, {
      statusOverrides: {
        telegram_oauth: true,
        telegram_bot_name: "telegram-bind-bot",
      },
      userOverrides: {
        telegram_id: "",
      },
    });
    await seedAuth(page);
    await page.addInitScript(() => {
      window.__openedUrls = [];
      window.open = (url, target) => {
        window.__openedUrls.push({
          url: String(url),
          target: target == null ? "" : String(target),
        });
        const popup = {
          closed: false,
          location: { hash: "" },
          close() {
            this.closed = true;
          },
        };
        window.setTimeout(() => {
          window.postMessage(
            {
              source: "telegram-login",
              id: "telegram-bind-smoke-id",
              username: "telegram_bind_smoke",
              auth_date: "1717200000",
              hash: "telegram-bind-hash",
            },
            window.location.origin
          );
        }, 0);
        return popup;
      };
    });

    await page.goto("/profile");

    const card = bindingCard(page, "Telegram");
    await expect(card.getByText("Not bound")).toBeVisible();
    await card.getByRole("button", { name: "Bind", exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Bind Telegram Account" })
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Bind Telegram" }).click();

    await expect(page.getByText("Telegram account bound")).toBeVisible();
    const opened = await page.evaluate(() => window.__openedUrls[0]);
    const authUrl = new URL(opened.url);
    expect(`${authUrl.origin}${authUrl.pathname}`).toBe(
      "https://oauth.telegram.org/authorize"
    );
    expect(authUrl.searchParams.get("bot_id")).toBe("telegram-bind-bot");

    const bindRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/oauth/telegram/bind"
    );
    expect(bindRequest).toEqual(
      expect.objectContaining({
        params: expect.objectContaining({
          id: "telegram-bind-smoke-id",
          username: "telegram_bind_smoke",
          auth_date: "1717200000",
          hash: "telegram-bind-hash",
        }),
      })
    );
    expect(bindRequest.params.source).toBeUndefined();
    await expect(card.getByText("telegram-bind-smoke-id")).toBeVisible();
    await expect(card.getByRole("button", { name: "Bound" })).toBeDisabled();
    expect(unhandled).toEqual([]);
  });

  test("recognizes and unbinds an existing custom provider binding", async ({
    page,
  }) => {
    const { unhandled, deletedProviderIds } = await mockApi(page, {
      bindings: [
        {
          provider_id: "77",
          provider_name: customProvider.name,
          external_id: "smoke-subject",
        },
      ],
    });
    await seedAuth(page);
    await installOpenSpy(page);

    await page.goto("/profile");

    const card = providerCard(page);
    await expect(card.getByText("smoke-subject")).toBeVisible();
    await expect(card.getByRole("button", { name: "Unbind" })).toBeVisible();
    await card.getByRole("button", { name: "Unbind" }).click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Confirm Unbind" })
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Confirm Unbind" }).click();

    await expect
      .poll(() => deletedProviderIds, { timeout: 3000 })
      .toEqual(["77"]);
    expect(unhandled).toEqual([]);
  });

  test("sends a webhook test notification from profile settings", async ({
    page,
  }) => {
    const { unhandled, testNotificationBodies } = await mockApi(page);
    await seedAuth(page);
    await installOpenSpy(page);

    await page.goto("/profile");

    await page.getByRole("tab", { name: /Settings/ }).click();
    await expect(page.getByText("Notification Method")).toBeVisible();

    await page.getByText("Webhook", { exact: true }).click();
    await page.getByLabel("Webhook URL").fill("https://hooks.example.com/new-api");
    await page.getByLabel("Webhook Secret").fill("profile-secret");
    await page.getByRole("button", { name: "Send test notification" }).click();

    await expect
      .poll(() => testNotificationBodies, { timeout: 3000 })
      .toEqual([
        {
          notify_type: "webhook",
          webhook_url: "https://hooks.example.com/new-api",
          webhook_secret: "profile-secret",
        },
      ]);
    await expect(page.getByText("Test notification sent")).toBeVisible();
    expect(unhandled).toEqual([]);
  });

  test("registers profile translations for Chinese profile surfaces", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page, {
      userOverrides: {
        permissions: { sidebar_settings: true },
        setting: JSON.stringify({ language: "zh" }),
      },
    });
    await seedAuthWithLanguage(page, "zh", {
      permissions: { sidebar_settings: true },
      setting: JSON.stringify({ language: "zh" }),
    });
    await installOpenSpy(page);

    await page.goto("/profile");

    await expect(page.getByText("当前余额")).toBeVisible();
    await expect(page.getByText("语言偏好")).toBeVisible();
    await expect(page.getByText("左侧边栏个人设置")).toBeVisible();
    await expect(page.getByText("Current Balance")).toHaveCount(0);
    expect(unhandled).toEqual([]);
  });
});
