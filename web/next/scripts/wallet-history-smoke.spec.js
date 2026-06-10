/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 6060,
  username: "wallet-history-smoke",
  display_name: "Wallet History Smoke",
  role: 1,
  status: 1,
  group: "default",
  quota: 100000,
  used_quota: 0,
  request_count: 0,
  aff_count: 0,
  aff_quota: 0,
  aff_history_quota: 0,
  permissions: {
    sidebar_settings: false,
  },
};

const billingRecord = {
  id: 9001,
  user_id: user.id,
  amount: 25,
  money: 5.5,
  trade_no: "ORDER-HISTORY-SMOKE-001",
  payment_method: "stripe",
  create_time: 1717200000,
  complete_time: 1717200060,
  status: "success",
};

async function mockApi(page) {
  const requests = [];
  const unhandled = [];

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    requests.push({
      method,
      pathname: url.pathname,
      search: url.search,
      params: Object.fromEntries(url.searchParams.entries()),
    });

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
          system_name: "new-api wallet history smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          price: 1,
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: user });
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
          stripe_min_topup: 1,
          amount_options: [5, 10],
          discount: {},
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/aff") {
      await fulfill({ success: true, data: "AFF-WALLET-HISTORY-SMOKE" });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/amount") {
      await fulfill({ success: true, data: "1" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/topup/self") {
      await fulfill({
        success: true,
        data: {
          items: [billingRecord],
          total: 1,
        },
      });
      return;
    }

    unhandled.push(`${method} ${url.pathname}`);
    await fulfill({ success: true, data: null });
  });

  return { requests, unhandled };
}

test.describe("wallet order history deep link", () => {
  test("opens billing history from the legacy /console/topup route", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/console/topup?show_history=false&trace=legacy");

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Billing History" })).toBeVisible();
    await expect(dialog.getByText("ORDER-HISTORY-SMOKE-001")).toBeVisible();
    await expect(page).toHaveURL(/\/wallet$/);

    const historyRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/user/topup/self" &&
        request.params.p === "1" &&
        request.params.page_size === "10"
    );
    expect(historyRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("opens billing history from show_history and cleans the URL", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/wallet?show_history=true");

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Billing History" })).toBeVisible();
    await expect(dialog.getByText("View your topup transaction records and payment history")).toBeVisible();
    await expect(dialog.getByText("ORDER-HISTORY-SMOKE-001")).toBeVisible();
    await expect(dialog.getByText("Stripe")).toBeVisible();
    await expect(dialog.getByText("Showing 1-1 of 1")).toBeVisible();
    await expect(page).toHaveURL(/\/wallet$/);

    const historyRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/user/topup/self" &&
        request.params.p === "1" &&
        request.params.page_size === "10"
    );
    expect(historyRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
