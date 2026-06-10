/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 6262,
  username: "wallet-runtime-smoke",
  display_name: "Wallet Runtime Smoke",
  role: 1,
  status: 1,
  group: "default",
  quota: 2500000,
  used_quota: 0,
  request_count: 0,
  aff_count: 3,
  aff_quota: 1500000,
  aff_history_quota: 2500000,
  permissions: {
    sidebar_settings: false,
  },
};

const topupInfo = {
  enable_online_topup: true,
  enable_stripe_topup: true,
  enable_creem_topup: false,
  enable_waffo_topup: false,
  enable_waffo_pancake_topup: false,
  pay_methods: [
    { name: "Runtime Pay", type: "runtime_pay", min_topup: 1 },
    { name: "Stripe", type: "stripe", min_topup: 1 },
  ],
  min_topup: 1,
  stripe_min_topup: 1,
  amount_options: [5, 10, 25],
  discount: {
    25: 0.8,
  },
  topup_link: "https://example.test/redeem",
};

async function mockApi(page, options = {}) {
  const effectiveTopupInfo = {
    ...topupInfo,
    ...(options.topupInfo || {}),
  };
  const requests = [];
  const unhandled = [];

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    const body = request.postData() ? request.postDataJSON() : undefined;
    requests.push({
      method,
      pathname: url.pathname,
      search: url.search,
      params: Object.fromEntries(url.searchParams.entries()),
      body,
    });

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
          system_name: "new-api wallet runtime smoke",
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
      await fulfill({ success: true, data: effectiveTopupInfo });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/aff") {
      await fulfill({ success: true, data: "AFF-WALLET-RUNTIME-SMOKE" });
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

    if (
      method === "POST" &&
      (url.pathname === "/api/user/amount" ||
        url.pathname === "/api/user/stripe/amount" ||
        url.pathname === "/api/user/waffo-pancake/amount")
    ) {
      const amount = Number(body?.amount || 0);
      await fulfill({ success: true, data: String(amount * 0.8) });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/pay") {
      await fulfill({
        success: true,
        message: "success",
        url: "https://payments.example.test/runtime",
        data: {
          trade_no: "RUNTIME-SMOKE-ORDER",
          amount: body?.amount,
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/stripe/pay") {
      await fulfill({
        success: true,
        message: "success",
        data: {
          pay_link: "https://payments.example.test/stripe",
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/waffo-pancake/pay") {
      await fulfill({
        success: true,
        message: "success",
        data: {
          checkout_url: "https://payments.example.test/pancake",
          session_id: "wallet-runtime-pancake-session",
          order_id: "WAFFO-PANCAKE-RUNTIME-SMOKE",
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/topup") {
      await fulfill({
        success: true,
        message: "success",
        data: 500000,
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/aff_transfer") {
      await fulfill({
        success: true,
        message: "Transfer successful",
        data: null,
      });
      return;
    }

    unhandled.push(`${method} ${url.pathname}`);
    await fulfill({ success: false, message: `Unhandled ${method} ${url.pathname}` }, 404);
  });

  return { requests, unhandled };
}

async function seedAuthenticatedSession(page) {
  await page.addInitScript((storedUser) => {
    window.localStorage.setItem("i18nextLng", "en");
    window.localStorage.setItem("user", JSON.stringify(storedUser));
    window.localStorage.setItem("uid", String(storedUser.id));
    window.localStorage.setItem("setup_required", "false");
  }, user);
}

test.describe("wallet runtime interactions", () => {
  test("selects topup amounts, submits payment, redeems codes, and transfers affiliate rewards", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await seedAuthenticatedSession(page);
    await page.addInitScript(() => {
      window.open = (url) => {
        window.__walletRuntimeOpenedWindows = window.__walletRuntimeOpenedWindows || [];
        window.__walletRuntimeOpenedWindows.push(String(url));
        return null;
      };
    });
    page.on("popup", (popup) => popup.close());

    await page.goto("/wallet");

    await expect(page.getByRole("heading", { name: "Wallet" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add Funds" })).toBeVisible();
    await expect(page.getByText("Referral Program")).toBeVisible();

    await page.getByRole("button", { name: /25/ }).click();
    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "POST" &&
            request.pathname === "/api/user/amount" &&
            request.body?.amount === 25
        )
      )
      .toBe(true);

    const customAmount = page.getByLabel("Custom Amount");
    await customAmount.fill("17");
    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "POST" &&
            request.pathname === "/api/user/amount" &&
            request.body?.amount === 17
        )
      )
      .toBe(true);

    await page.getByRole("button", { name: "Runtime Pay" }).click();
    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog.getByRole("heading", { name: "Confirm Payment" })).toBeVisible();
    await expect(confirmDialog.getByText("Runtime Pay")).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Confirm Payment" }).click();

    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "POST" &&
            request.pathname === "/api/user/pay" &&
            request.body?.amount === 17 &&
            request.body?.payment_method === "runtime_pay"
        )
      )
      .toBe(true);

    await customAmount.fill("25");
    await page.getByRole("button", { name: "Stripe" }).click();
    const stripeDialog = page.getByRole("alertdialog");
    await expect(stripeDialog.getByRole("heading", { name: "Confirm Payment" })).toBeVisible();
    await expect(stripeDialog.getByText("Stripe")).toBeVisible();
    await stripeDialog.getByRole("button", { name: "Confirm Payment" }).click();

    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "POST" &&
            request.pathname === "/api/user/stripe/pay" &&
            request.body?.amount === 25 &&
            request.body?.payment_method === "stripe"
        )
      )
      .toBe(true);
    const windowUrls = await page.evaluate(() => window.__walletRuntimeOpenedWindows || []);
    expect(windowUrls).toContain("https://payments.example.test/stripe");

    await page.getByLabel("Have a Code?").fill("RUNTIME-CODE-123");
    await page.getByRole("button", { name: "Redeem" }).click();
    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "POST" &&
            request.pathname === "/api/user/topup" &&
            request.body?.key === "RUNTIME-CODE-123"
        )
      )
      .toBe(true);

    await page.getByRole("button", { name: "Transfer to Balance" }).click();
    const transferDialog = page.getByRole("dialog");
    await expect(transferDialog.getByRole("heading", { name: "Transfer Rewards" })).toBeVisible();
    await transferDialog.getByLabel("Transfer Amount").fill("1000000");
    await transferDialog.getByRole("button", { name: "Transfer" }).click();
    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "POST" &&
            request.pathname === "/api/user/aff_transfer" &&
            request.body?.quota === 1000000
        )
      )
      .toBe(true);

    expect(unhandled).toEqual([]);
  });

  test("honors wallet compliance flags for redemption and affiliate transfer", async ({ page }) => {
    const { unhandled } = await mockApi(page, {
      topupInfo: {
        enable_redemption: false,
        payment_compliance_confirmed: false,
      },
    });
    await seedAuthenticatedSession(page);

    await page.goto("/wallet");

    await expect(
      page.getByText("Redemption codes are disabled until the administrator confirms compliance terms.")
    ).toBeVisible();
    await expect(page.getByLabel("Have a Code?")).toHaveCount(0);

    const transferButton = page.getByRole("button", { name: "Transfer to Balance" });
    await expect(transferButton).toBeVisible();
    await expect(transferButton).toBeDisabled();
    await expect(
      page.getByText("Referral reward transfer is disabled until the administrator confirms compliance terms.")
    ).toBeVisible();

    expect(unhandled).toEqual([]);
  });

  test("redirects Waffo Pancake checkout in the current tab", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page, {
      topupInfo: {
        enable_waffo_pancake_topup: true,
        pay_methods: [
          { name: "Waffo Pancake", type: "waffo_pancake", min_topup: 1 },
        ],
      },
    });
    await seedAuthenticatedSession(page);
    await page.addInitScript(() => {
      window.open = (url) => {
        window.__walletRuntimeOpenedWindows = window.__walletRuntimeOpenedWindows || [];
        window.__walletRuntimeOpenedWindows.push(String(url));
        return null;
      };
    });
    await page.route("https://payments.example.test/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>Waffo Pancake checkout</body></html>",
      });
    });

    await page.goto("/wallet");
    await page.getByRole("button", { name: "Waffo Pancake" }).click();
    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog.getByRole("heading", { name: "Confirm Payment" })).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Confirm Payment" }).click();

    await page.waitForURL("https://payments.example.test/pancake");
    const windowUrls = await page.evaluate(() => window.__walletRuntimeOpenedWindows || []);
    expect(windowUrls).toEqual([]);

    const pancakePayRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/user/waffo-pancake/pay" &&
        request.body?.amount === 1
    );
    expect(pancakePayRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("renders wallet payment result pages", async ({ page }) => {
    await mockApi(page);
    await seedAuthenticatedSession(page);

    await page.goto("/wallet/success?amount=25");
    await expect(page.getByRole("heading", { name: "Payment Successful" })).toBeVisible();
    await expect(page.getByText("Amount: 25")).toBeVisible();
    await expect(page.getByText("Redirecting to wallet...")).toBeVisible();

    await page.goto("/wallet/cancel");
    await expect(page.getByRole("heading", { name: "Payment Cancelled" })).toBeVisible();
    await expect(page.getByText("Redirecting to wallet...")).toBeVisible();
  });
});
