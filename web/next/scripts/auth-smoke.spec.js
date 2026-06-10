/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const twoFaUser = {
  id: 6101,
  username: "auth-otp-smoke",
  display_name: "Auth OTP Smoke",
  role: 1,
  status: 1,
  group: "default",
  quota: 100000,
  used_quota: 0,
  request_count: 0,
  email: "auth-otp-smoke@example.com",
  aff_count: 0,
  aff_quota: 0,
  aff_history_quota: 0,
  created_time: 1717200000,
  setting: JSON.stringify({ language: "en" }),
};

function buildStatus(overrides = {}) {
  return {
    system_name: "new-api auth smoke",
    display_in_currency: false,
    quota_display_type: "TOKENS",
    turnstile_check: false,
    user_agreement_enabled: false,
    privacy_policy_enabled: false,
    passkey_login: false,
    wechat_login: false,
    github_oauth: false,
    discord_oauth: false,
    oidc_enabled: false,
    linuxdo_oauth: false,
    telegram_oauth: false,
    custom_oauth_providers: [],
    register_enabled: true,
    ...overrides,
  };
}

async function mockApi(page, statusOverrides = {}) {
  const requests = [];
  const unhandled = [];
  const {
    oauthResponse,
    oauthStatus,
    resetEmailResponse,
    resetEmailStatus,
    resetConfirmResponse,
    resetConfirmStatus,
    user: mockUser,
    ...statusOptions
  } = statusOverrides;
  const status = buildStatus(statusOptions);
  const user = mockUser || twoFaUser;

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    const params = Object.fromEntries(url.searchParams.entries());
    requests.push({ method, pathname: url.pathname, params });

    const fulfill = (body, httpStatus = 200) =>
      route.fulfill({
        status: httpStatus,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (method === "GET" && url.pathname === "/api/setup") {
      await fulfill({ success: true, data: { required: false } });
      return;
    }

    if (method === "GET" && url.pathname === "/api/status") {
      await fulfill({ success: true, data: status });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: "" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/logout") {
      await fulfill({ success: true });
      return;
    }

    if (method === "GET" && url.pathname === "/api/reset_password") {
      await fulfill(
        resetEmailResponse || {
          success: true,
          message: "reset email sent",
        },
        resetEmailStatus || 200
      );
      return;
    }

    if (method === "GET" && url.pathname === "/api/verification") {
      await fulfill({
        success: true,
        message: "verification sent",
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/oauth/state") {
      await fulfill({
        success: true,
        data: "oauth-start-state",
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/reset") {
      const body = request.postDataJSON();
      requests.push({ method, pathname: url.pathname, body });
      await fulfill(
        resetConfirmResponse || {
          success: true,
          data: "N3wP@ssw0rd!",
        },
        resetConfirmStatus || 200
      );
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/register") {
      const body = request.postDataJSON();
      requests.push({ method, pathname: url.pathname, params, body });
      await fulfill({
        success: true,
        message: "registered",
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/login/2fa") {
      const body = request.postDataJSON();
      requests.push({ method, pathname: url.pathname, body });
      await fulfill({
        success: true,
        message: "verified",
        data: user,
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({
        success: true,
        data: user,
      });
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
      await fulfill({ success: true, data: ["gpt-auth-smoke"] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/token/") {
      await fulfill({
        success: true,
        data: {
          items: [],
          total: 0,
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/topup/info") {
      await fulfill({
        success: true,
        data: {
          enable_online_topup: false,
          enable_stripe_topup: false,
          enable_creem_topup: false,
          enable_waffo_topup: false,
          enable_waffo_pancake_topup: false,
          pay_methods: [],
          min_topup: 1,
          amount_options: [],
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/aff") {
      await fulfill({ success: true, data: "AFF-AUTH-SMOKE" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/topup/self") {
      await fulfill({
        success: true,
        data: {
          items: [],
          total: 0,
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/amount") {
      const body = request.postDataJSON();
      requests.push({ method, pathname: url.pathname, body });
      await fulfill({ success: true, data: String(Number(body?.amount || 0)) });
      return;
    }

    if (method === "GET" && url.pathname.startsWith("/api/oauth/")) {
      if (oauthResponse) {
        await fulfill(oauthResponse, oauthStatus || 200);
        return;
      }
    }

    unhandled.push(`${method} ${url.pathname}`);
    await fulfill(
      { success: false, message: `Unhandled ${method} ${url.pathname}` },
      404
    );
  });

  return { requests, unhandled };
}

async function clearAuthState(page, language = "en") {
  await page.addInitScript((nextLanguage) => {
    window.localStorage.setItem("i18nextLng", nextLanguage);
    window.localStorage.removeItem("user");
    window.localStorage.removeItem("uid");
    window.localStorage.setItem("setup_required", "false");
  }, language);
}

test.describe("auth public smoke", () => {
  test("recognizes OAuth binding action returned in response data", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, {
      oauthResponse: {
        success: true,
        message: "OAuth binding completed",
        data: { action: "bind" },
      },
    });
    await clearAuthState(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, "opener", {
        value: { postMessage() {} },
        configurable: true,
      });
      window.close = () => {};
    });

    await page.goto("/oauth/github?code=oauth-smoke-code&state=oauth-smoke-state");

    await expect(page).toHaveURL(/\/profile$/);
    const bindResult = await page.evaluate((storageKey) => {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    }, "oauth:binding:result");
    expect(bindResult).toEqual(
      expect.objectContaining({
        provider: "github",
        status: "success",
      })
    );
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/oauth/github" &&
          request.params.code === "oauth-smoke-code" &&
          request.params.state === "oauth-smoke-state"
      )
    ).toBeTruthy();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" && request.pathname === "/api/user/self"
      )
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });

  test("hides password login and registration link when disabled by status", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, {
      password_login_enabled: false,
      register_enabled: false,
      github_oauth: true,
      github_client_id: "auth-smoke-github-client",
    });
    await clearAuthState(page);

    await page.goto("/sign-in?redirect=%2Fkeys");

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with GitHub" })
    ).toBeVisible();
    await expect(page.getByLabel("Username or Email")).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "Password" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Sign up" })).toHaveCount(0);

    expect(
      requests.some(
        (request) =>
          request.method === "GET" && request.pathname === "/api/status"
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("preserves redirect target when starting GitHub OAuth login", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, {
      password_login_enabled: false,
      github_oauth: true,
      github_client_id: "auth-smoke-github-client",
      oauthResponse: {
        success: true,
        message: "logged in",
        data: twoFaUser,
      },
    });
    await clearAuthState(page);
    await page.addInitScript(() => {
      window.open = (url) => {
        window.localStorage.setItem("oauth:start:url", String(url));
        window.history.replaceState(null, "", "/oauth-start-captured");
        return null;
      };
    });

    await page.goto("/sign-in?redirect=%2Fwallet%3Ftab%3Dbilling");

    await page.getByRole("button", { name: "Continue with GitHub" }).click();
    await expect(page).toHaveURL(/\/oauth-start-captured$/);

    const startedUrl = await page.evaluate(() =>
      window.localStorage.getItem("oauth:start:url")
    );
    expect(startedUrl).toBeTruthy();
    const url = new URL(startedUrl);
    expect(url.origin).toBe("https://github.com");
    expect(url.searchParams.get("client_id")).toBe("auth-smoke-github-client");
    expect(url.searchParams.get("state")).toBe("oauth-start-state");
    expect(url.searchParams.get("redirect_uri")).toBeNull();
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.localStorage.getItem("oauth:redirect:oauth-start-state")
        )
      )
      .toBe("/wallet?tab=billing");

    await page.goto("/oauth/github?code=oauth-login-code&state=oauth-start-state");
    await expect(page).toHaveURL(/\/wallet\?tab=billing$/);
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/oauth/github" &&
          request.params.code === "oauth-login-code" &&
          request.params.state === "oauth-start-state"
      )
    ).toBeTruthy();
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.localStorage.getItem("oauth:redirect:oauth-start-state")
        )
      )
      .toBeNull();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" && request.pathname === "/api/user/self"
      )
    ).toBeTruthy();

    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/oauth/state"
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("signs in through Telegram popup auth data", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page, {
      password_login_enabled: false,
      telegram_oauth: true,
      telegram_bot_name: "telegram-smoke-bot",
      oauthResponse: {
        success: true,
        message: "logged in",
        data: { id: twoFaUser.id },
      },
    });
    await clearAuthState(page);
    await page.addInitScript(() => {
      window.open = (url) => {
        window.localStorage.setItem("telegram:start:url", String(url));
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
              id: "telegram-smoke-id",
              first_name: "Telegram",
              username: "telegram_smoke",
              auth_date: "1717200000",
              hash: "telegram-smoke-hash",
            },
            window.location.origin
          );
        }, 0);
        return popup;
      };
    });

    await page.goto("/sign-in?redirect=%2Fkeys");

    await page.getByRole("button", { name: "Continue with Telegram" }).click();
    await expect(page).toHaveURL(/\/keys$/);

    const startedUrl = await page.evaluate(() =>
      window.localStorage.getItem("telegram:start:url")
    );
    expect(startedUrl).toBeTruthy();
    const telegramUrl = new URL(startedUrl);
    expect(`${telegramUrl.origin}${telegramUrl.pathname}`).toBe(
      "https://oauth.telegram.org/authorize"
    );
    expect(telegramUrl.searchParams.get("bot_id")).toBe("telegram-smoke-bot");

    const loginRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/oauth/telegram/login"
    );
    expect(loginRequest).toEqual(
      expect.objectContaining({
        params: expect.objectContaining({
          id: "telegram-smoke-id",
          first_name: "Telegram",
          username: "telegram_smoke",
          auth_date: "1717200000",
          hash: "telegram-smoke-hash",
        }),
      })
    );
    expect(loginRequest.params.source).toBeUndefined();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" && request.pathname === "/api/user/self"
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("honors explicit redirect query on OAuth callback", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page, {
      oauthResponse: {
        success: true,
        message: "logged in",
        data: twoFaUser,
      },
    });
    await clearAuthState(page);

    await page.goto(
      "/oauth/github?code=oauth-callback-code&state=oauth-callback-state&redirect=%2Fkeys%3Ffoo%3Dbar"
    );

    await expect(page).toHaveURL(/\/keys\?foo=bar$/);
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/oauth/github" &&
          request.params.code === "oauth-callback-code" &&
          request.params.state === "oauth-callback-state"
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("keeps password login available by default", async ({ page }) => {
    const { unhandled } = await mockApi(page, {
      register_enabled: true,
    });
    await clearAuthState(page);

    await page.goto("/sign-in");

    await expect(page.getByLabel("Username or Email")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
    expect(unhandled).toEqual([]);
  });

  test("registers with email verification code", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page, {
      email_verification: true,
      register_enabled: true,
    });
    await clearAuthState(page);

    await page.goto("/sign-up");

    await expect(
      page.getByRole("heading", { name: "Create an account" })
    ).toBeVisible();
    await page.getByPlaceholder("Enter your username").fill("register-smoke");
    await page
      .getByPlaceholder("Enter password (8-20 characters)")
      .fill("Register1!");
    await page.getByPlaceholder("Confirm password").fill("Register1!");
    await page.getByPlaceholder("name@example.com").fill("register-smoke@example.com");
    await expect(page.getByPlaceholder("Verification code")).toBeVisible();

    await page.getByRole("button", { name: "Send code" }).click();
    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "GET" &&
            request.pathname === "/api/verification" &&
            request.params.email === "register-smoke@example.com"
        )
      )
      .toBe(true);

    await page.getByPlaceholder("Verification code").fill("654321");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);

    expect(
      requests.some(
        (request) =>
          request.method === "POST" &&
          request.pathname === "/api/user/register" &&
          request.body?.username === "register-smoke" &&
          request.body?.email === "register-smoke@example.com" &&
          request.body?.verification_code === "654321"
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("preserves protected-route query params in the sign-in redirect", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page, {
      register_enabled: true,
    });
    await clearAuthState(page);

    await page.goto("/my-subscriptions?plan_id=7007");

    await expect(page).toHaveURL(/\/sign-in\?redirect=/);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirect")).toBe(
      "/my-subscriptions?plan_id=7007"
    );
    expect(unhandled).toEqual([]);
  });

  test("requires Turnstile before sending reset email when enabled", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, {
      turnstile_check: true,
      turnstile_site_key: "1x00000000000000000000AA",
    });
    await page.route("https://challenges.cloudflare.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "",
      });
    });
    await clearAuthState(page);

    await page.goto("/forgot-password");

    await expect(
      page.getByRole("heading", { name: "Forgot password" })
    ).toBeVisible();
    await page.getByLabel("Email").fill("turnstile-smoke@example.com");
    await expect(
      page.getByRole("button", { name: "Send reset email" })
    ).toBeDisabled();

    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/reset_password"
      )
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });

  test("surfaces reset email business failures without starting resend cooldown", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page, {
      resetEmailResponse: {
        success: false,
        message: "Reset email denied by smoke",
      },
    });
    await clearAuthState(page);

    await page.goto("/forgot-password");

    await page.getByLabel("Email").fill("failure-smoke@example.com");
    await page.getByRole("button", { name: "Send reset email" }).click();
    await expect(page.getByText("Reset email denied by smoke")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send reset email" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Resend \(/ })).toHaveCount(0);
    expect(unhandled).toEqual([]);
  });

  test("localizes reset confirmation copy", async ({ page }) => {
    const { unhandled } = await mockApi(page, {
      register_enabled: true,
    });
    await clearAuthState(page, "zh");

    await page.goto("/reset?email=reset-smoke%40example.com&token=token-smoke");

    await expect(
      page.getByRole("heading", { name: "重置密码" })
    ).toBeVisible();
    await expect(page.getByText("确认重置请求以生成新密码。")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "确认重置密码" })
    ).toBeVisible();
    expect(unhandled).toEqual([]);
  });

  test("sends reset email, confirms generated password, and honors OTP redirect", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, {
      register_enabled: true,
    });
    await clearAuthState(page);

    await page.goto("/forgot-password");

    await expect(
      page.getByRole("heading", { name: "Forgot password" })
    ).toBeVisible();
    await page.getByLabel("Email").fill("reset-smoke@example.com");
    await page.getByRole("button", { name: "Send reset email" }).click();
    await expect(page.getByRole("button", { name: /Resend \(/ })).toBeVisible();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/reset_password" &&
          request.params.email === "reset-smoke@example.com"
      )
    ).toBeTruthy();

    await page.goto("/reset?email=reset-smoke%40example.com&token=token-smoke");
    await expect(
      page.getByRole("heading", { name: "Reset password" })
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue("reset-smoke@example.com");
    await page.getByRole("button", { name: "Confirm reset password" }).click();
    await expect(page.getByLabel("New password")).toHaveValue("N3wP@ssw0rd!");
    await expect(page.getByRole("button", { name: "Return to login" })).toBeVisible();

    expect(
      requests.some(
        (request) =>
          request.method === "POST" &&
          request.pathname === "/api/user/reset" &&
          request.body?.email === "reset-smoke@example.com" &&
          request.body?.token === "token-smoke"
      )
    ).toBeTruthy();

    await page.goto("/otp?redirect=%2Fkeys");
    await expect(
      page.getByRole("heading", { name: "Two-factor Authentication" })
    ).toBeVisible();
    await page.getByRole("textbox").first().fill("123456");
    await page.getByRole("button", { name: "Verify and Sign In" }).click();
    await expect(page).toHaveURL(/\/keys$/);

    expect(
      requests.some(
        (request) =>
          request.method === "POST" &&
          request.pathname === "/api/user/login/2fa" &&
          request.body?.code === "123456"
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("surfaces reset confirmation business failures", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page, {
      register_enabled: true,
      resetConfirmResponse: {
        success: false,
        message: "Reset link expired by smoke",
      },
    });
    await clearAuthState(page);

    await page.goto("/reset?email=reset-smoke%40example.com&token=expired-smoke");
    await page.getByRole("button", { name: "Confirm reset password" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Reset link expired by smoke" }).first()
    ).toBeVisible();
    await expect(page.getByLabel("New password")).toHaveCount(0);
    expect(
      requests.some(
        (request) =>
          request.method === "POST" &&
          request.pathname === "/api/user/reset" &&
          request.body?.email === "reset-smoke@example.com" &&
          request.body?.token === "expired-smoke"
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
