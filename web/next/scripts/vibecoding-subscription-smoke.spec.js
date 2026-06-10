/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const normalUser = {
  id: 8810,
  username: "vibecoding-subscription-smoke",
  display_name: "VibeCoding Subscription Smoke",
  email: "vibecoding-subscription-smoke@example.com",
  role: 1,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 0,
  request_count: 0,
};

async function mockApi(page) {
  const requests = [];
  const unhandled = [];

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    requests.push({ method, pathname: url.pathname });

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
          system_name: "new-api vibecoding subscription smoke",
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
      await fulfill({ success: true, data: normalUser });
      return;
    }

    if (method === "GET" && url.pathname === "/api/subscription/self") {
      await fulfill({
        success: true,
        data: {
          subscriptions: [
            {
              subscription: {
                id: 9905,
                user_id: normalUser.id,
                plan_id: 6605,
                status: "active",
                start_time: 1717200000,
                end_time: 1719792000,
              },
              plan: {
                id: 6605,
                title: "Claude Code Monthly",
              },
            },
          ],
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
              id: 6605,
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

    unhandled.push(`${method} ${url.pathname}`);
    await fulfill(
      { success: false, message: `Unhandled ${method} ${url.pathname}` },
      404
    );
  });

  return { requests, unhandled };
}

async function seedUser(page) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("setup_required", "false");
    window.localStorage.setItem("user", JSON.stringify(value));
    window.localStorage.setItem("uid", String(value.id));
  }, normalUser);
}

test.describe("VibeCoding Claude subscription route", () => {
  test("normal users render Claude Code subscription status via generic subscription APIs", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await seedUser(page);

    await page.goto("/vibecoding/claude/subscription");

    await expect(
      page.getByText("Your Claude Code subscription is active")
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "My Subscriptions" })
    ).toBeVisible();
    await expect(page.getByText("Claude Code Monthly").first()).toBeVisible();
    await expect(page.getByText("Active", { exact: true })).toBeVisible();

    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/subscription/self"
      )
    ).toBeTruthy();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/subscription/plans"
      )
    ).toBeTruthy();
    expect(
      requests.some((request) => request.pathname.startsWith("/api/vibecoding"))
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });
});
