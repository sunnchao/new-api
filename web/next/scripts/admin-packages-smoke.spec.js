/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 7301,
  username: "admin-packages-smoke",
  display_name: "Admin Packages Smoke",
  email: "admin-packages-smoke@example.com",
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

const basePlans = [
  {
    id: 9101,
    name: "Smoke Basic Plan",
    type: "smoke_basic",
    description: "Runtime smoke baseline",
    price: 5,
    currency: "USD",
    total_quota: 100000,
    is_unlimited_time: false,
    duration_value: 1,
    duration_unit: "month",
    daily_quota_per_plan: 1000,
    weekly_quota_per_plan: 7000,
    monthly_quota_per_plan: 30000,
    reset_quota_limit: 30000,
    deduction_group: "default",
    is_active: true,
    show_in_portal: true,
  },
  {
    id: 9102,
    name: "Smoke Pro Plan",
    type: "smoke_pro",
    description: "Runtime smoke upgrade",
    price: 15,
    currency: "USD",
    total_quota: 500000,
    is_unlimited_time: false,
    duration_value: 1,
    duration_unit: "month",
    daily_quota_per_plan: 5000,
    weekly_quota_per_plan: 35000,
    monthly_quota_per_plan: 150000,
    reset_quota_limit: 150000,
    deduction_group: "default,pro",
    is_active: true,
    show_in_portal: true,
  },
];

const baseSubscriptions = [
  {
    id: 9201,
    user_id: 8101,
    user: {
      id: 8101,
      username: "active-smoke",
      email: "active-smoke@example.com",
    },
    plan_type: "smoke_basic",
    package_plan: {
      type: "smoke_basic",
      name: "Smoke Basic Plan",
      description: "Runtime smoke baseline",
    },
    status: "active",
    total_quota: 100000,
    remain_quota: 60000,
    reset_quota_limit: 30000,
    start_time: 1717200000,
    end_time: 1719792000,
  },
  {
    id: 9202,
    user_id: 8102,
    user: {
      id: 8102,
      username: "cancelled-smoke",
      email: "cancelled-smoke@example.com",
    },
    plan_type: "smoke_pro",
    package_plan: {
      type: "smoke_pro",
      name: "Smoke Pro Plan",
      description: "Runtime smoke upgrade",
    },
    status: "cancelled",
    total_quota: 500000,
    remain_quota: 320000,
    reset_quota_limit: 150000,
    start_time: 1717200000,
    end_time: 1719792000,
  },
];

const searchUsers = [
  {
    id: 8103,
    username: "grant-target",
    email: "grant-target@example.com",
    display_name: "Grant Target",
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseJsonBody(request) {
  const body = request.postData();
  if (!body) return undefined;
  return JSON.parse(body);
}

function packagePlanToBackendPlan(plan) {
  return {
    id: plan.id,
    title: plan.name,
    subtitle: plan.type,
    price_amount: plan.price,
    currency: plan.currency,
    total_amount: plan.total_quota,
    duration_unit: plan.duration_unit,
    duration_value: plan.duration_value,
    custom_seconds: plan.custom_seconds || 0,
    daily_limit_amount: plan.daily_quota_per_plan,
    weekly_limit_amount: plan.weekly_quota_per_plan,
    monthly_limit_amount: plan.monthly_quota_per_plan,
    allowed_groups: plan.deduction_group,
    enabled: plan.is_active,
    show_on_home: plan.show_in_portal,
    sort_order: plan.sort_order || 0,
  };
}

function packageSubscriptionToBackendOverview(subscription) {
  return {
    id: subscription.id,
    user_id: subscription.user_id,
    username: subscription.user?.username,
    user_email: subscription.user?.email,
    user_display_name: subscription.user?.display_name,
    plan_id: subscription.package_plan?.id || undefined,
    plan_title: subscription.package_plan?.name,
    status: subscription.status,
    billing_mode: "quota",
    amount_total: subscription.total_quota,
    amount_used: subscription.used_quota || subscription.total_quota - subscription.remain_quota,
    amount_remaining: subscription.remain_quota,
    start_time: subscription.start_time,
    end_time: subscription.end_time,
  };
}

async function mockApi(page) {
  const requests = [];
  const unhandled = [];
  const plans = basePlans.map(packagePlanToBackendPlan);
  const subscriptions = baseSubscriptions.map(packageSubscriptionToBackendOverview);
  let nextPlanId = 9300;
  let nextSubscriptionId = 9400;

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
          system_name: "new-api admin packages smoke",
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

    if (method === "GET" && url.pathname === "/api/subscription/admin/plans") {
      await fulfill({
        success: true,
        data: plans.map((plan) => ({ plan: clone(plan) })),
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/subscription/admin/plans") {
      const incomingPlan = body.plan || {};
      const created = {
        id: nextPlanId++,
        ...incomingPlan,
      };
      plans.unshift(created);
      await fulfill({ success: true, data: clone(created), message: "created" });
      return;
    }

    const planMatch = url.pathname.match(/^\/api\/subscription\/admin\/plans\/(\d+)$/);
    if (planMatch && method === "PUT") {
      const id = Number(planMatch[1]);
      const index = plans.findIndex((plan) => plan.id === id);
      if (index >= 0) {
        plans[index] = { ...plans[index], ...(body.plan || {}) };
      }
      await fulfill({ success: true, data: clone(plans[index]), message: "updated" });
      return;
    }

    if (planMatch && method === "DELETE") {
      const id = Number(planMatch[1]);
      const index = plans.findIndex((plan) => plan.id === id);
      if (index >= 0) plans.splice(index, 1);
      await fulfill({ success: true, message: "deleted" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/subscription/admin/all") {
      const status = params.status;
      const filtered = status
        ? subscriptions.filter((subscription) => subscription.status === status)
        : subscriptions;
      await fulfill({
        success: true,
        data: {
          data: clone(filtered),
          total: filtered.length,
          page: Number(params.page || 1),
          page_size: Number(params.page_size || 10),
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/search") {
      await fulfill({
        success: true,
        data: { items: clone(searchUsers), total: searchUsers.length },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/subscription/admin/bind") {
      const targetUser = searchUsers.find((item) => item.id === body.user_id) || searchUsers[0];
      const plan = plans.find((item) => item.id === body.plan_id) || plans[0];
      const granted = {
        id: nextSubscriptionId++,
        user_id: targetUser.id,
        username: targetUser.username,
        user_email: targetUser.email,
        user_display_name: targetUser.display_name,
        plan_id: plan.id,
        plan_title: plan.title,
        status: "active",
        billing_mode: "quota",
        amount_total: plan.total_amount,
        amount_used: 0,
        amount_remaining: plan.total_amount,
        start_time: 1719880000,
        end_time: 1722472000,
      };
      subscriptions.unshift(granted);
      await fulfill({ success: true, data: clone(granted), message: "granted" });
      return;
    }

    const subscriptionMatch = url.pathname.match(
      /^\/api\/subscription\/admin\/user_subscriptions\/(\d+)$/
    );
    if (subscriptionMatch && method === "DELETE") {
      const id = Number(subscriptionMatch[1]);
      const index = subscriptions.findIndex((item) => item.id === id);
      if (index >= 0) subscriptions.splice(index, 1);
      await fulfill({ success: true, message: "subscription removed" });
      return;
    }

    const invalidateMatch = url.pathname.match(
      /^\/api\/subscription\/admin\/user_subscriptions\/(\d+)\/invalidate$/
    );
    if (invalidateMatch && method === "POST") {
      const id = Number(invalidateMatch[1]);
      const subscription = subscriptions.find((item) => item.id === id);
      if (subscription) subscription.status = "cancelled";
      await fulfill({ success: true, message: "subscription cancelled" });
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

async function openRowMenu(page, rowText) {
  const row = page.getByRole("row", { name: new RegExp(rowText) });
  await expect(row).toBeVisible();
  await row.getByRole("button").last().click();
}

async function fillPlanForm(scope, values) {
  await scope.getByLabel("Name").fill(values.name);
  await scope.getByLabel("Type").fill(values.type);
  await scope.getByLabel("Description").fill(values.description);
  await scope.getByLabel("Price").fill(values.price);
  await scope.getByLabel("Currency").fill(values.currency);
  await scope.getByLabel("Quota", { exact: true }).fill(values.totalQuota);
  await scope.getByRole("spinbutton", { name: "Duration" }).fill(values.duration);
  await scope.getByLabel("Daily Quota Limit").fill(values.dailyLimit);
  await scope.getByLabel("Weekly Quota Limit").fill(values.weeklyLimit);
  await scope.getByLabel("Monthly Quota Limit").fill(values.monthlyLimit);
}

test.describe("admin package management runtime surface", () => {
  test("creates, edits, and deletes plans", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/admin-packages");
    await expect(page.getByRole("heading", { name: "Package Management" })).toBeVisible();
    await page.getByRole("tab", { name: "Plans" }).click();
    await expect(page.getByText("Smoke Basic Plan")).toBeVisible();

    await page.getByRole("button", { name: "Create Plan" }).click();
    const createDrawer = page.getByRole("dialog");
    await expect(createDrawer.getByRole("heading", { name: "Create Plan" })).toBeVisible();
    await fillPlanForm(createDrawer, {
      name: "Smoke Runtime Plan",
      type: "smoke_runtime",
      description: "Created from smoke test",
      price: "21.5",
      currency: "USD",
      totalQuota: "750000",
      duration: "3",
      dailyLimit: "25000",
      weeklyLimit: "100000",
      monthlyLimit: "300000",
    });
    await createDrawer.getByRole("button", { name: "Save" }).click();
    await expect(createDrawer).toBeHidden();
    await expect(page.getByText("Smoke Runtime Plan")).toBeVisible();

    await openRowMenu(page, "Smoke Runtime Plan");
    await page.getByRole("menuitem", { name: "Edit" }).click();
    const editDrawer = page.getByRole("dialog");
    await expect(editDrawer.getByRole("heading", { name: "Edit Plan" })).toBeVisible();
    await editDrawer.getByLabel("Name").fill("Smoke Runtime Plan Updated");
    await editDrawer.getByLabel("Price").fill("25");
    await editDrawer.getByRole("button", { name: "Save" }).click();
    await expect(editDrawer).toBeHidden();
    await expect(page.getByText("Smoke Runtime Plan Updated")).toBeVisible();

    await openRowMenu(page, "Smoke Runtime Plan Updated");
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const deleteDialog = page.getByRole("dialog");
    await expect(deleteDialog.getByRole("heading", { name: "Delete Plan" })).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Delete" }).click();
    await expect(deleteDialog).toBeHidden();
    await expect(page.getByRole("row", { name: /Smoke Runtime Plan Updated/ })).toBeHidden();

    const createRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/subscription/admin/plans" &&
        request.body?.plan?.title === "Smoke Runtime Plan" &&
        request.body?.plan?.price_amount === 21.5 &&
        request.body?.plan?.duration_unit === "month" &&
        request.body?.plan?.duration_unit !== "never" &&
        request.body?.plan?.daily_limit_amount === 25000
    );
    const updateRequest = requests.find(
      (request) =>
        request.method === "PUT" &&
        /^\/api\/subscription\/admin\/plans\/\d+$/.test(request.pathname) &&
        request.body?.plan?.title === "Smoke Runtime Plan Updated" &&
        request.body?.plan?.price_amount === 25 &&
        request.body?.plan?.duration_unit === "month" &&
        request.body?.plan?.duration_unit !== "never"
    );
    const deleteRequest = requests.find(
      (request) =>
        request.method === "DELETE" &&
        /^\/api\/subscription\/admin\/plans\/\d+$/.test(request.pathname)
    );

    expect(createRequest).toBeTruthy();
    expect(updateRequest).toBeTruthy();
    expect(deleteRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("filters, grants, and cancels subscriptions", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/admin-packages");
    await expect(page.getByRole("heading", { name: "Package Management" })).toBeVisible();
    await expect(page.getByText("active-smoke@example.com")).toBeVisible();

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Cancelled" }).click();
    await expect(page.getByText("cancelled-smoke@example.com")).toBeVisible();
    await expect(page.getByText("active-smoke@example.com")).toBeHidden();

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Active" }).click();
    await expect(page.getByText("active-smoke@example.com")).toBeVisible();

    await page.getByRole("button", { name: "Grant Subscription" }).first().click();
    const grantDialog = page.getByRole("dialog");
    await expect(grantDialog.getByRole("heading", { name: "Grant Subscription" })).toBeVisible();
    await grantDialog.getByPlaceholder("Search by email or username").fill("grant");
    await expect(grantDialog.getByText("grant-target@example.com")).toBeVisible();
    await grantDialog.getByText("grant-target@example.com").click();
    await grantDialog.getByRole("combobox").click();
    await page.getByRole("option", { name: "Smoke Pro Plan" }).click();
    await grantDialog.getByRole("button", { name: "Confirm" }).click();
    await expect(grantDialog).toBeHidden();
    await expect(page.getByText("grant-target@example.com")).toBeVisible();

    await openRowMenu(page, "grant-target@example.com");
    await page.getByRole("menuitem", { name: "Cancel Subscription" }).click();
    const cancelDialog = page.getByRole("dialog");
    await expect(cancelDialog.getByRole("heading", { name: "Cancel Subscription" })).toBeVisible();
    await cancelDialog.getByRole("button", { name: "Confirm" }).click();
    await expect(cancelDialog).toBeHidden();
    await expect(page.getByText("grant-target@example.com")).toBeHidden();

    const cancelledFilterRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/subscription/admin/all" &&
        request.params.status === "cancelled"
    );
    const grantRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/subscription/admin/bind" &&
        request.body?.user_id === searchUsers[0].id &&
        request.body?.plan_id === basePlans[1].id
    );
    const cancelRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        /^\/api\/subscription\/admin\/user_subscriptions\/\d+\/invalidate$/.test(
          request.pathname
        )
    );

    expect(cancelledFilterRequest).toBeTruthy();
    expect(grantRequest).toBeTruthy();
    expect(cancelRequest).toBeTruthy();
    expect(
      requests.some((request) => request.pathname.includes("/api/packages-admin"))
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });
});
