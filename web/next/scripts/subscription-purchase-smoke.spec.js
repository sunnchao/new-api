/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 4242,
  username: "runtime-smoke",
  display_name: "Runtime Smoke",
  role: 1,
  status: 1,
  group: "default",
  quota: 100000,
  used_quota: 0,
  request_count: 0,
};

const selectedPlan = {
  plan: {
    id: 7007,
    title: "Runtime Smoke Pro",
    subtitle: "Selected handoff plan",
    price_amount: 12.34,
    currency: "USD",
    duration_unit: "month",
    duration_value: 1,
    quota_reset_period: "monthly",
    enabled: true,
    show_on_home: true,
    sort_order: 1,
    max_purchase_per_user: 3,
    total_amount: 250000,
    allowed_groups: "default",
    billing_mode: "quota",
    waffo_pancake_product_id: "pancake-product-7007",
  },
};

const otherPlan = {
  plan: {
    ...selectedPlan.plan,
    id: 7008,
    title: "Runtime Smoke Basic",
    subtitle: "Unselected plan",
    price_amount: 3.21,
    sort_order: 2,
    allow_balance_pay: false,
  },
};

const activeSubscription = {
  subscription: {
    id: 501,
    user_id: user.id,
    plan_id: selectedPlan.plan.id,
    status: "active",
    source: "self",
    billing_mode: "quota",
    start_time: 1_800_000_000,
    end_time: 1_803_000_000,
    amount_total: 250000,
    amount_used: 50000,
  },
};

const scheduledSubscription = {
  subscription: {
    ...activeSubscription.subscription,
    id: 502,
    status: "scheduled",
    start_time: 1_803_000_000,
    end_time: 1_805_500_000,
    amount_used: 0,
  },
};

const pricingData = {
  success: true,
  data: [
    {
      id: 9901,
      model_name: "smoke-visible-model",
      vendor_id: 77,
      quota_type: 0,
      model_ratio: 1,
      completion_ratio: 1,
      enable_groups: ["default"],
      supported_endpoint_types: ["chat"],
    },
    {
      id: 9902,
      model_name: "smoke-hidden-model",
      vendor_id: 77,
      quota_type: 0,
      model_ratio: 1,
      completion_ratio: 1,
      enable_groups: ["vip-only"],
      supported_endpoint_types: ["chat"],
    },
  ],
  vendors: [
    {
      id: 77,
      name: "Smoke Vendor",
      icon: "openai",
      description: "Subscription smoke vendor",
    },
  ],
  group_ratio: {},
  usable_group: {
    default: { desc: "Default", ratio: 1 },
  },
  supported_endpoint: {},
  auto_groups: [],
};

async function mockApi(page) {
  const requests = [];
  let selfMode = "empty";

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    requests.push({ method: request.method(), pathname: url.pathname });

    const fulfill = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (request.method() === "GET" && url.pathname === "/api/setup") {
      await fulfill({ success: true, data: { required: false } });
      return;
    }

    if (request.method() === "GET" && url.pathname === "/api/status") {
      await fulfill({
        success: true,
        data: {
          system_name: "new-api runtime smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
        },
      });
      return;
    }

    if (request.method() === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: user });
      return;
    }

    if (request.method() === "GET" && url.pathname === "/api/user/topup/info") {
      await fulfill({
        success: true,
        data: {
          enable_online_topup: false,
          enable_stripe_topup: false,
          enable_creem_topup: false,
          enable_waffo_pancake_topup: true,
          pay_methods: [],
          min_topup: 1,
          stripe_min_topup: 1,
          amount_options: [5, 10],
          discount: {},
        },
      });
      return;
    }

    if (request.method() === "GET" && url.pathname === "/api/pricing") {
      await fulfill(pricingData);
      return;
    }

    if (request.method() === "GET" && url.pathname === "/api/subscription/public/plans") {
      await fulfill({ success: true, data: [selectedPlan, otherPlan] });
      return;
    }

    if (request.method() === "GET" && url.pathname === "/api/subscription/plans") {
      await fulfill({ success: true, data: [selectedPlan, otherPlan] });
      return;
    }

    if (request.method() === "GET" && url.pathname === "/api/subscription/self") {
      const subscriptions =
        selfMode === "empty" ? [] : [activeSubscription];
      const allSubscriptions =
        selfMode === "scheduled"
          ? [activeSubscription, scheduledSubscription]
          : subscriptions;

      await fulfill({
        success: true,
        data: {
          billing_preference: "subscription_first",
          subscriptions,
          all_subscriptions: allSubscriptions,
        },
      });
      return;
    }

    if (request.method() === "POST" && url.pathname === "/api/subscription/balance/pay") {
      requests.push({
        method: request.method(),
        pathname: url.pathname,
        body: request.postDataJSON(),
      });
      await fulfill({ success: true, message: "success", data: { order_id: "smoke-order" } });
      return;
    }

    if (request.method() === "POST" && url.pathname === "/api/subscription/waffo-pancake/pay") {
      requests.push({
        method: request.method(),
        pathname: url.pathname,
        body: request.postDataJSON(),
      });
      await fulfill({
        success: true,
        message: "success",
        data: {
          checkout_url: "https://payments.example.test/subscription-pancake",
          order_id: "WAFFO_PANCAKE_SUB-smoke",
        },
      });
      return;
    }

    if (request.method() === "POST" && url.pathname === "/api/subscription/renew/balance/pay") {
      requests.push({
        method: request.method(),
        pathname: url.pathname,
        body: request.postDataJSON(),
      });
      selfMode = "scheduled";
      await fulfill({ success: true, message: "success", data: { order_id: "renew-order" } });
      return;
    }

    if (
      request.method() === "POST" &&
      url.pathname === `/api/subscription/scheduled/${scheduledSubscription.subscription.id}/activate`
    ) {
      requests.push({
        method: request.method(),
        pathname: url.pathname,
      });
      await fulfill({ success: true, message: "success" });
      return;
    }

    await fulfill(
      { success: false, message: `Unhandled ${request.method()} ${url.pathname}` },
      404
    );
  });

  return {
    requests,
    setSelfMode: (mode) => {
      selfMode = mode;
    },
  };
}

test.describe("subscription selected-plan purchase handoff", () => {
  test("opens purchase dialog for the selected public plan", async ({ page }) => {
    const { requests } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/subscription-plans");
    await expect(page.getByRole("heading", { name: "Subscription Plans" })).toBeVisible();
    await expect(page.getByText("Runtime Smoke Pro")).toBeVisible();

    const selectedCard = page.getByTestId(`subscription-plan-${selectedPlan.plan.id}`);
    await expect(selectedCard.getByRole("heading", { name: "Runtime Smoke Pro" })).toBeVisible();
    await selectedCard.getByTestId(`subscribe-plan-${selectedPlan.plan.id}`).click();

    await page.waitForURL(/\/my-subscriptions\?plan_id=7007$/);
    const purchaseDialog = page.getByRole("dialog");
    await expect(purchaseDialog).toBeVisible();
    await expect(purchaseDialog.getByRole("heading", { name: "Purchase Subscription" })).toBeVisible();
    await expect(purchaseDialog.getByText("Runtime Smoke Pro")).toBeVisible();
    await expect(page).toHaveURL(/\/my-subscriptions$/);

    await purchaseDialog.getByRole("button", { name: "Balance Pay" }).click();
    await expect(page.getByText("Purchase successful")).toBeVisible();

    const balanceRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/subscription/balance/pay" &&
        request.body?.plan_id === selectedPlan.plan.id
    );
    expect(balanceRequest).toBeTruthy();
  });

  test("opens purchase dialog from legacy subscribe_plan checkout links", async ({ page }) => {
    await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/console/subscriptions?subscribe_plan=7007");
    const purchaseDialog = page.getByRole("dialog");
    await expect(purchaseDialog.getByRole("heading", { name: "Purchase Subscription" })).toBeVisible();
    await expect(purchaseDialog.getByText("Runtime Smoke Pro")).toBeVisible();
    await expect(page).toHaveURL(/\/my-subscriptions$/);
  });

  test("starts Waffo Pancake checkout for a configured subscription plan in the current tab", async ({ page }) => {
    const { requests } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
      window.open = (url) => {
        window.__subscriptionPurchaseOpenedWindows =
          window.__subscriptionPurchaseOpenedWindows || [];
        window.__subscriptionPurchaseOpenedWindows.push(String(url));
        return null;
      };
    }, user);
    await page.route("https://payments.example.test/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>Subscription Waffo Pancake checkout</body></html>",
      });
    });

    await page.goto("/my-subscriptions?plan_id=7007");
    const purchaseDialog = page.getByRole("dialog");
    await expect(purchaseDialog.getByRole("heading", { name: "Purchase Subscription" })).toBeVisible();
    await expect(purchaseDialog.getByText("Runtime Smoke Pro")).toBeVisible();
    await expect(purchaseDialog.getByRole("button", { name: "Waffo Pancake" })).toBeVisible();

    await purchaseDialog.getByRole("button", { name: "Waffo Pancake" }).click();
    await page.waitForURL("https://payments.example.test/subscription-pancake");
    await expect(page.getByText("Subscription Waffo Pancake checkout")).toBeVisible();

    const openedWindows = await page.evaluate(
      () => window.__subscriptionPurchaseOpenedWindows || []
    );
    expect(openedWindows).toEqual([]);

    const pancakeRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/subscription/waffo-pancake/pay" &&
        request.body?.plan_id === selectedPlan.plan.id
    );
    expect(pancakeRequest).toBeTruthy();
  });

  test("hides balance payment when the selected plan disallows it", async ({ page }) => {
    const { requests } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/my-subscriptions?plan_id=7008");
    const purchaseDialog = page.getByRole("dialog");
    await expect(purchaseDialog.getByRole("heading", { name: "Purchase Subscription" })).toBeVisible();
    await expect(purchaseDialog.getByText("Runtime Smoke Basic")).toBeVisible();
    await expect(purchaseDialog.getByRole("button", { name: "Balance Pay" })).toHaveCount(0);
    await expect(purchaseDialog.getByRole("button", { name: "Waffo Pancake" })).toBeVisible();

    const balanceRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/subscription/balance/pay" &&
        request.body?.plan_id === otherPlan.plan.id
    );
    expect(balanceRequest).toBeFalsy();
  });

  test("renews an active subscription with user_subscription_id and activates scheduled renewal", async ({ page }) => {
    const { requests, setSelfMode } = await mockApi(page);
    setSelfMode("active");

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/my-subscriptions");
    await expect(page.getByRole("heading", { name: "Subscription Plans" })).toBeVisible();
    await expect(page.getByText("Runtime Smoke Pro · Subscription #501")).toBeVisible();

    await page.getByRole("button", { name: "Renew" }).click();
    const renewDialog = page.getByRole("dialog");
    await expect(renewDialog).toBeVisible();
    await expect(renewDialog.getByRole("heading", { name: "Renew Subscription" })).toBeVisible();
    await expect(renewDialog.getByText("#501")).toBeVisible();

    await renewDialog.getByRole("button", { name: "Balance Pay" }).click();
    await expect(page.getByText("Renewal successful")).toBeVisible();

    const renewRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/subscription/renew/balance/pay" &&
        request.body?.user_subscription_id === activeSubscription.subscription.id
    );
    expect(renewRequest).toBeTruthy();
    expect(renewRequest.body).not.toHaveProperty("plan_id");

    await expect(page.getByText("Runtime Smoke Pro · Subscription #502")).toBeVisible();
    await expect(page.getByText("Pending").first()).toBeVisible();
    await expect(page.getByText("Scheduled to activate at")).toBeVisible();
    await expect(page.getByText("Estimated expiry")).toBeVisible();

    await page.getByRole("button", { name: "Activate Now" }).click();
    await expect(page.getByRole("dialog").getByText("Activate subscription now")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Activate Now" }).click();

    const activateRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === `/api/subscription/scheduled/${scheduledSubscription.subscription.id}/activate`
    );
    expect(activateRequest).toBeTruthy();
  });

  test("opens supported models dialog from wallet plan cards", async ({ page }) => {
    await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/my-subscriptions");
    await expect(page.getByRole("heading", { name: "Subscription Plans" })).toBeVisible();
    await expect(page.getByText("Runtime Smoke Pro")).toBeVisible();

    await page.getByRole("button", { name: "View all models" }).first().click();

    const modelsDialog = page.getByRole("dialog");
    await expect(modelsDialog.getByRole("heading", { name: "Supported Models" })).toBeVisible();
    await expect(modelsDialog.getByText("Models available for Runtime Smoke Pro")).toBeVisible();
    await expect(modelsDialog.getByText("smoke-visible-model")).toBeVisible();
    await expect(modelsDialog.getByText("smoke-hidden-model")).toHaveCount(0);
  });
});
