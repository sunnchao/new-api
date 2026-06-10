/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const adminUser = {
  id: 7901,
  username: "redemptions-admin-smoke",
  display_name: "Redemptions Admin Smoke",
  email: "redemptions-admin-smoke@example.com",
  role: 100,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 10000,
  request_count: 24,
  permissions: {
    sidebar_settings: false,
  },
};

const baseRedemptions = [
  {
    id: 7101,
    user_id: 7901,
    name: "quota-runtime",
    key: "PLACEHOLDER_KEY",
    status: 1,
    quota: 5000,
    type: "quota",
    subscription_plan_id: 0,
    created_time: 1717200000,
    redeemed_time: 0,
    expired_time: 0,
    used_user_id: 0,
  },
  {
    id: 7102,
    user_id: 7901,
    name: "used-runtime",
    key: "PLACEHOLDER_KEY",
    status: 3,
    quota: 1000,
    type: "quota",
    subscription_plan_id: 0,
    created_time: 1717300000,
    redeemed_time: 1717400000,
    expired_time: 0,
    used_user_id: 9001,
  },
];

const planRecord = {
  plan: {
    id: 8801,
    title: "Smoke Pro",
    subtitle: "Runtime smoke plan",
    price_amount: 12,
    currency: "USD",
    duration_unit: "month",
    duration_value: 1,
    quota_reset_period: "monthly",
    enabled: true,
    show_on_home: true,
    sort_order: 1,
    max_purchase_per_user: 1,
    total_amount: 100000,
    upgrade_group: "pro",
    allowed_groups: "default,pro",
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseJsonBody(request) {
  const body = request.postData();
  return body ? JSON.parse(body) : undefined;
}

function filterRedemptions(redemptions, params) {
  const keyword = (params.keyword || "").toLowerCase();
  if (!keyword) return [...redemptions];

  return redemptions.filter(
    (redemption) =>
      redemption.name.toLowerCase().includes(keyword) ||
      String(redemption.id).includes(keyword) ||
      redemption.key.toLowerCase().includes(keyword)
  );
}

function paginatedRedemptions(redemptions, params) {
  const page = Number(params.p || 1);
  const pageSize = Number(params.page_size || 20);
  const start = (page - 1) * pageSize;

  return {
    success: true,
    data: {
      items: clone(redemptions.slice(start, start + pageSize)),
      total: redemptions.length,
      page,
      page_size: pageSize,
    },
  };
}

async function mockApi(page) {
  const requests = [];
  const unhandled = [];
  const redemptions = clone(baseRedemptions);
  let nextRedemptionId = 7200;

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
          system_name: "new-api redemption codes smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          quota_per_unit: 1,
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: "" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: adminUser });
      return;
    }

    if (method === "GET" && url.pathname === "/api/redemption/") {
      await fulfill(paginatedRedemptions(redemptions, params));
      return;
    }

    if (method === "GET" && url.pathname === "/api/redemption/search") {
      await fulfill(paginatedRedemptions(filterRedemptions(redemptions, params), params));
      return;
    }

    if (method === "GET" && url.pathname === "/api/subscription/admin/plans") {
      await fulfill({ success: true, data: [clone(planRecord)] });
      return;
    }

    if (method === "POST" && url.pathname === "/api/redemption/") {
      const count = Number(body.count || 1);
      const keys = [];
      for (let index = 0; index < count; index += 1) {
        const id = nextRedemptionId++;
        const key = `CREATED-CODE-${id}`;
        keys.push(key);
        redemptions.unshift({
          id,
          user_id: adminUser.id,
          name: body.name,
          key,
          status: 1,
          quota: body.quota,
          type: body.type || "quota",
          subscription_plan_id: body.subscription_plan_id || 0,
          created_time: 1719880000 + index,
          redeemed_time: 0,
          expired_time: body.expired_time || 0,
          used_user_id: 0,
        });
      }
      await fulfill({ success: true, data: keys, message: "created" });
      return;
    }

    if (method === "PUT" && url.pathname === "/api/redemption/") {
      const index = redemptions.findIndex((redemption) => redemption.id === body.id);
      if (index >= 0) {
        redemptions[index] = {
          ...redemptions[index],
          name: body.name ?? redemptions[index].name,
          quota: body.quota ?? redemptions[index].quota,
          type: body.type ?? redemptions[index].type,
          subscription_plan_id:
            body.subscription_plan_id ?? redemptions[index].subscription_plan_id,
          expired_time: body.expired_time ?? redemptions[index].expired_time,
          status: params.status_only === "true"
            ? body.status
            : redemptions[index].status,
        };
      }
      await fulfill({
        success: index >= 0,
        data: index >= 0 ? clone(redemptions[index]) : undefined,
        message: index >= 0 ? "updated" : "not found",
      }, index >= 0 ? 200 : 404);
      return;
    }

    const redemptionMatch = url.pathname.match(/^\/api\/redemption\/(\d+)$/);
    if (redemptionMatch && method === "GET") {
      const id = Number(redemptionMatch[1]);
      const redemption = redemptions.find((item) => item.id === id);
      await fulfill(
        redemption
          ? { success: true, data: clone(redemption) }
          : { success: false, message: "not found" },
        redemption ? 200 : 404
      );
      return;
    }

    const deleteMatch = url.pathname.match(/^\/api\/redemption\/(\d+)\/$/);
    if (deleteMatch && method === "DELETE") {
      const id = Number(deleteMatch[1]);
      const index = redemptions.findIndex((redemption) => redemption.id === id);
      if (index >= 0) redemptions.splice(index, 1);
      await fulfill({ success: true, message: "deleted" });
      return;
    }

    if (method === "DELETE" && url.pathname === "/api/redemption/invalid") {
      const invalidCount = redemptions.filter((redemption) => redemption.status !== 1).length;
      for (let index = redemptions.length - 1; index >= 0; index -= 1) {
        if (redemptions[index].status !== 1) {
          redemptions.splice(index, 1);
        }
      }
      await fulfill({ success: true, data: invalidCount, message: "deleted invalid" });
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
  const row = page.getByRole("row", { name: new RegExp(rowText) }).first();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Open menu" }).click();
}

test.describe("redemption codes runtime surface", () => {
  test("searches, creates, edits, disables, deletes, and clears invalid codes", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/redemption-codes");
    await expect(page.getByRole("heading", { name: "Redemption Codes" })).toBeVisible();
    await expect(page.getByText("quota-runtime")).toBeVisible();
    await expect(page.getByText("used-runtime")).toBeVisible();

    await page.getByPlaceholder("Filter by name or ID...").fill("used");
    await expect(page.getByText("used-runtime")).toBeVisible();
    await expect(page.getByText("quota-runtime")).toBeHidden();

    const searchRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/redemption/search" &&
        request.params.keyword === "used"
    );
    expect(searchRequest).toBeTruthy();

    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.getByText("quota-runtime")).toBeVisible();

    await page.getByRole("button", { name: "Create Code" }).click();
    await expect(page.getByRole("dialog", { name: /Create Redemption Code/ })).toBeVisible();
    await page.getByLabel("Name").fill("created-runtime");
    await page.getByLabel(/^Quota/).fill("2500");
    await page.getByLabel("Quantity").fill("2");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Successfully created 2 redemption codes")).toBeVisible();
    await expect(page.getByText("created-runtime").first()).toBeVisible();

    const createRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/redemption/" &&
        request.body?.name === "created-runtime"
    );
    expect(createRequest).toBeTruthy();
    expect(createRequest.body).toMatchObject({
      name: "created-runtime",
      quota: 2500,
      type: "quota",
      subscription_plan_id: 0,
      count: 2,
    });

    await openRowMenu(page, "created-runtime");
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(page.getByRole("dialog", { name: /Update Redemption Code/ })).toBeVisible();
    await page.getByLabel("Name").fill("subscription-runtime");
    await page.getByRole("combobox", { name: "Redemption content" }).click();
    await page.getByRole("option", { name: "Subscription plan" }).click();
    await page.getByRole("combobox", { name: "Subscription plan" }).click();
    await page.getByRole("option", { name: /Smoke Pro/ }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Redemption code updated successfully")).toBeVisible();
    await expect(page.getByText("subscription-runtime")).toBeVisible();

    const updateRequest = requests.find(
      (request) =>
        request.method === "PUT" &&
        request.pathname === "/api/redemption/" &&
        request.body?.id === 7201 &&
        request.body?.name === "subscription-runtime"
    );
    expect(updateRequest).toBeTruthy();
    expect(updateRequest.body).toMatchObject({
      quota: 0,
      type: "subscription",
      subscription_plan_id: 8801,
    });

    await openRowMenu(page, "subscription-runtime");
    await page.getByRole("menuitem", { name: "Disable" }).click();
    await expect(page.getByText("Redemption code disabled successfully")).toBeVisible();

    const disableRequest = requests.find(
      (request) =>
        request.method === "PUT" &&
        request.pathname === "/api/redemption/" &&
        request.params.status_only === "true" &&
        request.body?.id === 7201 &&
        request.body?.status === 2
    );
    expect(disableRequest).toBeTruthy();

    await openRowMenu(page, "subscription-runtime");
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(page.getByRole("alertdialog", { name: "Are you sure?" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Redemption code deleted successfully")).toBeVisible();
    await expect(page.getByText("subscription-runtime")).toBeHidden();

    const deleteRequest = requests.find(
      (request) =>
        request.method === "DELETE" &&
        request.pathname === "/api/redemption/7201/"
    );
    expect(deleteRequest).toBeTruthy();

    await page.getByRole("checkbox", { name: "Select row" }).first().check();
    await page.getByRole("button", { name: "Delete invalid redemption codes" }).click();
    await expect(page.getByRole("heading", { name: "Delete Invalid Redemption Codes?" })).toBeVisible();
    await page.getByRole("button", { name: "Delete Invalid" }).click();
    await expect(page.getByText("Successfully deleted 1 invalid redemption codes")).toBeVisible();

    const deleteInvalidRequest = requests.find(
      (request) =>
        request.method === "DELETE" &&
        request.pathname === "/api/redemption/invalid"
    );
    expect(deleteInvalidRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
