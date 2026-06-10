/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const rankedModel = {
  id: 5101,
  model_name: "openrouter/slashy-rank",
  description: "Rankings smoke slash-name pricing model",
  vendor_id: 31,
  quota_type: 0,
  model_ratio: 1.1,
  completion_ratio: 2.2,
  cache_ratio: 0.15,
  enable_groups: ["default"],
  tags: "chat,rankings",
  supported_endpoint_types: ["openai-chat"],
};

const secondModelName = "anthropic/steady-rank";

function buildRankingsSnapshot(period) {
  const labelPrefix = period === "today" ? "12:00" : "Jun";

  return {
    models: [
      {
        rank: 1,
        previous_rank: 2,
        model_name: rankedModel.model_name,
        vendor: "OpenRouter",
        vendor_icon: "OpenAI",
        category: "all",
        total_tokens: 4_200_000,
        share: 0.64,
        growth_pct: 18.5,
      },
      {
        rank: 2,
        previous_rank: 1,
        model_name: secondModelName,
        vendor: "Anthropic",
        vendor_icon: "Claude",
        category: "all",
        total_tokens: 2_400_000,
        share: 0.36,
        growth_pct: -4.2,
      },
    ],
    vendors: [
      {
        rank: 1,
        vendor: "OpenRouter",
        vendor_icon: "OpenAI",
        total_tokens: 4_200_000,
        share: 0.64,
        growth_pct: 18.5,
        models_count: 1,
        top_model: rankedModel.model_name,
      },
      {
        rank: 2,
        vendor: "Anthropic",
        vendor_icon: "Claude",
        total_tokens: 2_400_000,
        share: 0.36,
        growth_pct: -4.2,
        models_count: 1,
        top_model: secondModelName,
      },
    ],
    top_movers: [
      {
        model_name: rankedModel.model_name,
        vendor: "OpenRouter",
        vendor_icon: "OpenAI",
        rank_delta: 3,
        current_rank: 1,
        growth_pct: 18.5,
      },
    ],
    top_droppers: [
      {
        model_name: secondModelName,
        vendor: "Anthropic",
        vendor_icon: "Claude",
        rank_delta: -2,
        current_rank: 2,
        growth_pct: -4.2,
      },
    ],
    models_history: {
      points: [
        {
          ts: "2026-06-01T00:00:00.000Z",
          label: `${labelPrefix} 1`,
          model: rankedModel.model_name,
          vendor: "OpenRouter",
          tokens: 1_800_000,
        },
        {
          ts: "2026-06-01T00:00:00.000Z",
          label: `${labelPrefix} 1`,
          model: secondModelName,
          vendor: "Anthropic",
          tokens: 900_000,
        },
        {
          ts: "2026-06-02T00:00:00.000Z",
          label: `${labelPrefix} 2`,
          model: rankedModel.model_name,
          vendor: "OpenRouter",
          tokens: 2_400_000,
        },
        {
          ts: "2026-06-02T00:00:00.000Z",
          label: `${labelPrefix} 2`,
          model: secondModelName,
          vendor: "Anthropic",
          tokens: 1_500_000,
        },
      ],
      models: [
        { name: rankedModel.model_name, vendor: "OpenRouter", total: 4_200_000 },
        { name: secondModelName, vendor: "Anthropic", total: 2_400_000 },
      ],
      buckets: 2,
    },
    vendor_share_history: {
      points: [
        {
          ts: "2026-06-01T00:00:00.000Z",
          label: `${labelPrefix} 1`,
          vendor: "OpenRouter",
          share: 0.66,
          tokens: 1_800_000,
        },
        {
          ts: "2026-06-01T00:00:00.000Z",
          label: `${labelPrefix} 1`,
          vendor: "Anthropic",
          share: 0.34,
          tokens: 900_000,
        },
        {
          ts: "2026-06-02T00:00:00.000Z",
          label: `${labelPrefix} 2`,
          vendor: "OpenRouter",
          share: 0.62,
          tokens: 2_400_000,
        },
        {
          ts: "2026-06-02T00:00:00.000Z",
          label: `${labelPrefix} 2`,
          vendor: "Anthropic",
          share: 0.38,
          tokens: 1_500_000,
        },
      ],
      vendors: [
        { name: "OpenRouter", total: 4_200_000, share: 0.64 },
        { name: "Anthropic", total: 2_400_000, share: 0.36 },
      ],
      buckets: 2,
    },
  };
}

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
          system_name: "new-api rankings smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          price: 1,
          usd_exchange_rate: 1,
          server_address: "https://gateway.example.com",
          HeaderNavModules: JSON.stringify({
            rankings: { enabled: true, requireAuth: false },
          }),
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: "" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/rankings") {
      await fulfill({
        success: true,
        data: buildRankingsSnapshot(url.searchParams.get("period") || "week"),
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/pricing") {
      await fulfill({
        success: true,
        data: [rankedModel],
        vendors: [
          {
            id: 31,
            name: "OpenRouter",
            icon: "OpenAI",
            description: "Rankings smoke pricing vendor",
          },
        ],
        group_ratio: { default: 1 },
        usable_group: {
          default: { desc: "Default Smoke Group", ratio: 1 },
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
              model_name: rankedModel.model_name,
              avg_latency_ms: 280,
              success_rate: 99.7,
              avg_tps: 28,
              request_count: 36,
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
              avg_ttft_ms: 110,
              avg_latency_ms: 280,
              success_rate: 99.7,
              avg_tps: 28,
              series: [
                {
                  ts: 1760000000,
                  avg_ttft_ms: 110,
                  avg_latency_ms: 280,
                  success_rate: 99.7,
                  avg_tps: 28,
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

test.describe("rankings public smoke", () => {
  test("loads rankings by period and links slash-name models to pricing details", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
    });

    await page.goto("/rankings?period=month");

    await expect(page.getByRole("heading", { name: "Rankings" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Month" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.getByRole("heading", { name: "Top Models" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Market Share" })).toBeVisible();
    await expect(page.getByText(rankedModel.model_name).first()).toBeVisible();
    await expect(page.getByText("Trending up")).toBeVisible();

    await page.getByRole("tab", { name: "Today" }).click();
    await expect(page).toHaveURL(/\/rankings\?period=today$/);
    await expect(page.getByRole("tab", { name: "Today" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "GET" &&
            request.pathname === "/api/rankings" &&
            request.params.period === "today"
        )
      )
      .toBeTruthy();

    await page
      .getByRole("link", { name: rankedModel.model_name })
      .first()
      .click();

    await expect(page).toHaveURL(
      new RegExp(`/pricing/${encodeURIComponent(rankedModel.model_name)}$`)
    );
    await expect(page.getByText(rankedModel.model_name).first()).toBeVisible();
    await expect(page.getByText("Pricing by Group")).toBeVisible();

    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/rankings" &&
          request.params.period === "month"
      )
    ).toBeTruthy();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/pricing"
      )
    ).toBeTruthy();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/perf-metrics" &&
          request.params.model === rankedModel.model_name
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("uses localized feature copy for rankings sections", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page);

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.setItem("i18nextLng", "zh");
    });

    await page.goto("/rankings?period=month");

    await expect(page.getByRole("heading", { name: "排行榜" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "本月" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.getByRole("heading", { name: "热门模型" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "市场份额" })).toBeVisible();
    await expect(page.getByText("上升趋势")).toBeVisible();
    await expect(page.getByText("Top Models")).toHaveCount(0);
    await expect(page.getByText("Market Share")).toHaveCount(0);

    expect(unhandled).toEqual([]);
  });
});
