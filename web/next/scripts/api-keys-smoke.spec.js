/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 7601,
  username: "api-keys-smoke",
  display_name: "API Keys Smoke",
  email: "api-keys-smoke@example.com",
  role: 1,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 120000,
  request_count: 42,
  permissions: {
    sidebar_settings: false,
  },
};

const baseApiKeys = [
  {
    id: 8601,
    name: "Runtime Smoke Primary",
    key: "smoke-primary-masked",
    status: 1,
    remain_quota: 400000,
    used_quota: 100000,
    unlimited_quota: false,
    expired_time: -1,
    created_time: 1717200000,
    accessed_time: 1717203600,
    group: "default",
    cross_group_retry: false,
    model_limits_enabled: false,
    model_limits: "",
    allow_ips: "",
    backup_group: "",
  },
  {
    id: 8602,
    name: "Billing Integration Key",
    key: "billing-secret-masked",
    status: 2,
    remain_quota: 0,
    used_quota: 250000,
    unlimited_quota: true,
    expired_time: -1,
    created_time: 1717300000,
    accessed_time: 0,
    group: "pro",
    cross_group_retry: false,
    model_limits_enabled: true,
    model_limits: "gpt-4o-mini",
    allow_ips: "127.0.0.1",
    backup_group: "default",
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseJsonBody(request) {
  const body = request.postData();
  return body ? JSON.parse(body) : undefined;
}

function filterApiKeys(items, params) {
  const keyword = (params.keyword || "").toLowerCase();
  const token = (params.token || "").toLowerCase();

  return items.filter(
    (item) =>
      (!keyword || item.name.toLowerCase().includes(keyword)) &&
      (!token || item.key.toLowerCase().includes(token))
  );
}

function paginatedApiKeys(items, params) {
  const page = Number(params.p || 1);
  const pageSize = Number(params.size || 20);
  const start = (page - 1) * pageSize;
  return {
    success: true,
    data: {
      items: clone(items.slice(start, start + pageSize)),
      total: items.length,
      page,
      page_size: pageSize,
    },
  };
}

async function mockApi(page) {
  const requests = [];
  const unhandled = [];
  const apiKeys = clone(baseApiKeys);
  let nextKeyId = 8700;

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
          system_name: "new-api api keys smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          default_use_auto_group: false,
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: user });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: [] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self/groups") {
      await fulfill({
        success: true,
        data: {
          default: { desc: "Default group", ratio: 1 },
          pro: { desc: "Pro group", ratio: 1.5 },
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/models") {
      await fulfill({ success: true, data: ["gpt-4o-mini", "claude-3-5-sonnet"] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/token/") {
      await fulfill(paginatedApiKeys(apiKeys, params));
      return;
    }

    if (method === "GET" && url.pathname === "/api/token/search") {
      await fulfill(paginatedApiKeys(filterApiKeys(apiKeys, params), params));
      return;
    }

    if (method === "POST" && url.pathname === "/api/token/") {
      const created = {
        id: nextKeyId++,
        name: body.name,
        key: "created-masked",
        status: 1,
        remain_quota: body.remain_quota,
        used_quota: 0,
        unlimited_quota: body.unlimited_quota,
        expired_time: body.expired_time,
        created_time: 1719880000,
        accessed_time: 0,
        group: body.group,
        cross_group_retry: body.cross_group_retry,
        model_limits_enabled: body.model_limits_enabled,
        model_limits: body.model_limits,
        allow_ips: body.allow_ips,
        backup_group: body.backup_group,
      };
      apiKeys.unshift(created);
      await fulfill({ success: true, data: clone(created), message: "created" });
      return;
    }

    const keyFetchMatch = url.pathname.match(/^\/api\/token\/(\d+)\/key$/);
    if (keyFetchMatch && method === "POST") {
      const id = Number(keyFetchMatch[1]);
      const existing = apiKeys.find((item) => item.id === id);
      await fulfill(
        existing
          ? { success: true, data: { key: `real-key-${id}` } }
          : { success: false, message: "not found" },
        existing ? 200 : 404
      );
      return;
    }

    const tokenMatch = url.pathname.match(/^\/api\/token\/(\d+)\/$/);
    if (tokenMatch && method === "DELETE") {
      const id = Number(tokenMatch[1]);
      const index = apiKeys.findIndex((item) => item.id === id);
      if (index >= 0) apiKeys.splice(index, 1);
      await fulfill({ success: true, message: "deleted" });
      return;
    }

    const tokenDetailMatch = url.pathname.match(/^\/api\/token\/(\d+)$/);
    if (tokenDetailMatch && method === "GET") {
      const id = Number(tokenDetailMatch[1]);
      const existing = apiKeys.find((item) => item.id === id);
      await fulfill(
        existing
          ? { success: true, data: clone(existing) }
          : { success: false, message: "not found" },
        existing ? 200 : 404
      );
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

async function openRowMenu(page, rowText) {
  const row = page.getByRole("row", { name: new RegExp(rowText) });
  await expect(row).toBeVisible();
  await row.getByRole("button").last().click();
}

test.describe("api keys runtime surface", () => {
  test("searches, creates, reveals, and deletes an API key", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/keys");
    await expect(page.getByRole("heading", { name: "API Keys" })).toBeVisible();
    await expect(page.getByText("Runtime Smoke Primary")).toBeVisible();
    await expect(page.getByText("Billing Integration Key")).toBeVisible();

    await page.getByPlaceholder("Filter by name...").fill("billing");
    await expect(page.getByText("Billing Integration Key")).toBeVisible();
    await expect(page.getByText("Runtime Smoke Primary")).toBeHidden();

    const searchRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/token/search" &&
        request.params.keyword === "billing"
    );
    expect(searchRequest).toBeTruthy();
    expect(searchRequest.params).toMatchObject({
      keyword: "billing",
      p: "1",
      size: "20",
    });

    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.getByText("Runtime Smoke Primary")).toBeVisible();

    await page.getByPlaceholder("Filter by API key").fill("billing-secret");
    await expect(page.getByText("Billing Integration Key")).toBeVisible();
    await expect(page.getByText("Runtime Smoke Primary")).toBeHidden();

    const tokenSearchRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/token/search" &&
        request.params.token === "billing-secret"
    );
    expect(tokenSearchRequest).toBeTruthy();
    expect(tokenSearchRequest.params).toMatchObject({
      token: "billing-secret",
      p: "1",
      size: "20",
    });
    expect(tokenSearchRequest.params.keyword).toBeUndefined();

    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.getByText("Runtime Smoke Primary")).toBeVisible();

    await page.getByRole("button", { name: "Create API Key" }).click();
    await expect(page.getByRole("dialog", { name: "Create API Key" })).toBeVisible();
    await page.getByLabel("Name").fill("Created Runtime Key");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Successfully created 1 API Key(s)")).toBeVisible();
    await expect(page.getByText("Created Runtime Key")).toBeVisible();

    const createRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/token/" &&
        request.body?.name === "Created Runtime Key"
    );
    expect(createRequest).toBeTruthy();
    expect(createRequest.body).toMatchObject({
      unlimited_quota: true,
      expired_time: -1,
      group: "",
      model_limits_enabled: false,
    });

    const createdRow = page.getByRole("row", { name: /Created Runtime Key/ });
    await createdRow.getByRole("button", { name: "sk-created-masked" }).click();
    await expect(page.getByText("Full API Key")).toBeVisible();
    await expect(page.locator('input[readonly]').last()).toHaveValue("sk-real-key-8700");

    const keyRequest = requests.find(
      (request) =>
        request.method === "POST" && request.pathname === "/api/token/8700/key"
    );
    expect(keyRequest).toBeTruthy();

    await openRowMenu(page, "Created Runtime Key");
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(page.getByRole("alertdialog", { name: "Are you sure?" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("API Key deleted successfully")).toBeVisible();
    await expect(page.getByText("Created Runtime Key")).toBeHidden();

    const deleteRequest = requests.find(
      (request) =>
        request.method === "DELETE" && request.pathname === "/api/token/8700/"
    );
    expect(deleteRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
