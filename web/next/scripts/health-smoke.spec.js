/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 8801,
  username: "health-smoke-admin",
  display_name: "Health Smoke Admin",
  email: "health-smoke-admin@example.com",
  role: 100,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 0,
  request_count: 0,
  permissions: {
    sidebar_settings: false,
  },
};

const modelPayload = {
  success: true,
  data: {
    items: [
      {
        id: 9101,
        model_name: "shared-health-model",
        vendor_id: 77,
        status: 1,
        sync_official: 1,
        created_time: 1760000000,
        updated_time: 1760000100,
        name_rule: 0,
        bound_channels: [
          {
            name: "Shared Smoke Provider",
            type: 8,
          },
        ],
      },
      {
        id: 9102,
        model_name: "unknown-health-model",
        vendor_id: 78,
        status: 1,
        sync_official: 1,
        created_time: 1760000000,
        updated_time: 1760000100,
        name_rule: 0,
        bound_channels: [],
      },
    ],
    total: 2,
    page: 0,
    page_size: 9999,
  },
};

const channelPayload = {
  success: true,
  data: {
    items: [
      {
        id: 9201,
        type: 1,
        key: "",
        openai_organization: null,
        test_model: null,
        status: 0,
        name: "Shared Smoke Provider",
        weight: 1,
        created_time: 1760000000,
        test_time: 1760000000,
        response_time: 900,
        base_url: null,
        other: "",
        balance: 0,
        balance_updated_time: 0,
        models: "other-model",
        group: "default",
        used_quota: 0,
        model_mapping: null,
        status_code_mapping: null,
        priority: 1,
        auto_ban: 1,
        other_info: "",
        tag: null,
        setting: null,
        param_override: null,
        header_override: null,
        remark: "",
        max_input_tokens: 0,
        channel_info: {
          is_multi_key: false,
          multi_key_size: 0,
          multi_key_polling_index: 0,
          multi_key_mode: "random",
        },
        settings: "{}",
      },
      {
        id: 9202,
        type: 8,
        key: "",
        openai_organization: null,
        test_model: null,
        status: 1,
        name: "Shared Smoke Provider",
        weight: 2,
        created_time: 1760000000,
        test_time: 1760000400,
        response_time: 620,
        base_url: null,
        other: "",
        balance: 0,
        balance_updated_time: 0,
        models: "shared-health-model",
        group: "default",
        used_quota: 0,
        model_mapping: null,
        status_code_mapping: null,
        priority: 2,
        auto_ban: 1,
        other_info: "",
        tag: null,
        setting: null,
        param_override: null,
        header_override: null,
        remark: "",
        max_input_tokens: 0,
        channel_info: {
          is_multi_key: false,
          multi_key_size: 0,
          multi_key_polling_index: 0,
          multi_key_mode: "random",
        },
        settings: "{}",
      },
    ],
    total: 2,
    page: 0,
    page_size: 9999,
  },
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
          system_name: "new-api health smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: user });
      return;
    }

    if (method === "GET" && url.pathname === "/api/option/") {
      await fulfill({ success: true, data: null });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self/groups") {
      await fulfill({
        success: true,
        data: {
          default: { desc: "Default group", ratio: 1 },
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/models/") {
      await fulfill(modelPayload);
      return;
    }

    if (method === "GET" && url.pathname === "/api/channel") {
      await fulfill(channelPayload);
      return;
    }

    if (method === "GET" && url.pathname === "/api/perf-metrics/summary") {
      await fulfill({
        success: true,
        data: {
          models: [
            {
              model_name: "shared-health-model",
              avg_latency_ms: 620,
              success_rate: 99.9,
              avg_tps: 18,
            },
          ],
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/perf-metrics") {
      await fulfill({ success: false, message: "model is required" }, 400);
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

async function authenticate(page) {
  await page.addInitScript((storedUser) => {
    window.localStorage.setItem("i18nextLng", "en");
    window.localStorage.setItem("user", JSON.stringify(storedUser));
    window.localStorage.setItem("uid", String(storedUser.id));
    window.localStorage.setItem("setup_required", "false");
  }, user);
}

test.describe("health runtime surface", () => {
  test("matches bound channels by name and provider type without empty-model trend calls", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/health");
    await expect(
      page.getByRole("heading", { name: "Health Dashboard" })
    ).toBeVisible();

    const modelRow = page.getByRole("row", { name: /shared-health-model/ });
    await expect(
      modelRow.getByRole("cell", { name: "shared-health-model" })
    ).toBeVisible();
    await expect(modelRow.getByText("Healthy", { exact: true })).toBeVisible();
    await expect(modelRow.getByRole("cell", { name: "1/1" })).toBeVisible();
    await expect(modelRow.getByRole("cell", { name: "620ms" })).toBeVisible();

    const modelRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/models/" &&
        request.params.p === "0" &&
        request.params.page_size === "9999"
    );
    const channelRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/channel" &&
        request.params.p === "0" &&
        request.params.page_size === "9999"
    );

    await expect
      .poll(
        () =>
          requests.some(
            (request) =>
              request.method === "GET" &&
              request.pathname === "/api/perf-metrics/summary" &&
              request.params.hours === "24"
          ),
        { timeout: 10_000 }
      )
      .toBe(true);

    const emptyModelDetailRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/perf-metrics" &&
        !request.params.model
    );

    expect(modelRequest).toBeTruthy();
    expect(channelRequest).toBeTruthy();
    expect(emptyModelDetailRequest).toBeFalsy();
    expect(unhandled).toEqual([]);
  });
});
