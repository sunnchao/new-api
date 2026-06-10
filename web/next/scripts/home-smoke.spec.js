/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const homePlan = {
  plan: {
    id: 8301,
    title: "Home Smoke Pro",
    subtitle: "Homepage subscription model access",
    price_amount: 9.99,
    currency: "USD",
    duration_unit: "month",
    duration_value: 1,
    quota_reset_period: "monthly",
    quota_reset_mode: "anchor",
    enabled: true,
    show_on_home: true,
    sort_order: 1,
    max_purchase_per_user: 2,
    total_amount: 250000,
    allowed_groups: "default",
    billing_mode: "quota",
    daily_limit_amount: 50000,
    daily_reset_mode: "natural",
  },
};

async function mockApi(page) {
  const requests = [];
  const unhandled = [];

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
          system_name: "new-api home smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/home_page_content") {
      await fulfill({ success: true, data: "" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/subscription/home/plans") {
      await fulfill({ success: true, data: [homePlan] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/pricing") {
      await fulfill({
        success: true,
        data: [
          {
            id: 9901,
            model_name: "gpt-home-smoke",
            description: "Visible to default group",
            vendor_id: 12,
            quota_type: 0,
            model_ratio: 1,
            completion_ratio: 1,
            enable_groups: ["default"],
          },
          {
            id: 9902,
            model_name: "gpt-hidden-smoke",
            description: "Hidden from the plan group",
            vendor_id: 13,
            quota_type: 0,
            model_ratio: 1,
            completion_ratio: 1,
            enable_groups: ["vip"],
          },
        ],
        vendors: [
          {
            id: 12,
            name: "Smoke Vendor",
            icon: "OpenAI",
            description: "Homepage smoke vendor",
          },
          {
            id: 13,
            name: "Hidden Vendor",
            icon: "Claude",
            description: "Hidden vendor",
          },
        ],
        group_ratio: {},
        usable_group: {},
        supported_endpoint: {},
        auto_groups: [],
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

test.describe("home subscription smoke", () => {
  test("shows homepage subscription model access for allowed groups", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.removeItem("home_page_content");
    });

    await page.goto("/");

    await expect(page.getByText("Home Smoke Pro")).toBeVisible();
    const viewModels = page.getByRole("button", { name: "View all models" });
    await expect(viewModels).toBeVisible();

    await viewModels.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Supported Models" })).toBeVisible();
    await expect(dialog.getByText("gpt-home-smoke")).toBeVisible();
    await expect(dialog.getByText("gpt-hidden-smoke")).toHaveCount(0);

    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/subscription/home/plans"
      )
    ).toBeTruthy();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" && request.pathname === "/api/pricing"
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
