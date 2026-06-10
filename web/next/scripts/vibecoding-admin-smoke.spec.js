/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const adminUser = {
  id: 8801,
  username: "vibecoding-admin-smoke",
  display_name: "VibeCoding Admin Smoke",
  email: "vibecoding-admin-smoke@example.com",
  role: 10,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 0,
  request_count: 0,
};

const normalUser = {
  ...adminUser,
  id: 8802,
  username: "vibecoding-user-smoke",
  display_name: "VibeCoding User Smoke",
  email: "vibecoding-user-smoke@example.com",
  role: 1,
};

function parseJsonBody(request) {
  const body = request.postData();
  if (!body) return undefined;
  return JSON.parse(body);
}

async function mockApi(page, user) {
  const requests = [];
  const unhandled = [];
  const subscriptions = [
    {
      id: 9901,
      user_id: 7701,
      username: "claude-active",
      user_display_name: "Claude Active",
      user_email: "claude-active@example.com",
      user_group: "default",
      plan_id: 6601,
      plan_title: "Claude Code Monthly",
      status: "active",
      billing_mode: "quota",
      start_time: 1717200000,
      end_time: 1719792000,
      amount_total: 100000,
      amount_used: 25000,
      amount_remaining: 75000,
    },
  ];

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    const params = Object.fromEntries(url.searchParams.entries());
    const body = method === "GET" ? undefined : parseJsonBody(request);
    requests.push({ method, pathname: url.pathname, params, body });

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
          system_name: "new-api vibecoding admin smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: "" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: user });
      return;
    }

    if (method === "GET" && url.pathname === "/api/subscription/admin/all") {
      await fulfill({
        success: true,
        data: {
          data: subscriptions,
          total: subscriptions.length,
          page: Number(params.page || 1),
          page_size: Number(params.page_size || 100),
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/subscription/plans") {
      await fulfill({
        success: true,
        data: [
          {
            plan: {
              id: 6601,
              title: "Claude Code Monthly",
              subtitle: "AI programming subscription",
              price_amount: 19,
              duration_unit: "month",
              duration_value: 1,
              enabled: true,
              sort_order: 10,
            },
          },
        ],
      });
      return;
    }

    if (
      method === "POST" &&
      url.pathname === "/api/subscription/admin/users/7702/subscriptions"
    ) {
      subscriptions.unshift({
        id: 9902,
        user_id: 7702,
        username: "grant-target",
        user_display_name: "Grant Target",
        user_email: "grant-target@example.com",
        user_group: "default",
        plan_id: body.plan_id,
        plan_title: "Claude Code Monthly",
        status: "active",
        billing_mode: "quota",
        start_time: 1719880000,
        end_time: 1722472000,
        amount_total: 100000,
        amount_used: 0,
        amount_remaining: 100000,
      });
      await fulfill({ success: true, message: "granted" });
      return;
    }

    if (
      method === "POST" &&
      url.pathname === "/api/subscription/admin/user_subscriptions/9901/invalidate"
    ) {
      const subscription = subscriptions.find((item) => item.id === 9901);
      if (subscription) subscription.status = "cancelled";
      await fulfill({ success: true, message: "cancelled" });
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

async function seedUser(page, user) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("setup_required", "false");
    window.localStorage.setItem("user", JSON.stringify(value));
    window.localStorage.setItem("uid", String(value.id));
  }, user);
}

test.describe("VibeCoding admin smoke", () => {
  test("role 10 admin manages Claude Code subscriptions through generic backend endpoints", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, adminUser);
    await seedUser(page, adminUser);

    await page.goto("/vibecoding/admin");

    await expect(
      page.getByRole("heading", { name: "Claude Code Subscription Management" })
    ).toBeVisible();
    await expect(page.getByText("claude-active")).toBeVisible();
    await expect(page.getByText("Claude Code Monthly")).toBeVisible();

    await page.getByRole("button", { name: "Grant Subscription" }).click();
    await page.getByPlaceholder("Enter user ID").fill("7702");
    await expect(page.getByRole("button", { name: "Confirm" })).toBeEnabled();
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("grant-target")).toBeVisible();

    await page
      .getByRole("row", { name: /claude-active/ })
      .getByRole("button", { name: "Cancel" })
      .click();
    await expect(
      page.getByRole("row", { name: /claude-active/ }).getByText("cancelled")
    ).toBeVisible();

    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/subscription/admin/all" &&
          request.params.page === "1" &&
          request.params.page_size === "100"
      )
    ).toBeTruthy();
    expect(
      requests.some(
        (request) =>
          request.method === "POST" &&
          request.pathname ===
            "/api/subscription/admin/users/7702/subscriptions" &&
          request.body?.plan_id === 6601
      )
    ).toBeTruthy();
    expect(
      requests.some(
        (request) =>
          request.method === "POST" &&
          request.pathname ===
            "/api/subscription/admin/user_subscriptions/9901/invalidate"
      )
    ).toBeTruthy();
    expect(
      requests.some((request) => request.pathname.startsWith("/api/vibecoding"))
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });

  test("normal users are redirected away from VibeCoding admin", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, normalUser);
    await seedUser(page, normalUser);

    await page.goto("/vibecoding/admin");

    await expect(page).toHaveURL(/\/403$/);
    await expect(page.getByText("403")).toBeVisible();
    expect(
      requests.some((request) =>
        request.pathname.startsWith("/api/subscription/admin")
      )
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });
});
