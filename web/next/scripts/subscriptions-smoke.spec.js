/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 8401,
  username: "subscriptions-smoke-admin",
  display_name: "Subscriptions Smoke Admin",
  email: "subscriptions-smoke-admin@example.com",
  role: 10,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 0,
  request_count: 0,
  permissions: {
    sidebar_settings: false,
  },
};

const adminPlans = [
  {
    plan: {
      id: 101,
      title: "Smoke Pro Plan",
      subtitle: "Runtime smoke pro",
      price_amount: 10,
      currency: "USD",
      duration_unit: "month",
      duration_value: 1,
      quota_reset_period: "monthly",
      enabled: true,
      show_on_home: true,
      sort_order: 1,
      max_purchase_per_user: 0,
      total_amount: 1000000,
      allowed_groups: "default,pro",
      billing_mode: "quota",
    },
  },
  {
    plan: {
      id: 102,
      title: "Smoke Basic Plan",
      subtitle: "Runtime smoke basic",
      price_amount: 3,
      currency: "USD",
      duration_unit: "month",
      duration_value: 1,
      quota_reset_period: "monthly",
      enabled: true,
      show_on_home: true,
      sort_order: 2,
      max_purchase_per_user: 0,
      total_amount: 250000,
      allowed_groups: "",
      billing_mode: "quota",
    },
  },
];

const baseSubscriptions = [
  {
    id: 501,
    user_id: 7001,
    username: "alice-smoke",
    user_display_name: "Alice Smoke",
    user_email: "alice-smoke@example.com",
    user_group: "default",
    plan_id: 101,
    plan_title: "Smoke Pro Plan",
    status: "active",
    billing_mode: "quota",
    start_time: 1717200000,
    end_time: 1893456000,
    amount_total: 1000000,
    amount_used: 250000,
    amount_remaining: 750000,
    approximate_times: 1000,
    approximate_times_used: 250,
    upgrade_group: "",
    allowed_groups: "default,pro",
    hourly_limit_amount: 100000,
    hourly_amount_used: 10000,
    hourly_limit_hours: 2,
    hourly_reset_mode: "natural",
    hourly_next_reset_time: 1893459600,
    daily_limit_amount: 0,
    daily_amount_used: 0,
    daily_reset_mode: "",
    daily_next_reset_time: 0,
    weekly_limit_amount: 0,
    weekly_amount_used: 0,
    weekly_reset_mode: "",
    weekly_next_reset_time: 0,
    monthly_limit_amount: 300000,
    monthly_amount_used: 25000,
    monthly_reset_mode: "natural",
    monthly_next_reset_time: 1893542400,
  },
  {
    id: 502,
    user_id: 7002,
    username: "bob-smoke",
    user_display_name: "Bob Smoke",
    user_email: "bob-smoke@example.com",
    user_group: "pro",
    plan_id: 102,
    plan_title: "Smoke Basic Plan",
    status: "expired",
    billing_mode: "request",
    start_time: 1717200000,
    end_time: 1719792000,
    amount_total: 500,
    amount_used: 500,
    amount_remaining: 0,
    approximate_times: 0,
    approximate_times_used: 0,
    upgrade_group: "",
    allowed_groups: "",
    hourly_limit_amount: 0,
    hourly_amount_used: 0,
    hourly_limit_hours: 1,
    hourly_reset_mode: "",
    hourly_next_reset_time: 0,
    daily_limit_amount: 100,
    daily_amount_used: 75,
    daily_reset_mode: "anchor",
    daily_next_reset_time: 1893542400,
    weekly_limit_amount: 0,
    weekly_amount_used: 0,
    weekly_reset_mode: "",
    weekly_next_reset_time: 0,
    monthly_limit_amount: 0,
    monthly_amount_used: 0,
    monthly_reset_mode: "",
    monthly_next_reset_time: 0,
  },
  {
    id: 503,
    user_id: 7003,
    username: "carol-smoke",
    user_display_name: "Carol Smoke",
    user_email: "carol-smoke@example.com",
    user_group: "default",
    plan_id: 101,
    plan_title: "Smoke Pro Plan",
    status: "cancelled",
    billing_mode: "quota",
    start_time: 1717200000,
    end_time: 1893456000,
    amount_total: 1000000,
    amount_used: 100000,
    amount_remaining: 900000,
    approximate_times: 500,
    approximate_times_used: 50,
    upgrade_group: "",
    allowed_groups: "default",
    hourly_limit_amount: 0,
    hourly_amount_used: 0,
    hourly_limit_hours: 1,
    hourly_reset_mode: "",
    hourly_next_reset_time: 0,
    daily_limit_amount: 0,
    daily_amount_used: 0,
    daily_reset_mode: "",
    daily_next_reset_time: 0,
    weekly_limit_amount: 0,
    weekly_amount_used: 0,
    weekly_reset_mode: "",
    weekly_next_reset_time: 0,
    monthly_limit_amount: 0,
    monthly_amount_used: 0,
    monthly_reset_mode: "",
    monthly_next_reset_time: 0,
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function matchesText(value, query) {
  return String(value || "").toLowerCase().includes(query.toLowerCase());
}

async function mockApi(page) {
  const requests = [];
  const unhandled = [];
  const subscriptions = clone(baseSubscriptions);
  const plans = clone(adminPlans);
  let nextPlanId = 201;

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    const params = Object.fromEntries(url.searchParams.entries());
    const body = method === "GET" ? undefined : request.postDataJSON();
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
          system_name: "new-api subscriptions smoke",
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

    if (method === "GET" && url.pathname === "/api/option/") {
      await fulfill({ success: true, data: null });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self/groups") {
      await fulfill({
        success: true,
        data: {
          default: { desc: "Default group", ratio: 1 },
          pro: { desc: "Pro group", ratio: 1 },
        },
      });
      return;
    }

    if (method === "GET" && ["/api/group", "/api/group/"].includes(url.pathname)) {
      await fulfill({ success: true, data: ["default", "pro"] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/subscription/admin/plans") {
      await fulfill({ success: true, data: clone(plans) });
      return;
    }

    if (method === "POST" && url.pathname === "/api/subscription/admin/plans") {
      const created = {
        plan: {
          id: nextPlanId++,
          ...body.plan,
        },
      };
      plans.unshift(created);
      await fulfill({ success: true, data: clone(created), message: "created" });
      return;
    }

    const planMatch = url.pathname.match(
      /^\/api\/subscription\/admin\/plans\/(\d+)$/
    );
    if (planMatch && method === "PUT") {
      const id = Number(planMatch[1]);
      const index = plans.findIndex((item) => item.plan.id === id);
      if (index >= 0) {
        plans[index] = {
          plan: {
            ...plans[index].plan,
            ...body.plan,
            id,
          },
        };
      }
      await fulfill({
        success: true,
        data: clone(plans[index]),
        message: "updated",
      });
      return;
    }

    if (planMatch && method === "PATCH") {
      const id = Number(planMatch[1]);
      const plan = plans.find((item) => item.plan.id === id);
      if (plan) plan.plan.enabled = body.enabled;
      await fulfill({ success: true, data: clone(plan), message: "patched" });
      return;
    }

    if (planMatch && method === "DELETE") {
      const id = Number(planMatch[1]);
      const index = plans.findIndex((item) => item.plan.id === id);
      if (index >= 0) plans.splice(index, 1);
      await fulfill({ success: true, data: { message: "deleted" } });
      return;
    }

    if (method === "GET" && url.pathname === "/api/subscription/admin/all") {
      let filtered = subscriptions;
      if (params.username) {
        filtered = filtered.filter(
          (subscription) =>
            matchesText(subscription.username, params.username) ||
            matchesText(subscription.user_email, params.username)
        );
      }
      if (params.plan_id) {
        filtered = filtered.filter(
          (subscription) => String(subscription.plan_id) === String(params.plan_id)
        );
      }
      if (params.status) {
        filtered = filtered.filter(
          (subscription) => subscription.status === params.status
        );
      }
      if (params.user_group) {
        filtered = filtered.filter((subscription) =>
          matchesText(subscription.user_group, params.user_group)
        );
      }

      await fulfill({
        success: true,
        data: {
          data: clone(filtered),
          total: filtered.length,
          page: Number(params.page || 1),
          page_size: Number(params.page_size || 20),
        },
      });
      return;
    }

    const invalidateMatch = url.pathname.match(
      /^\/api\/subscription\/admin\/user_subscriptions\/(\d+)\/invalidate$/
    );
    if (invalidateMatch && method === "POST") {
      const id = Number(invalidateMatch[1]);
      const subscription = subscriptions.find((item) => item.id === id);
      if (subscription) subscription.status = "cancelled";
      await fulfill({ success: true, data: { message: "invalidated" } });
      return;
    }

    const deleteMatch = url.pathname.match(
      /^\/api\/subscription\/admin\/user_subscriptions\/(\d+)$/
    );
    if (deleteMatch && method === "DELETE") {
      const id = Number(deleteMatch[1]);
      const index = subscriptions.findIndex((item) => item.id === id);
      if (index >= 0) subscriptions.splice(index, 1);
      await fulfill({ success: true, data: { message: "deleted" } });
      return;
    }

    unhandled.push(`${method} ${url.pathname}`);
    await fulfill({ success: false, message: `Unhandled ${method} ${url.pathname}` }, 404);
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

async function authenticateAs(page, storedUser) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("i18nextLng", "en");
    window.localStorage.setItem("user", JSON.stringify(value));
    window.localStorage.setItem("uid", String(value.id));
    window.localStorage.setItem("setup_required", "false");
  }, storedUser);
}

async function openAllSubscriptions(page) {
  await page.goto("/subscriptions");
  await expect(page.getByRole("heading", { name: "Subscription Management" })).toBeVisible();
  await page.getByRole("tab", { name: "All Subscriptions" }).click();
  await expect(page.getByPlaceholder("Search username or email")).toBeVisible();
}

async function openPlans(page) {
  await page.goto("/subscriptions");
  await expect(page.getByRole("heading", { name: "Subscription Management" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Plans" })).toBeVisible();
  await expect(page.getByText("Smoke Pro Plan")).toBeVisible();
}

async function openRowMenu(page, rowText) {
  const row = page.getByRole("row", { name: new RegExp(rowText) });
  await expect(row).toBeVisible();
  await row.getByRole("button").last().click();
}

test.describe("admin all-subscriptions runtime surface", () => {
  test("opens the admin all-subscriptions tab from the legacy overview route", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/console/subscription-overview");

    await expect(page).toHaveURL(/\/subscriptions\?tab=all-subscriptions$/);
    await expect(page.getByRole("heading", { name: "Subscription Management" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "All Subscriptions" })).toHaveAttribute(
      "data-state",
      "active"
    );
    await expect(page.getByText("alice-smoke@example.com")).toBeVisible();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/subscription/admin/all"
      )
    ).toBeTruthy();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/subscription/self"
      )
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });

  test("rejects common users from the legacy subscription overview route before admin APIs mount", async ({
    page,
  }) => {
    const commonUser = {
      ...user,
      id: 8402,
      username: "subscriptions-smoke-user",
      display_name: "Subscriptions Smoke User",
      role: 1,
    };
    const { requests, unhandled } = await mockApi(page);
    await authenticateAs(page, commonUser);

    await page.goto("/console/subscription-overview");

    await expect(page).toHaveURL(/\/403$/);
    await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
    expect(
      requests.some((request) =>
        request.pathname.startsWith("/api/subscription/admin")
      )
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });

  test("manages plan CRUD and deletes disabled plans as backend admin", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await openPlans(page);

    await page.getByRole("button", { name: "Create Plan" }).click();
    let drawer = page.getByRole("dialog");
    await expect(
      drawer.getByRole("heading", { name: "Create new subscription plan" })
    ).toBeVisible();
    await drawer.getByLabel("Plan Title").fill("Smoke Runtime Plan");
    await drawer.getByLabel("Plan Subtitle").fill("Created from smoke");
    await drawer.getByLabel("Actual Amount").fill("19.5");
    await drawer.getByLabel(/Total Quota/).fill("0");
    await drawer.getByLabel("Purchase Limit").fill("0");
    await drawer.getByLabel("Sort Order").fill("9");
    await drawer.getByLabel("Allowed Groups").fill("default");
    await drawer.getByRole("button", { name: "Save" }).click();
    await expect(drawer).toBeHidden();
    await expect(page.getByText("Smoke Runtime Plan")).toBeVisible();

    await openRowMenu(page, "Smoke Pro Plan");
    await page.getByRole("menuitem", { name: "Edit" }).click();
    drawer = page.getByRole("dialog");
    await expect(
      drawer.getByRole("heading", { name: "Update plan info" })
    ).toBeVisible();
    await drawer.getByLabel("Plan Title").fill("Smoke Pro Plan Edited");
    await drawer.getByLabel("Actual Amount").fill("11");
    await drawer.getByLabel(/Total Quota/).fill("0");
    await drawer.getByLabel("Purchase Limit").fill("0");
    await drawer.getByRole("button", { name: "Save" }).click();
    await expect(drawer).toBeHidden();
    await expect(page.getByText("Smoke Pro Plan Edited")).toBeVisible();

    await openRowMenu(page, "Smoke Pro Plan Edited");
    await page.getByRole("menuitem", { name: "Disable", exact: true }).click();
    let confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog.getByRole("heading", { name: "Confirm disable" })).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Disable" }).click();
    await expect(confirmDialog).toBeHidden();

    await openRowMenu(page, "Smoke Pro Plan Edited");
    await page.getByRole("menuitem", { name: "Delete" }).click();
    confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog.getByRole("heading", { name: "Confirm delete" })).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Delete" }).click();
    await expect(confirmDialog).toBeHidden();
    await expect(page.getByText("Smoke Pro Plan Edited")).toBeHidden();

    const createRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/subscription/admin/plans" &&
        request.body?.plan?.title === "Smoke Runtime Plan"
    );
    const updateRequest = requests.find(
      (request) =>
        request.method === "PUT" &&
        request.pathname === "/api/subscription/admin/plans/101" &&
        request.body?.plan?.title === "Smoke Pro Plan Edited"
    );
    const toggleRequest = requests.find(
      (request) =>
        request.method === "PATCH" &&
        request.pathname === "/api/subscription/admin/plans/101" &&
        request.body?.enabled === false
    );
    const deleteRequest = requests.find(
      (request) =>
        request.method === "DELETE" &&
        request.pathname === "/api/subscription/admin/plans/101" &&
        request.body == null
    );

    expect(createRequest?.body?.plan).toMatchObject({
      title: "Smoke Runtime Plan",
      price_amount: 19.5,
      total_amount: 0,
      max_purchase_per_user: 0,
      allowed_groups: "default",
    });
    expect(updateRequest?.body?.plan).toMatchObject({
      title: "Smoke Pro Plan Edited",
      price_amount: 11,
      total_amount: 0,
      max_purchase_per_user: 0,
    });
    expect(toggleRequest).toBeTruthy();
    expect(deleteRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("loads all subscriptions and sends server-backed filter params", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await openAllSubscriptions(page);
    await expect(page.getByText("alice-smoke@example.com")).toBeVisible();
    await expect(page.getByText("bob-smoke@example.com")).toBeVisible();
    await expect(page.getByText("Smoke Pro Plan").first()).toBeVisible();
    await expect(page.getByText("All Groups")).toBeVisible();
    await expect(page.getByText("Page 1 of 1")).toBeVisible();

    await page.getByPlaceholder("Search username or email").fill("alice");
    await expect(page.getByText("alice-smoke@example.com")).toBeVisible();
    await expect(page.getByText("bob-smoke@example.com")).toBeHidden();

    await page.getByRole("combobox").filter({ hasText: "All Plans" }).click();
    await page.getByRole("option", { name: "Smoke Pro Plan" }).click();

    await page.getByRole("combobox").filter({ hasText: "All Status" }).click();
    await page.getByRole("option", { name: "Active" }).click();

    await page.getByPlaceholder("User Group").fill("default");
    await expect(page.getByText("alice-smoke@example.com")).toBeVisible();

    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.getByText("bob-smoke@example.com")).toBeVisible();

    const usernameRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/subscription/admin/all" &&
        request.params.username === "alice"
    );
    const planRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/subscription/admin/all" &&
        request.params.plan_id === "101"
    );
    const statusRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/subscription/admin/all" &&
        request.params.status === "active"
    );
    const groupRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/subscription/admin/all" &&
        request.params.user_group === "default"
    );

    expect(usernameRequest).toBeTruthy();
    expect(planRequest).toBeTruthy();
    expect(statusRequest).toBeTruthy();
    expect(groupRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("invalidates active subscriptions and deletes subscription records", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await openAllSubscriptions(page);
    await expect(page.getByText("alice-smoke@example.com")).toBeVisible();

    await openRowMenu(page, "alice-smoke@example.com");
    await page.getByRole("menuitem", { name: "Invalidate" }).click();
    const invalidateDialog = page.getByRole("dialog");
    await expect(invalidateDialog.getByRole("heading", { name: "Confirm invalidate" })).toBeVisible();
    await invalidateDialog.getByRole("button", { name: "Confirm" }).click();
    await expect(invalidateDialog).toBeHidden();

    await openRowMenu(page, "bob-smoke@example.com");
    await expect(page.getByRole("menuitem", { name: "Invalidate" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    await page.keyboard.press("Escape");

    await openRowMenu(page, "bob-smoke@example.com");
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const deleteDialog = page.getByRole("dialog");
    await expect(deleteDialog.getByRole("heading", { name: "Confirm delete" })).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Confirm" }).click();
    await expect(deleteDialog).toBeHidden();
    await expect(page.getByText("bob-smoke@example.com")).toBeHidden();

    const invalidateRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/subscription/admin/user_subscriptions/501/invalidate" &&
        request.body == null
    );
    const deleteRequest = requests.find(
      (request) =>
        request.method === "DELETE" &&
        request.pathname === "/api/subscription/admin/user_subscriptions/502" &&
        request.body == null
    );

    expect(invalidateRequest).toBeTruthy();
    expect(deleteRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
