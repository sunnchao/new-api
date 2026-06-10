/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 6202,
  username: "usage-logs-smoke",
  display_name: "Usage Logs Smoke",
  role: 100,
  status: 1,
  group: "default",
  quota: 100000,
  used_quota: 0,
  request_count: 0,
  permissions: {
    sidebar_settings: false,
  },
};

const normalUser = {
  ...user,
  id: 6203,
  username: "usage-logs-normal-smoke",
  display_name: "Usage Logs Normal Smoke",
  role: 1,
};

function encodeExpr(expr) {
  return Buffer.from(expr, "utf8").toString("base64");
}

const fixedRequestBillingExpr = `apply_request_rules((tier("base", p * 2 + c * 8)), "${encodeExpr(
  JSON.stringify({
    version: 1,
    groups: [
      {
        conditions: [
          {
            source: "param",
            path: "stream",
            mode: "eq",
            value: "true",
          },
        ],
        action_type: "fixed",
        multiplier: "",
        fixed_price: "0.125",
      },
    ],
  })
)}")`;

const commonLogs = [
  {
    id: 8801,
    user_id: user.id,
    created_at: 1717203000,
    type: 0,
    content: "Smoke common request",
    username: user.username,
    token_name: "smoke-token",
    model_name: "smoke-common-model",
    quota: 1234,
    prompt_tokens: 10,
    completion_tokens: 20,
    use_time: 456,
    is_stream: false,
    channel: 42,
    channel_name: "smoke-channel",
    token_id: 77,
    group: "default",
    ip: "127.0.0.1",
    request_ip: "127.0.0.1",
    other: JSON.stringify({
      admin_info: {
        channel_affinity: {
          rule_name: "smoke-affinity-rule",
          using_group: "default",
          key_hint: "sk-smoke***",
          key_fp: "PLACEHOLDER_FP",
        },
      },
    }),
    request_id: "req-common-smoke",
    upstream_request_id: "up-common-smoke",
  },
  {
    id: 8804,
    user_id: user.id,
    created_at: 1717203300,
    type: 10,
    content: "Subscription log smoke",
    username: user.username,
    token_name: "subscription-token",
    model_name: "subscription-model",
    quota: 3456,
    prompt_tokens: 12,
    completion_tokens: 34,
    use_time: 678,
    is_stream: false,
    channel: 45,
    channel_name: "subscription-channel",
    token_id: 80,
    group: "default",
    ip: "127.0.0.1",
    request_ip: "127.0.0.1",
    other: JSON.stringify({
      billing_source: "subscription",
      subscription_plan_id: "plan-smoke-1",
      subscription_plan_title: "Smoke Monthly",
      subscription_id: "sub-smoke-1",
      subscription_pre_consumed: 20,
      subscription_post_delta: 5,
      subscription_consumed: 25,
      subscription_remain: 75,
      subscription_total: 100,
    }),
    request_id: "req-subscription-smoke",
    upstream_request_id: "up-subscription-smoke",
  },
  {
    id: 8805,
    user_id: user.id,
    created_at: 1717203900,
    type: 8,
    content: "Archive log smoke",
    username: user.username,
    token_name: "archive-token",
    model_name: "archive-model",
    quota: 4567,
    prompt_tokens: 13,
    completion_tokens: 35,
    use_time: 789,
    is_stream: false,
    channel: 46,
    channel_name: "archive-channel",
    token_id: 81,
    group: "default",
    ip: "127.0.0.1",
    request_ip: "127.0.0.1",
    other: "{}",
    request_id: "req-archive-smoke",
    upstream_request_id: "up-archive-smoke",
  },
  {
    id: 8806,
    user_id: user.id,
    created_at: 1717204500,
    type: 9,
    content: "Admin error log smoke",
    username: user.username,
    token_name: "admin-error-token",
    model_name: "admin-error-model",
    quota: 5678,
    prompt_tokens: 14,
    completion_tokens: 36,
    use_time: 890,
    is_stream: false,
    channel: 47,
    channel_name: "admin-error-channel",
    token_id: 82,
    group: "default",
    ip: "127.0.0.1",
    request_ip: "127.0.0.1",
    other: "{}",
    request_id: "req-admin-error-smoke",
    upstream_request_id: "up-admin-error-smoke",
  },
  {
    id: 8803,
    user_id: user.id,
    created_at: 1717204200,
    type: 2,
    content: "Fixed request billing smoke",
    username: user.username,
    token_name: "fixed-request-token",
    model_name: "fixed-request-model",
    quota: 1250,
    prompt_tokens: 100,
    completion_tokens: 50,
    use_time: 1.2,
    is_stream: true,
    channel: 44,
    channel_name: "fixed-request-channel",
    token_id: 79,
    group: "default",
    ip: "127.0.0.1",
    request_ip: "127.0.0.1",
    other: JSON.stringify({
      billing_mode: "tiered_expr",
      matched_tier: "request_fixed_1",
      expr_b64: encodeExpr(fixedRequestBillingExpr),
    }),
    request_id: "req-fixed-request-smoke",
    upstream_request_id: "up-fixed-request-smoke",
  },
  {
    id: 8802,
    user_id: normalUser.id,
    created_at: 1717203600,
    type: 0,
    content: "User common request",
    username: normalUser.username,
    token_name: "user-smoke-token",
    model_name: "user-common-model",
    quota: 2345,
    prompt_tokens: 11,
    completion_tokens: 21,
    use_time: 567,
    is_stream: false,
    channel: 43,
    channel_name: "user-smoke-channel",
    token_id: 78,
    group: "default",
    ip: "127.0.0.1",
    request_ip: "127.0.0.1",
    other: "{}",
    request_id: "req-user-common-smoke",
    upstream_request_id: "up-user-common-smoke",
  },
];

const drawingLogs = [
  {
    id: 9001,
    user_id: user.id,
    channel_id: 42,
    code: 1,
    mj_id: "mj-smoke-9001",
    action: "IMAGINE",
    submit_time: 1717200000000,
    finish_time: 1717200090000,
    progress: "100%",
    prompt: "a crystalline city at sunrise",
    prompt_en: "A crystalline city at sunrise",
    image_url: "/smoke-assets/mj-9001.png",
    status: "SUCCESS",
  },
  {
    id: 9002,
    user_id: user.id,
    channel_id: 43,
    code: 1,
    mj_id: "mj-smoke-9002",
    action: "UPSCALE",
    submit_time: 1717200200000,
    finish_time: 1717200240000,
    progress: "100%",
    prompt: "upscaled smoke image",
    image_url: "/smoke-assets/mj-9002.png",
    status: "SUCCESS",
  },
];

const taskLogs = [
  {
    id: 9101,
    user_id: user.id,
    username: user.username,
    platform: "kling",
    task_id: "video-smoke-9101",
    action: "generate",
    channel_id: 52,
    submit_time: 1717201000,
    finish_time: 1717201180,
    progress: "100%",
    result_url: "/smoke-assets/video-9101.mp4",
    status: "SUCCESS",
  },
  {
    id: 9102,
    user_id: user.id,
    username: user.username,
    platform: "suno",
    task_id: "audio-smoke-9102",
    action: "MUSIC",
    channel_id: 53,
    submit_time: 1717202000,
    finish_time: 1717202180,
    progress: "100%",
    data: JSON.stringify([
      {
        id: "clip-smoke-1",
        title: "Smoke Ballad",
        tags: "cinematic, smoke",
        duration: 128,
        audio_url: "/smoke-assets/audio-9102.mp3",
      },
    ]),
    status: "SUCCESS",
  },
];

const channelAffinityUsageCacheStats = {
  rule_name: "smoke-affinity-rule",
  using_group: "default",
  key_fp: "PLACEHOLDER_FP",
  cached_token_rate_mode: "cached_over_prompt_plus_cached",
  hit: 3,
  total: 4,
  window_seconds: 300,
  prompt_tokens: 40,
  completion_tokens: 5,
  total_tokens: 45,
  cached_tokens: 10,
  prompt_cache_hit_tokens: 7,
  last_seen_at: 1717203900,
};

function parseJsonBody(request) {
  try {
    return request.postDataJSON();
  } catch {
    return request.postData();
  }
}

function pagedItems(items, params) {
  const page = Number(params.p || 1);
  const pageSize = Number(params.page_size || 20);
  const filter = params.mj_id || params.task_id || params.model_name;
  const typed =
    params.type && String(params.type) !== "0"
      ? items.filter((item) => String(item.type) === String(params.type))
      : items;
  const filtered = filter
    ? typed.filter((item) =>
        String(item.mj_id || item.task_id || item.model_name || "").includes(filter)
      )
    : typed;
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length + (filter ? 0 : pageSize),
    page,
    page_size: pageSize,
  };
}

function waitForApiRequest(page, pathname, predicate = () => true) {
  return page.waitForRequest((request) => {
    const url = new URL(request.url());
    const params = Object.fromEntries(url.searchParams.entries());
    return url.pathname === pathname && predicate(params, request);
  });
}

async function mockApi(page, currentUser = user) {
  const requests = [];
  const unhandled = [];

  await page.route("**/smoke-assets/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith(".png")) {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
          "base64"
        ),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: url.pathname.endsWith(".mp3") ? "audio/mpeg" : "video/mp4",
      body: "",
    });
  });

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    const params = Object.fromEntries(url.searchParams.entries());
    const postData = parseJsonBody(request);
    requests.push({ method, pathname: url.pathname, params, postData });

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
          system_name: "new-api usage logs smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: currentUser });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: [] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/option/") {
      await fulfill({ success: true, data: null });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/2fa/status") {
      await fulfill({ success: true, data: { enabled: false } });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/passkey") {
      await fulfill({ success: true, data: [] });
      return;
    }

    if (method === "GET" && ["/api/log", "/api/log/self"].includes(url.pathname)) {
      const source =
        url.pathname === "/api/log/self"
          ? commonLogs.filter((log) => log.user_id === normalUser.id)
          : commonLogs;
      await fulfill({ success: true, data: pagedItems(source, params) });
      return;
    }

    if (
      method === "GET" &&
      ["/api/log/stat", "/api/log/self/stat"].includes(url.pathname)
    ) {
      await fulfill({
        success: true,
        data: { quota: 1234, rpm: 2, tpm: 3 },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/log/channel_affinity_usage_cache") {
      await fulfill({ success: true, data: channelAffinityUsageCacheStats });
      return;
    }

    if (method === "GET" && url.pathname === "/api/mj") {
      await fulfill({ success: true, data: pagedItems(drawingLogs, params) });
      return;
    }

    if (method === "GET" && url.pathname === "/api/task") {
      await fulfill({ success: true, data: pagedItems(taskLogs, params) });
      return;
    }

    unhandled.push(`${method} ${url.pathname}`);
    await fulfill({ success: true, data: null });
  });

  return { requests, unhandled };
}

async function authenticate(page, storedUser = user) {
  await page.addInitScript((storedUser) => {
    window.localStorage.setItem("i18nextLng", "en");
    window.localStorage.setItem("user", JSON.stringify(storedUser));
    window.localStorage.setItem("uid", String(storedUser.id));
    window.localStorage.setItem("setup_required", "false");
  }, storedUser);
}

test.describe("usage logs drawing and task runtime parity", () => {
  test("renders higher common log types with classic labels", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/usage-logs/common");

    await expect(page.getByRole("heading", { name: "Common Logs" })).toBeVisible();
    await expect(page.getByText("subscription-model")).toBeVisible();
    await expect(page.getByText("archive-model")).toBeVisible();
    await expect(page.getByText("admin-error-model")).toBeVisible();

    await expect(
      page.getByRole("row", { name: /subscription-model/ }).getByText("Subscription", {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("row", { name: /archive-model/ }).getByText("Archive", {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("row", { name: /admin-error-model/ }).getByText("Admin Error", {
        exact: true,
      })
    ).toBeVisible();

    const listRequest = requests.find(
      (request) => request.method === "GET" && request.pathname === "/api/log"
    );
    expect(listRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("shows admin-only higher log type filter option for admins only", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/usage-logs/common");
    await page.getByRole("combobox", { name: "All Types" }).click();
    await expect(page.getByRole("option", { name: "Subscription" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Archive" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Admin Error" })).toBeVisible();
    expect(unhandled).toEqual([]);

    const nonAdminPage = await page.context().newPage();
    const { unhandled: nonAdminUnhandled } = await mockApi(nonAdminPage, normalUser);
    await authenticate(nonAdminPage, normalUser);

    await nonAdminPage.goto("/usage-logs/common");
    await nonAdminPage.getByRole("combobox", { name: "All Types" }).click();
    await expect(nonAdminPage.getByRole("option", { name: "Subscription" })).toBeVisible();
    await expect(nonAdminPage.getByRole("option", { name: "Archive" })).toBeVisible();
    await expect(
      nonAdminPage.getByRole("option", { name: "Admin Error" })
    ).toHaveCount(0);
    expect(nonAdminUnhandled).toEqual([]);
    await nonAdminPage.close();
  });

  test("preserves query filters from the legacy console common-log route", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/console/log?type=0&model=smoke-common-model");

    await expect(page).toHaveURL(/\/usage-logs\/common\?type=0&model=smoke-common-model$/);
    await expect(page.getByRole("heading", { name: "Common Logs" })).toBeVisible();
    await expect(page.getByText("smoke-common-model")).toBeVisible();

    const listRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/log" &&
        request.params.type === "0" &&
        request.params.model_name === "smoke-common-model"
    );
    expect(listRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("canonicalizes root common logs and forwards type filters for admins", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/usage-logs?type=0&model=smoke-common-model");

    await expect(page).toHaveURL(/\/usage-logs\/common\?type=0&model=smoke-common-model$/);
    await expect(page.getByRole("heading", { name: "Common Logs" })).toBeVisible();
    await expect(page.getByText("smoke-common-model")).toBeVisible();

    const listRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/log" &&
        request.params.type === "0" &&
        request.params.model_name === "smoke-common-model"
    );
    const statRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/log/stat" &&
        request.params.type === "0" &&
        request.params.model_name === "smoke-common-model"
    );
    expect(listRequest).toBeTruthy();
    expect(statRequest).toBeTruthy();
    expect(
      requests.some((request) => request.pathname === "/api/mj" || request.pathname === "/api/task")
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });

  test("opens channel affinity usage cache details with backend token-rate fields", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/usage-logs/common?type=0&model=smoke-common-model");

    await expect(page.getByRole("heading", { name: "Common Logs" })).toBeVisible();
    const channelCell = page.locator("td", { hasText: "#42" }).first();
    await expect(channelCell).toBeVisible();

    const usageCacheRequest = waitForApiRequest(
      page,
      "/api/log/channel_affinity_usage_cache",
      (params) =>
        params.rule_name === "smoke-affinity-rule" &&
        params.using_group === "default" &&
        params.key_fp === "fp-smoke-42"
    );
    await channelCell.locator("button").first().click();
    await usageCacheRequest;

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", {
        name: "Channel Affinity: Upstream Cache Hit",
      })
    ).toBeVisible();
    await expect(dialog.getByText("Prompt cache hit tokens")).toBeVisible();
    await expect(dialog.getByText("7", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Cached tokens", { exact: true })).toBeVisible();
    await expect(dialog.getByText("10 (20.00%)")).toBeVisible();

    const statsRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/log/channel_affinity_usage_cache"
    );
    expect(statsRequest?.params).toMatchObject({
      rule_name: "smoke-affinity-rule",
      using_group: "default",
      key_hint: "sk-smoke***",
      key_fp: "PLACEHOLDER_FP",
    });
    expect(unhandled).toEqual([]);
  });

  test("renders fixed request rule pricing in common log table and details", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/usage-logs/common?type=2&model=fixed-request-model");

    await expect(page.getByRole("heading", { name: "Common Logs" })).toBeVisible();
    await expect(page.getByText("fixed-request-model")).toBeVisible();
    await expect(
      page.getByText("Dynamic Pricing · Fixed price $0.125/request")
    ).toBeVisible();

    await page
      .getByRole("row", { name: /fixed-request-model/ })
      .getByRole("button", {
        name: /Dynamic Pricing · Fixed price \$0\.125\/request/,
      })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Log Details" })).toBeVisible();
    await expect(dialog.getByText("Rule", { exact: true })).toBeVisible();
    await expect(dialog.getByText("#1", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Fixed price", { exact: true })).toBeVisible();
    await expect(dialog.getByText("$0.125/request", { exact: true })).toBeVisible();

    const listRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/log" &&
        request.params.type === "2" &&
        request.params.model_name === "fixed-request-model"
    );
    expect(listRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("loads common logs through self endpoints for normal users", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, normalUser);
    await authenticate(page, normalUser);

    await page.goto("/usage-logs/common?type=0&model=user-common-model");

    await expect(page.getByRole("heading", { name: "Common Logs" })).toBeVisible();
    await expect(page.getByText("user-common-model")).toBeVisible();

    const selfListRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/log/self" &&
        request.params.type === "0" &&
        request.params.model_name === "user-common-model"
    );
    const selfStatRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/log/self/stat" &&
        request.params.type === "0" &&
        request.params.model_name === "user-common-model"
    );
    expect(selfListRequest).toBeTruthy();
    expect(selfStatRequest).toBeTruthy();
    expect(
      requests.some(
        (request) => request.pathname === "/api/log" || request.pathname === "/api/log/stat"
      )
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });

  test("renders compact mobile cards and applies drawer filters", async ({
    page,
  }) => {
    page.setDefaultTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/usage-logs/common?type=0");

    await expect(page.getByRole("heading", { name: "Common Logs" })).toBeVisible();
    await expect(page.locator("table")).toHaveCount(0);
    await expect(page.getByText("smoke-common-model")).toBeVisible();
    await expect(page.getByText("Smoke common request")).toBeVisible();
    await expect(page.getByText("Time", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Channel", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Token", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Timing", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Details", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: /^Filter$/ }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("heading", { name: "Filter" })).toBeVisible();
    await expect(
      drawer.getByText("Adjust filters, then search to refresh the logs.")
    ).toBeVisible();

    const filterRequestPromise = waitForApiRequest(
      page,
      "/api/log",
      (params) => params.model_name === "smoke-common-model"
    );
    await drawer.getByPlaceholder("Model Name").fill("smoke-common-model");
    await drawer.getByRole("button", { name: "Search" }).click();
    await filterRequestPromise;

    await expect(page).toHaveURL(/model=smoke-common-model/);
    const mobileFilterRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/log" &&
        request.params.model_name === "smoke-common-model" &&
        request.params.page_size === "20"
    );
    expect(mobileFilterRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("strips common-only type filters from drawing log URLs", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/usage-logs/drawing?type=0&filter=mj-smoke-9001");

    await expect(page).toHaveURL(/\/usage-logs\/drawing\?filter=mj-smoke-9001$/);
    await expect(page.getByText("mj-smoke-9001")).toBeVisible();
    expect(
      requests.some(
        (request) =>
          request.pathname === "/api/mj" &&
          request.params.type !== undefined
      )
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });

  test("renders drawing logs with filter, preview, and pagination requests", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/usage-logs/drawing");

    await expect(
      page.getByRole("heading", { name: "Task Logs" })
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Drawing Logs" })).toBeVisible();
    await expect(page.getByText("mj-smoke-9001")).toBeVisible();
    await expect(page.getByText("a crystalline city at sunrise")).toBeVisible();

    const nextPageRequest = waitForApiRequest(
      page,
      "/api/mj",
      (params) => params.p === "2"
    );
    const nextPageButton = page.getByRole("button", { name: "Next page" });
    await expect(nextPageButton).toBeEnabled();
    await nextPageButton.focus();
    await page.keyboard.press("Enter");
    await nextPageRequest;
    await expect(page).toHaveURL(/page=2/);

    const previousPageButton = page.getByRole("button", {
      name: "Previous page",
    });
    await expect(previousPageButton).toBeEnabled();
    await previousPageButton.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/usage-logs\/drawing(?:\?|$)/);
    await expect(page.getByText("mj-smoke-9001")).toBeVisible();

    await page
      .getByRole("row", { name: /mj-smoke-9001/ })
      .getByRole("button", { name: "View" })
      .click();
    const imageDialog = page.getByRole("dialog");
    await expect(
      imageDialog.getByRole("heading", { name: "Image Preview" })
    ).toBeVisible();
    await expect(imageDialog.getByText("mj-smoke-9001")).toBeVisible();
    await expect(
      imageDialog.getByText("/smoke-assets/mj-9001.png")
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(imageDialog).toBeHidden();

    const filterRequestPromise = waitForApiRequest(
      page,
      "/api/mj",
      (params) => params.mj_id === "mj-smoke-9002"
    );
    await page.getByLabel("Task ID").fill("mj-smoke-9002");
    await page.getByRole("button", { name: "Search" }).click();
    await filterRequestPromise;
    await expect(page).toHaveURL(/filter=mj-smoke-9002/);
    await expect(page.getByText("mj-smoke-9002")).toBeVisible();

    const initialRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/mj" &&
        request.params.p === "1" &&
        request.params.page_size === "100"
    );
    const filterRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/mj" &&
        request.params.mj_id === "mj-smoke-9002" &&
        request.params.channel_id === undefined
    );
    const pageRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/mj" &&
        request.params.p === "2"
    );

    expect(initialRequest).toBeTruthy();
    expect(filterRequest).toBeTruthy();
    expect(pageRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("renders task logs with filter plus video and audio preview affordances", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/usage-logs/task");

    await expect(
      page.getByRole("heading", { name: "Task Logs" })
    ).toBeVisible();
    await expect(page.getByText("video-smoke-9101")).toBeVisible();
    await expect(page.getByText("audio-smoke-9102")).toBeVisible();

    const videoLink = page.getByRole("link", {
      name: "Click to preview video",
    });
    await expect(videoLink).toHaveAttribute(
      "href",
      "/smoke-assets/video-9101.mp4"
    );

    await page.getByText("Click to preview audio").click();
    const audioDialog = page.getByRole("dialog");
    await expect(
      audioDialog.getByRole("heading", { name: "Audio Preview" })
    ).toBeVisible();
    await expect(audioDialog.getByText("Smoke Ballad")).toBeVisible();
    await expect(audioDialog.getByText("cinematic, smoke")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(audioDialog).toBeHidden();

    const filterRequestPromise = waitForApiRequest(
      page,
      "/api/task",
      (params) => params.task_id === "video-smoke-9101"
    );
    await page.getByLabel("Task ID").fill("video-smoke-9101");
    await page.getByRole("button", { name: "Search" }).click();
    await filterRequestPromise;
    await expect(page).toHaveURL(/filter=video-smoke-9101/);

    const initialRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/task" &&
        request.params.p === "1" &&
        request.params.page_size === "100"
    );
    const filterRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/task" &&
        request.params.task_id === "video-smoke-9101"
    );

    expect(initialRequest).toBeTruthy();
    expect(filterRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
