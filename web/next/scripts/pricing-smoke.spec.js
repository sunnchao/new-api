/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const visibleModel = {
  id: 4101,
  model_name: "openrouter/slashy-smoke",
  description: "Visible slash-name pricing model",
  vendor_id: 21,
  quota_type: 0,
  model_ratio: 1.25,
  completion_ratio: 2.5,
  cache_ratio: 0.2,
  enable_groups: ["default"],
  tags: "chat,vision",
  supported_endpoint_types: ["openai-chat"],
};

const hiddenModel = {
  id: 4102,
  model_name: "vip-hidden-smoke",
  description: "Hidden from default pricing group",
  vendor_id: 22,
  quota_type: 0,
  model_ratio: 3,
  completion_ratio: 6,
  enable_groups: ["vip"],
  tags: "vip",
  supported_endpoint_types: ["openai-chat"],
};

async function mockApi(page) {
  const requests = [];
  const unhandled = [];

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    const params = Object.fromEntries(url.searchParams.entries());
    requests.push({ method, pathname: url.pathname, params });

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
          system_name: "new-api pricing smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          price: 1,
          usd_exchange_rate: 1,
          server_address: "https://gateway.example.com",
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/pricing") {
      await fulfill({
        success: true,
        data: [visibleModel, hiddenModel],
        vendors: [
          {
            id: 21,
            name: "Visible Vendor",
            icon: "OpenAI",
            description: "Visible pricing vendor",
          },
          {
            id: 22,
            name: "Hidden Vendor",
            icon: "Claude",
            description: "Hidden pricing vendor",
          },
        ],
        group_ratio: {
          default: 1,
          vip: 2,
        },
        usable_group: {
          default: { desc: "Default Smoke Group", ratio: 1 },
          vip: { desc: "VIP Smoke Group", ratio: 2 },
        },
        supported_endpoint: {
          "openai-chat": {
            path: "/v1/chat/completions",
            method: "POST",
          },
        },
        auto_groups: [],
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/perf-metrics/summary") {
      await fulfill({
        success: true,
        data: {
          models: [
            {
              model_name: visibleModel.model_name,
              avg_latency_ms: 320,
              success_rate: 99.9,
              avg_tps: 31,
              request_count: 42,
            },
          ],
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/perf-metrics") {
      await fulfill({
        success: true,
        data: {
          model_name: url.searchParams.get("model"),
          groups: [
            {
              group: "default",
              avg_ttft_ms: 120,
              avg_latency_ms: 320,
              success_rate: 99.9,
              avg_tps: 31,
              series: [
                {
                  ts: 1760000000,
                  avg_ttft_ms: 120,
                  avg_latency_ms: 320,
                  success_rate: 99.9,
                  avg_tps: 31,
                },
              ],
            },
          ],
        },
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

test.describe("pricing public smoke", () => {
  test("honors group query and opens slash-name model details", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
    });

    await page.goto("/pricing?group=default");

    await expect(page.getByRole("heading", { name: "Model Square" })).toBeVisible();
    await expect(page.getByText(visibleModel.model_name)).toBeVisible();
    await expect(page.getByText(hiddenModel.model_name)).toHaveCount(0);
    await expect(page.getByText("Default Smoke Group")).toBeVisible();

    await page
      .getByText(visibleModel.model_name)
      .locator("xpath=ancestor::div[contains(@class, 'rounded-xl')][1]")
      .getByRole("button", { name: /Details/ })
      .click();

    const drawer = page.getByRole("dialog");
    await expect(
      drawer.locator("h1").filter({ hasText: visibleModel.model_name })
    ).toBeVisible();
    await expect(drawer.getByText("Pricing by Group")).toBeVisible();

    await drawer.getByRole("tab", { name: "Performance" }).click();
    await expect(drawer.getByText("Per-group performance")).toBeVisible();

    await page.goto(
      `/pricing/${encodeURIComponent(visibleModel.model_name)}?group=default`
    );
    await expect(page.getByText(visibleModel.model_name).first()).toBeVisible();
    await expect(page.getByText("Pricing by Group")).toBeVisible();

    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/pricing\?group=default$/);

    expect(
      requests.some(
        (request) =>
          request.method === "GET" && request.pathname === "/api/pricing"
      )
    ).toBeTruthy();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/perf-metrics" &&
          request.params.model === visibleModel.model_name
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
