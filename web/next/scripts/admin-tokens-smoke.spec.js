/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const adminUser = {
  id: 7701,
  username: "admin-tokens-smoke",
  display_name: "Admin Tokens Smoke",
  email: "admin-tokens-smoke@example.com",
  role: 100,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 20000,
  request_count: 18,
  permissions: {
    sidebar_settings: false,
  },
};

const baseTokens = [
  {
    id: 8801,
    user_id: 9901,
    user_name: "runtime-owner",
    name: "Admin Runtime Primary",
    key: "sk-admin-runtime-primary-secret",
    status: 1,
    remain_quota: 300000,
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
    mj_model: "",
  },
  {
    id: 8802,
    user_id: 9902,
    user_name: "billing-owner",
    name: "Admin Billing Token",
    key: "sk-admin-billing-secret",
    status: 2,
    remain_quota: 0,
    used_quota: 50000,
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
    mj_model: "fast",
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseJsonBody(request) {
  const body = request.postData();
  return body ? JSON.parse(body) : undefined;
}

function filterTokens(tokens, params) {
  const keyword = (params.keyword || "").toLowerCase();
  const tokenKey = (params.token || "").toLowerCase().replace(/^sk-/, "");
  if (!keyword && !tokenKey) return [...tokens];

  return tokens.filter((token) => {
    const keywordMatch =
      !keyword ||
      token.name.toLowerCase().includes(keyword) ||
      (token.user_name || "").toLowerCase().includes(keyword);
    const storedKey = token.key.toLowerCase().replace(/^sk-/, "");
    const tokenMatch = !tokenKey || storedKey.includes(tokenKey);
    return keywordMatch && tokenMatch;
  });
}

function paginatedTokens(tokens, params) {
  const page = Number(params.p || 1);
  const pageSize = Number(params.page_size || 20);
  const start = (page - 1) * pageSize;

  return {
    success: true,
    data: {
      items: clone(tokens.slice(start, start + pageSize)),
      total: tokens.length,
      page,
      page_size: pageSize,
    },
  };
}

async function mockApi(page) {
  const requests = [];
  const unhandled = [];
  const tokens = clone(baseTokens);
  let nextTokenId = 8900;

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
          system_name: "new-api admin tokens smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          default_use_auto_group: false,
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: adminUser });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/models") {
      await fulfill({ success: true, data: ["gpt-4o-mini", "claude-3-5-sonnet"] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: [] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/option/") {
      await fulfill({
        success: true,
        data: [
          {
            key: "GroupRatio",
            value: JSON.stringify({ default: 1, pro: 1.5 }),
          },
        ],
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/admin/token/list") {
      await fulfill(paginatedTokens(tokens, params));
      return;
    }

    if (method === "GET" && url.pathname === "/api/admin/token/search") {
      await fulfill(paginatedTokens(filterTokens(tokens, params), params));
      return;
    }

    if (method === "POST" && url.pathname === "/api/admin/token") {
      const created = {
        id: nextTokenId++,
        user_id: body.user_id,
        user_name: `user-${body.user_id}`,
        name: body.name,
        key: "sk-created-admin-token-secret",
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
        mj_model: body.mj_model,
      };
      tokens.unshift(created);
      await fulfill({ success: true, data: clone(created), message: "created" });
      return;
    }

    if (method === "PUT" && url.pathname === "/api/admin/token") {
      const index = tokens.findIndex((token) => token.id === body.id);
      if (index >= 0) {
        tokens[index] = {
          ...tokens[index],
          ...body,
        };
      }
      await fulfill({
        success: index >= 0,
        data: index >= 0 ? clone(tokens[index]) : undefined,
        message: index >= 0 ? "updated" : "not found",
      }, index >= 0 ? 200 : 404);
      return;
    }

    const tokenMatch = url.pathname.match(/^\/api\/admin\/token\/(\d+)$/);
    if (tokenMatch && method === "GET") {
      const id = Number(tokenMatch[1]);
      const existing = tokens.find((token) => token.id === id);
      await fulfill(
        existing
          ? { success: true, data: clone(existing) }
          : { success: false, message: "not found" },
        existing ? 200 : 404
      );
      return;
    }

    if (tokenMatch && method === "DELETE") {
      const id = Number(tokenMatch[1]);
      const index = tokens.findIndex((token) => token.id === id);
      if (index >= 0) tokens.splice(index, 1);
      await fulfill({ success: true, message: "deleted" });
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
  }, adminUser);
}

async function openRowMenu(page, rowText) {
  const row = page.getByRole("row", { name: new RegExp(rowText) });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Open menu" }).click();
}

test.describe("admin tokens runtime surface", () => {
  test("searches, creates, edits, disables, and deletes managed API keys", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/admin-tokens");
    await expect(page.getByRole("heading", { name: "Token Management" })).toBeVisible();
    await expect(page.getByText("Admin Runtime Primary")).toBeVisible();
    await expect(page.getByText("Admin Billing Token")).toBeVisible();

    await page.getByPlaceholder("Filter by token name").fill("billing");
    await expect(page.getByText("Admin Billing Token")).toBeVisible();
    await expect(page.getByText("Admin Runtime Primary")).toBeHidden();

    const searchRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/admin/token/search" &&
        request.params.keyword === "billing" &&
        request.params.token === undefined
    );
    expect(searchRequest).toBeTruthy();

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText("Admin Runtime Primary")).toBeVisible();

    await page.getByPlaceholder("Filter by API key").fill("billing-secret");
    await expect(page.getByText("Admin Billing Token")).toBeVisible();
    await expect(page.getByText("Admin Runtime Primary")).toBeHidden();

    const tokenSearchRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/admin/token/search" &&
        request.params.token === "billing-secret" &&
        request.params.keyword === undefined
    );
    expect(tokenSearchRequest).toBeTruthy();

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText("Admin Runtime Primary")).toBeVisible();

    await page.getByRole("button", { name: "Create API Key" }).click();
    await expect(page.getByRole("dialog", { name: "Create API Key" })).toBeVisible();
    await page.getByLabel("Owner User ID").fill("9903");
    await page.getByLabel("Name").fill("Managed Runtime Key");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("API Key created successfully")).toBeVisible();
    await expect(page.getByText("Managed Runtime Key")).toBeVisible();
    await expect(page.getByText("user-9903")).toBeVisible();

    const createRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/admin/token" &&
        request.body?.name === "Managed Runtime Key"
    );
    expect(createRequest).toBeTruthy();
    expect(createRequest.body).toMatchObject({
      user_id: 9903,
      unlimited_quota: true,
      expired_time: -1,
      group: "",
      mj_model: "",
    });

    await openRowMenu(page, "Managed Runtime Key");
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(page.getByRole("dialog", { name: "Update API Key" })).toBeVisible();
    await expect(page.getByLabel("Owner User ID")).toBeDisabled();
    await page.getByLabel("Name").fill("Managed Runtime Key Edited");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("API Key updated successfully")).toBeVisible();
    await expect(page.getByText("Managed Runtime Key Edited")).toBeVisible();

    const updateRequest = requests.find(
      (request) =>
        request.method === "PUT" &&
        request.pathname === "/api/admin/token" &&
        request.body?.id === 8900 &&
        request.body?.name === "Managed Runtime Key Edited"
    );
    expect(updateRequest).toBeTruthy();

    const editedRow = page.getByRole("row", { name: /Managed Runtime Key Edited/ });
    await editedRow.getByRole("button", { name: "Disable" }).click();
    await expect(page.getByText("API Key disabled successfully")).toBeVisible();

    const disableRequest = requests.find(
      (request) =>
        request.method === "PUT" &&
        request.pathname === "/api/admin/token" &&
        request.params.status_only === "true" &&
        request.body?.id === 8900 &&
        request.body?.status === 2
    );
    expect(disableRequest).toBeTruthy();

    await openRowMenu(page, "Managed Runtime Key Edited");
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(page.getByRole("alertdialog", { name: "Are you sure?" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("API Key deleted successfully")).toBeVisible();
    await expect(page.getByText("Managed Runtime Key Edited")).toBeHidden();

    const deleteRequest = requests.find(
      (request) =>
        request.method === "DELETE" &&
        request.pathname === "/api/admin/token/8900"
    );
    expect(deleteRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
