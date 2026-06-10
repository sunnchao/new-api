/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

async function mockApi(page, options = {}) {
  const requests = [];
  const unhandled = [];
  const statusOverrides = options.status || {};
  const apiOverrides = options.api || {};

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    requests.push({ method, pathname: url.pathname });

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
          system_name: "new-api public pages smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          price: 1,
          usd_exchange_rate: 1,
          server_address: "https://gateway.example.com",
          docs_link: "https://docs.example.com/new-api",
          ...statusOverrides,
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: "" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/about") {
      await fulfill({
        success: true,
        data: "# Public Pages Smoke About\n\nGateway information for visitors.",
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/home_page_content") {
      await fulfill({ success: true, data: "" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/subscription/home/plans") {
      await fulfill({ success: true, data: [] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/pricing") {
      await fulfill({
        success: true,
        data: [],
        vendors: [],
        group_ratio: {},
        usable_group: {},
        supported_endpoint: {},
        auto_groups: [],
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/privacy-policy") {
      if (apiOverrides.privacyPolicy) {
        await fulfill(apiOverrides.privacyPolicy);
        return;
      }

      await fulfill({
        success: true,
        data: "# Privacy Smoke Policy\n\nWe keep visitor privacy visible.",
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user-agreement") {
      if (apiOverrides.userAgreement) {
        await fulfill(apiOverrides.userAgreement);
        return;
      }

      await fulfill({
        success: true,
        data: "# User Smoke Agreement\n\nUse the service responsibly.",
      });
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

test.describe("public informational pages smoke", () => {
  test("public header exposes accessible language and theme controls", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page);

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.setItem("setup_required", "false");
    });

    await page.goto("/about");

    await expect(
      page.getByRole("button", { name: "Switch language" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Toggle theme" })
    ).toBeVisible();

    expect(unhandled).toEqual([]);
  });

  test("public header exposes VibeCoding and OpenClaw entry points", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page);

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.setItem("setup_required", "false");
    });

    await page.goto("/about");

    await expect(page.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/"
    );
    await expect(page.getByRole("link", { name: "Console" })).toHaveAttribute(
      "href",
      "/dashboard"
    );
    await expect(
      page.getByRole("link", { name: "Model Square" })
    ).toHaveAttribute("href", "/pricing");
    await expect(
      page.getByRole("link", { name: "Subscription Plans" })
    ).toHaveAttribute("href", "/subscription-plans");
    await expect(page.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "href",
      "https://docs.example.com/new-api"
    );
    await expect(page.getByRole("link", { name: "Rankings" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about"
    );
    await expect(
      page.getByRole("link", { name: "Contact us" })
    ).toHaveAttribute("href", "/contact");

    await page.getByRole("button", { name: "VibeCoding" }).click();
    await expect(
      page.getByRole("link", { name: "Claude Code" })
    ).toHaveAttribute("href", "/vibecoding/claude");
    await expect(
      page.getByRole("link", { name: "Codex Code" })
    ).toHaveAttribute("href", "/vibecoding/codex");
    await expect(
      page.getByRole("link", { name: "Gemini Code" })
    ).toHaveAttribute("href", "/vibecoding/gemini");
    await expect(
      page.getByRole("link", { name: "OpenClaw" })
    ).toHaveAttribute("href", "/openclaw");

    await page.goto("/openclaw");
    await expect(page).toHaveURL(/\/vibecoding\/openclaw$/);
    await expect(
      page.getByRole("heading", { name: "OpenClaw AI Programming" })
    ).toBeVisible();
    await page.getByRole("tab", { name: "Installation" }).click();
    await expect(page.getByText("npm install -g openclaw")).toBeVisible();
    expect(unhandled).toEqual([]);
  });

  test("public header hides VibeCoding when disabled by HeaderNavModules", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page, {
      status: {
        HeaderNavModules: JSON.stringify({
          home: false,
          console: false,
          pricing: false,
          subscriptions: false,
          rankings: false,
          vibecoding: false,
          docs: false,
          about: false,
          contact: false,
        }),
      },
    });

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.removeItem("status");
      window.localStorage.setItem("setup_required", "false");
    });

    await page.goto("/about");

    await expect(
      page.getByRole("heading", { name: "Public Pages Smoke About" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Console" })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Model Square" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Subscription Plans" })
    ).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Rankings" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Docs" })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "VibeCoding" })
    ).toHaveCount(0);
    await expect(page.getByRole("link", { name: "About" })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Contact us" })
    ).toHaveCount(0);
    expect(unhandled).toEqual([]);
  });

  test("mobile public header exposes navigation drawer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { unhandled } = await mockApi(page);

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.setItem("setup_required", "false");
    });

    await page.goto("/about");

    await expect(page.getByRole("link", { name: "Model Square" })).toHaveCount(0);

    await page.getByRole("button", { name: "Toggle navigation menu" }).click();

    const mobileNav = page.getByRole("navigation", { name: "Mobile public navigation" });
    await expect(mobileNav.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/"
    );
    await expect(
      mobileNav.getByRole("link", { name: "Subscription Plans" })
    ).toHaveAttribute("href", "/subscription-plans");
    await expect(
      mobileNav.getByRole("link", { name: "Model Square" })
    ).toHaveAttribute("href", "/pricing");
    await expect(mobileNav.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "href",
      "https://docs.example.com/new-api"
    );
    await expect(
      mobileNav.getByRole("link", { name: "Claude Code" })
    ).toHaveAttribute("href", "/vibecoding/claude");
    await expect(mobileNav.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in"
    );

    expect(unhandled).toEqual([]);
  });

  test("renders public content pages without unhandled API calls", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.setItem("setup_required", "false");
    });

    await page.goto("/about");
    await expect(
      page.getByRole("heading", { name: "Public Pages Smoke About" })
    ).toBeVisible();
    await expect(
      page.getByText("Gateway information for visitors.")
    ).toBeVisible();

    await page.goto("/contact");
    await expect(
      page.getByRole("heading", { name: "Contact us" })
    ).toBeVisible();
    await expect(page.getByText("Email support")).toBeVisible();
    await expect(page.getByText("QQ group").first()).toBeVisible();

    await page.goto("/privacy-policy");
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Privacy Smoke Policy" })
    ).toBeVisible();
    await expect(
      page.getByText("We keep visitor privacy visible.")
    ).toBeVisible();

    await page.goto("/user-agreement");
    await expect(
      page.getByRole("heading", { name: "User Agreement" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "User Smoke Agreement" })
    ).toBeVisible();
    await expect(page.getByText("Use the service responsibly.")).toBeVisible();

    await page.goto("/404");
    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Page not found" })
    ).toBeVisible();
    await expect(
      page.getByText("The page you're looking for doesn't exist or has been moved.")
    ).toBeVisible();

    expect(
      requests.some(
        (request) =>
          request.method === "GET" && request.pathname === "/api/status"
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("home renders one public footer with enabled legal links", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page, {
      status: {
        user_agreement_enabled: true,
        privacy_policy_enabled: true,
      },
    });

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.removeItem("home_page_content");
      window.localStorage.removeItem("status");
      window.localStorage.setItem("setup_required", "false");
    });

    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer).toHaveCount(1);
    await expect(
      footer.getByRole("link", { name: "New API" })
    ).toHaveAttribute("href", "https://github.com/QuantumNous/new-api");
    await expect(
      footer.getByRole("link", { name: "User Agreement" })
    ).toHaveAttribute("href", "/user-agreement");
    await expect(
      footer.getByRole("link", { name: "Privacy Policy" })
    ).toHaveAttribute("href", "/privacy-policy");

    expect(unhandled).toEqual([]);
  });

  test("public layout footer exposes enabled legal links on content pages", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page, {
      status: {
        user_agreement_enabled: true,
        privacy_policy_enabled: true,
      },
    });

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.removeItem("status");
      window.localStorage.setItem("setup_required", "false");
    });

    await page.goto("/about");

    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveCount(1);
    await expect(
      footer.getByRole("link", { name: "User Agreement" })
    ).toHaveAttribute("href", "/user-agreement");
    await expect(
      footer.getByRole("link", { name: "Privacy Policy" })
    ).toHaveAttribute("href", "/privacy-policy");

    expect(unhandled).toEqual([]);
  });

  test("legal documents do not render failed api payload data", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page, {
      api: {
        privacyPolicy: {
          success: false,
          message: "Privacy policy unavailable",
          data: "# Should Not Render\n\nHidden failed payload.",
        },
      },
    });

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.setItem("setup_required", "false");
    });

    await page.goto("/privacy-policy");

    await expect(
      page.locator("p").filter({ hasText: /^Privacy policy unavailable$/ })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Should Not Render" })
    ).toHaveCount(0);
    await expect(page.getByText("Hidden failed payload.")).toHaveCount(0);

    expect(unhandled).toEqual([]);
  });
});
