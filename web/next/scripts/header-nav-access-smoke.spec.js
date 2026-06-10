/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

function buildHeaderNavModules(overrides = {}) {
  const base = {
    home: true,
    console: true,
    pricing: { enabled: true, requireAuth: false },
    subscriptions: { enabled: true, requireAuth: false },
    rankings: { enabled: false, requireAuth: false },
    vibecoding: true,
    docs: true,
    about: true,
    contact: true,
  };

  const config = {
    ...base,
    ...overrides,
  };

  if (overrides.pricing) {
    config.pricing = { ...base.pricing, ...overrides.pricing };
  }
  if (overrides.subscriptions) {
    config.subscriptions = { ...base.subscriptions, ...overrides.subscriptions };
  }
  if (overrides.rankings) {
    config.rankings = { ...base.rankings, ...overrides.rankings };
  }

  return JSON.stringify(config);
}

function buildStatus(overrides = {}) {
  const {
    headerNavModules,
    user,
    ...statusOverrides
  } = overrides;

  return {
    system_name: "new-api header nav smoke",
    display_in_currency: false,
    quota_display_type: "TOKENS",
    price: 1,
    usd_exchange_rate: 1,
    server_address: "https://gateway.example.com",
    HeaderNavModules: headerNavModules
      ? buildHeaderNavModules(headerNavModules)
      : undefined,
    ...statusOverrides,
  };
}

async function mockApi(page, statusOverrides = {}) {
  const requests = [];
  const unhandled = [];
  const status = buildStatus(statusOverrides);

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

    if (method === "GET" && url.pathname === "/api/rankings") {
      await fulfill({
        success: true,
        data: {
          models: [],
          vendors: [],
          top_movers: [],
          top_droppers: [],
          models_history: { points: [], models: [], buckets: 0 },
          vendor_share_history: { points: [], vendors: [], buckets: 0 },
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/perf-metrics/summary") {
      await fulfill({ success: true, data: { models: [] } });
      return;
    }

    if (method === "GET" && url.pathname === "/api/perf-metrics") {
      await fulfill({
        success: true,
        data: {
          model_name: url.searchParams.get("model"),
          groups: [],
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: null });
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

function expectNoRequest(requests, pathname) {
  expect(
    requests.some(
      (request) => request.method === "GET" && request.pathname === pathname
    )
  ).toBeFalsy();
}

test.describe("header nav module route access smoke", () => {
  test("redirects disabled pricing routes to the home page", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, {
      headerNavModules: {
        pricing: { enabled: false, requireAuth: false },
      },
    });

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.setItem("setup_required", "false");
    });

    await page.goto("/pricing?group=default");
    await expect(page).toHaveURL(/\/$/);
    expectNoRequest(requests, "/api/pricing");
    expectNoRequest(requests, "/api/perf-metrics");
    expect(unhandled).toEqual([]);
  });

  test("redirects disabled pricing detail routes to the home page", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, {
      headerNavModules: {
        pricing: { enabled: false, requireAuth: false },
      },
    });

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.setItem("setup_required", "false");
    });

    await page.goto("/pricing/openrouter%2Fslashy-smoke?group=default");
    await expect(page).toHaveURL(/\/$/);
    expectNoRequest(requests, "/api/pricing");
    expectNoRequest(requests, "/api/perf-metrics");
    expect(unhandled).toEqual([]);
  });

  test("redirects disabled subscription plans routes to the home page", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, {
      headerNavModules: {
        subscriptions: { enabled: false, requireAuth: false },
      },
    });

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.setItem("setup_required", "false");
    });

    await page.goto("/subscription-plans");
    await expect(page).toHaveURL(/\/$/);
    expectNoRequest(requests, "/api/subscription/public/plans");
    expect(unhandled).toEqual([]);
  });

  test("redirects auth-required rankings routes to sign-in for anonymous users", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, {
      headerNavModules: {
        rankings: { enabled: true, requireAuth: true },
      },
    });

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.setItem("setup_required", "false");
    });

    await page.goto("/rankings?period=month");
    await page.waitForURL(/\/sign-in\?redirect=/);

    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname).toBe("/sign-in");
    expect(currentUrl.searchParams.get("redirect")).toBe("/rankings?period=month");
    expectNoRequest(requests, "/api/rankings");
    expectNoRequest(requests, "/api/perf-metrics");
    expect(unhandled).toEqual([]);
  });
});
