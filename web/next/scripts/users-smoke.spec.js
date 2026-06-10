/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const adminUser = {
  id: 7801,
  username: "users-admin-smoke",
  display_name: "Users Admin Smoke",
  email: "users-admin-smoke@example.com",
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

const baseUsers = [
  {
    id: 9001,
    username: "runtime-user",
    display_name: "Runtime User",
    password: "",
    github_id: "gh-runtime",
    discord_id: "",
    oidc_id: "",
    wechat_id: "",
    telegram_id: "",
    email: "runtime-user@example.com",
    quota: 300000,
    used_quota: 100000,
    request_count: 12,
    group: "default",
    aff_code: "runtime",
    aff_count: 2,
    aff_quota: 1000,
    aff_history_quota: 3000,
    inviter_id: 0,
    linux_do_id: "",
    status: 1,
    role: 1,
    created_at: 1717200000,
    updated_at: 1717203600,
    last_login_at: 1717210000,
    DeletedAt: null,
    remark: "baseline",
  },
  {
    id: 9002,
    username: "billing-user",
    display_name: "Billing User",
    password: "",
    github_id: "",
    discord_id: "",
    oidc_id: "",
    wechat_id: "",
    telegram_id: "",
    email: "billing-user@example.com",
    quota: 200000,
    used_quota: 50000,
    request_count: 5,
    group: "pro",
    aff_code: "billing",
    aff_count: 0,
    aff_quota: 0,
    aff_history_quota: 0,
    inviter_id: 9001,
    linux_do_id: "",
    status: 2,
    role: 1,
    created_at: 1717300000,
    updated_at: 1717303600,
    last_login_at: 0,
    DeletedAt: null,
    remark: "",
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseJsonBody(request) {
  const body = request.postData();
  return body ? JSON.parse(body) : undefined;
}

function filterUsers(users, params) {
  const keyword = (params.keyword || "").toLowerCase();

  return users.filter((user) => {
    if (
      keyword &&
      !(
        user.username.toLowerCase().includes(keyword) ||
        user.display_name.toLowerCase().includes(keyword) ||
        (user.email || "").toLowerCase().includes(keyword)
      )
    ) {
      return false;
    }

    if (params.status && String(user.status) !== String(params.status)) {
      return false;
    }
    if (params.role && String(user.role) !== String(params.role)) {
      return false;
    }
    if (params.group && String(user.group) !== String(params.group)) {
      return false;
    }

    return true;
  });
}

function paginatedUsers(users, params) {
  const page = Number(params.p || 1);
  const pageSize = Number(params.page_size || 20);
  const start = (page - 1) * pageSize;

  return {
    success: true,
    data: {
      items: clone(users.slice(start, start + pageSize)),
      total: users.length,
      page,
      page_size: pageSize,
    },
  };
}

async function mockApi(page) {
  const requests = [];
  const unhandled = [];
  const users = clone(baseUsers);
  const customOAuthBindings = [
    {
      provider_id: "77",
      provider_name: "Acme SSO",
      user_id: 9001,
      external_id: "acme-runtime",
    },
  ];
  const subscriptionPlans = [
    {
      plan: {
        id: 7001,
        title: "Smoke Pro Plan",
        price_amount: 9.99,
      },
    },
    {
      plan: {
        id: 7002,
        title: "Smoke Open Plan",
        price_amount: 0,
      },
    },
  ];
  const userSubscriptions = [
    {
      subscription: {
        id: 8801,
        user_id: 9001,
        plan_id: 7001,
        status: "active",
        source: "admin",
        billing_mode: "quota",
        start_time: 1717200000,
        end_time: 1893456000,
        amount_total: 120000,
        amount_used: 30000,
        allowed_groups: "users-premium, users-vision",
      },
    },
    {
      subscription: {
        id: 8802,
        user_id: 9001,
        plan_id: 7002,
        status: "cancelled",
        source: "admin",
        billing_mode: "quota",
        start_time: 1717300000,
        end_time: 1719900000,
        amount_total: 0,
        amount_used: 0,
        allowed_groups: "",
      },
    },
  ];
  let nextUserId = 9100;
  let nextSubscriptionId = 8900;

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
          system_name: "new-api users smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          quota_per_unit: 1,
          github_oauth: true,
          discord_oauth: true,
          oidc_enabled: true,
          wechat_login: true,
          telegram_oauth: true,
          linuxdo_oauth: true,
          custom_oauth_providers: [
            {
              id: "77",
              name: "Acme SSO",
            },
          ],
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({
        success: true,
        data: {
          notice: "",
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: adminUser });
      return;
    }

    if (method === "GET" && url.pathname === "/api/group/") {
      await fulfill({ success: true, data: ["default", "pro"] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/") {
      await fulfill(paginatedUsers(users, params));
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/search") {
      await fulfill(paginatedUsers(filterUsers(users, params), params));
      return;
    }

    if (method === "GET" && url.pathname === "/api/subscription/admin/plans") {
      await fulfill({ success: true, data: clone(subscriptionPlans) });
      return;
    }

    const userSubscriptionsMatch = url.pathname.match(
      /^\/api\/subscription\/admin\/users\/(\d+)\/subscriptions$/
    );
    if (userSubscriptionsMatch && method === "GET") {
      const userId = Number(userSubscriptionsMatch[1]);
      await fulfill({
        success: true,
        data: clone(
          userSubscriptions.filter(
            (item) => item.subscription.user_id === userId
          )
        ),
      });
      return;
    }

    if (userSubscriptionsMatch && method === "POST") {
      const userId = Number(userSubscriptionsMatch[1]);
      userSubscriptions.unshift({
        subscription: {
          id: nextSubscriptionId++,
          user_id: userId,
          plan_id: body.plan_id,
          status: "active",
          source: "admin",
          billing_mode: "quota",
          start_time: 1719880000,
          end_time: 1893456000,
          amount_total: 100000,
          amount_used: 0,
          allowed_groups: "",
        },
      });
      await fulfill({
        success: true,
        data: { message: "subscription added" },
      });
      return;
    }

    const invalidateSubscriptionMatch = url.pathname.match(
      /^\/api\/subscription\/admin\/user_subscriptions\/(\d+)\/invalidate$/
    );
    if (invalidateSubscriptionMatch && method === "POST") {
      const subscriptionId = Number(invalidateSubscriptionMatch[1]);
      const record = userSubscriptions.find(
        (item) => item.subscription.id === subscriptionId
      );
      if (record) record.subscription.status = "cancelled";
      await fulfill({
        success: true,
        data: { message: "subscription invalidated" },
      });
      return;
    }

    const deleteSubscriptionMatch = url.pathname.match(
      /^\/api\/subscription\/admin\/user_subscriptions\/(\d+)$/
    );
    if (deleteSubscriptionMatch && method === "DELETE") {
      const subscriptionId = Number(deleteSubscriptionMatch[1]);
      const index = userSubscriptions.findIndex(
        (item) => item.subscription.id === subscriptionId
      );
      if (index >= 0) userSubscriptions.splice(index, 1);
      await fulfill({ success: true, message: "subscription deleted" });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/") {
      const created = {
        id: nextUserId++,
        username: body.username,
        display_name: body.display_name,
        password: "",
        github_id: "",
        discord_id: "",
        oidc_id: "",
        wechat_id: "",
        telegram_id: "",
        email: "",
        quota: 0,
        used_quota: 0,
        request_count: 0,
        group: "default",
        aff_code: body.username,
        aff_count: 0,
        aff_quota: 0,
        aff_history_quota: 0,
        inviter_id: 0,
        linux_do_id: "",
        status: 1,
        role: body.role,
        created_at: 1719880000,
        updated_at: 1719880000,
        last_login_at: 0,
        DeletedAt: null,
        remark: "",
      };
      users.unshift(created);
      await fulfill({ success: true, data: clone(created), message: "created" });
      return;
    }

    const oauthBindingsMatch = url.pathname.match(
      /^\/api\/user\/(\d+)\/oauth\/bindings$/
    );
    if (oauthBindingsMatch && method === "GET") {
      const userId = Number(oauthBindingsMatch[1]);
      await fulfill({
        success: true,
        data: clone(
          customOAuthBindings.filter((item) => item.user_id === userId)
        ),
      });
      return;
    }

    const customUnbindMatch = url.pathname.match(
      /^\/api\/user\/(\d+)\/oauth\/bindings\/([^/]+)$/
    );
    if (customUnbindMatch && method === "DELETE") {
      const userId = Number(customUnbindMatch[1]);
      const providerId = customUnbindMatch[2];
      const index = customOAuthBindings.findIndex(
        (item) =>
          item.user_id === userId && String(item.provider_id) === providerId
      );
      if (index >= 0) customOAuthBindings.splice(index, 1);
      await fulfill({ success: true, message: "custom binding cleared" });
      return;
    }

    const builtinBindingMatch = url.pathname.match(
      /^\/api\/user\/(\d+)\/bindings\/([^/]+)$/
    );
    if (builtinBindingMatch && method === "DELETE") {
      const id = Number(builtinBindingMatch[1]);
      const bindingType = builtinBindingMatch[2];
      const user = users.find((item) => item.id === id);
      const fieldByBindingType = {
        email: "email",
        github: "github_id",
        discord: "discord_id",
        oidc: "oidc_id",
        wechat: "wechat_id",
        telegram: "telegram_id",
        linuxdo: "linux_do_id",
      };
      const field = fieldByBindingType[bindingType];
      if (user && field) {
        user[field] = "";
        await fulfill({ success: true, message: "binding cleared" });
      } else {
        await fulfill({ success: false, message: "invalid binding type" }, 400);
      }
      return;
    }

    const resetPasskeyMatch = url.pathname.match(
      /^\/api\/user\/(\d+)\/reset_passkey$/
    );
    if (resetPasskeyMatch && method === "DELETE") {
      await fulfill({ success: true, message: "passkey reset" });
      return;
    }

    const resetTwoFAMatch = url.pathname.match(/^\/api\/user\/(\d+)\/2fa$/);
    if (resetTwoFAMatch && method === "DELETE") {
      await fulfill({ success: true, message: "2fa reset" });
      return;
    }

    if (method === "PUT" && url.pathname === "/api/user/") {
      const index = users.findIndex((user) => user.id === body.id);
      if (index >= 0) {
        users[index] = {
          ...users[index],
          ...body,
          display_name: body.display_name,
          group: body.group,
          remark: body.remark || "",
        };
      }
      await fulfill({
        success: index >= 0,
        data: index >= 0 ? clone(users[index]) : undefined,
        message: index >= 0 ? "updated" : "not found",
      }, index >= 0 ? 200 : 404);
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/manage") {
      const user = users.find((item) => item.id === body.id);
      if (!user) {
        await fulfill({ success: false, message: "not found" }, 404);
        return;
      }

      if (body.action === "disable") {
        user.status = 2;
      } else if (body.action === "enable") {
        user.status = 1;
      } else if (body.action === "promote") {
        user.role = 10;
      } else if (body.action === "demote") {
        user.role = 1;
      } else if (body.action === "add_quota") {
        if (body.mode === "override") {
          user.quota = body.value;
        } else if (body.mode === "subtract") {
          user.quota -= body.value;
        } else {
          user.quota += body.value;
        }
      }

      await fulfill({ success: true, data: clone(user), message: "managed" });
      return;
    }

    const userMatch = url.pathname.match(/^\/api\/user\/(\d+)$/);
    if (userMatch && method === "GET") {
      const id = Number(userMatch[1]);
      const user = users.find((item) => item.id === id);
      await fulfill(
        user
          ? { success: true, data: clone(user) }
          : { success: false, message: "not found" },
        user ? 200 : 404
      );
      return;
    }

    const deleteMatch = url.pathname.match(/^\/api\/user\/(\d+)\/$/);
    if (deleteMatch && method === "DELETE") {
      const id = Number(deleteMatch[1]);
      const index = users.findIndex((user) => user.id === id);
      if (index >= 0) users.splice(index, 1);
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

test.describe("users runtime surface", () => {
  test("applies URL status role and group filters through backend search", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/users?status=2&role=1&group=pro");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByText("billing-user")).toBeVisible();
    await expect(page.getByText("runtime-user")).toBeHidden();

    const searchRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/user/search" &&
        request.params.status === "2" &&
        request.params.role === "1" &&
        request.params.group === "pro"
    );
    expect(searchRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("searches, creates, edits, adjusts quota, disables, and deletes users", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByText("runtime-user")).toBeVisible();
    await expect(page.getByText("billing-user")).toBeVisible();

    await page.getByPlaceholder("Filter by username, name or email...").fill("billing");
    await expect(page.getByText("billing-user")).toBeVisible();
    await expect(page.getByText("runtime-user")).toBeHidden();

    const searchRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/user/search" &&
        request.params.keyword === "billing"
    );
    expect(searchRequest).toBeTruthy();

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText("runtime-user")).toBeVisible();

    await page.getByRole("button", { name: "Add User" }).click();
    await expect(page.getByRole("dialog", { name: /Create User/ })).toBeVisible();
    await page.getByLabel("Username").fill("managed-user");
    await page.getByLabel("Display Name").fill("Managed User");
    await page.getByLabel("Password").fill("managed-pass");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("User created successfully")).toBeVisible();
    await expect(page.getByText("managed-user")).toBeVisible();

    const createRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/user/" &&
        request.body?.username === "managed-user"
    );
    expect(createRequest).toBeTruthy();
    expect(createRequest.body).toMatchObject({
      username: "managed-user",
      display_name: "Managed User",
      password: "managed-pass",
      role: 1,
    });

    await openRowMenu(page, "managed-user");
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(page.getByRole("dialog", { name: /Update User/ })).toBeVisible();
    await expect(page.getByLabel("Username")).toBeDisabled();
    await page.getByLabel("Display Name").fill("Managed User Edited");
    await page.getByLabel("Remark").fill("Runtime smoke remark");

    await page.getByRole("button", { name: "Adjust Quota" }).click();
    await expect(page.getByRole("heading", { name: "Adjust Quota" })).toBeVisible();
    await page.getByRole("spinbutton").last().fill("1000");
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("Quota adjusted successfully")).toBeVisible();

    const quotaRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/user/manage" &&
        request.body?.id === 9100 &&
        request.body?.action === "add_quota" &&
        request.body?.mode === "add" &&
        request.body?.value === 1000
    );
    expect(quotaRequest).toBeTruthy();

    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("User updated successfully")).toBeVisible();
    await expect(page.getByText("Managed User Edited")).toBeVisible();

    const updateRequest = requests.find(
      (request) =>
        request.method === "PUT" &&
        request.pathname === "/api/user/" &&
        request.body?.id === 9100 &&
        request.body?.display_name === "Managed User Edited" &&
        request.body?.remark === "Runtime smoke remark"
    );
    expect(updateRequest).toBeTruthy();

    await openRowMenu(page, "managed-user");
    await page.getByRole("menuitem", { name: "Disable" }).click();
    await expect(page.getByText("User disabled successfully")).toBeVisible();

    const disableRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/user/manage" &&
        request.body?.id === 9100 &&
        request.body?.action === "disable"
    );
    expect(disableRequest).toBeTruthy();

    await openRowMenu(page, "managed-user");
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(page.getByRole("alertdialog", { name: "Are you sure?" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("User deleted successfully")).toBeVisible();
    await expect(page.getByText("managed-user")).toBeHidden();

    const deleteRequest = requests.find(
      (request) =>
        request.method === "DELETE" && request.pathname === "/api/user/9100/"
    );
    expect(deleteRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("manages account bindings and security resets with admin endpoints", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

    await openRowMenu(page, "runtime-user");
    await page.getByRole("menuitem", { name: "Manage Bindings" }).click();
    await expect(
      page.getByRole("dialog", { name: "Account Binding Management" })
    ).toBeVisible();
    await expect(page.getByText("gh-runtime")).toBeVisible();
    await expect(page.getByText("acme-runtime")).toBeVisible();

    await page.getByRole("button", { name: "Unbind GitHub" }).click();
    await expect(page.getByRole("dialog", { name: "Confirm Unbind" })).toBeVisible();
    await page.getByRole("button", { name: "Confirm Unbind" }).click();
    await expect(page.getByText("Unbound GitHub")).toBeVisible();

    await page.getByRole("button", { name: "Unbind Acme SSO" }).click();
    await expect(page.getByRole("dialog", { name: "Confirm Unbind" })).toBeVisible();
    await page.getByRole("button", { name: "Confirm Unbind" }).click();
    await expect(page.getByText("Unbound Acme SSO")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: "Account Binding Management" })
    ).toBeHidden();

    await openRowMenu(page, "runtime-user");
    await page.getByRole("menuitem", { name: "Reset Passkey" }).click();
    await expect(page.getByText("Reset Passkey for runtime-user?")).toBeVisible();
    await page.getByRole("button", { name: "Reset Passkey" }).click();
    await expect(page.getByText("Passkey reset successfully")).toBeVisible();

    await openRowMenu(page, "runtime-user");
    await page.getByRole("menuitem", { name: "Reset 2FA" }).click();
    await expect(page.getByText("Reset 2FA for runtime-user?")).toBeVisible();
    await page.getByRole("button", { name: "Reset 2FA" }).click();
    await expect(page.getByText("Two-factor authentication reset")).toBeVisible();

    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/user/9001/oauth/bindings"
      )
    ).toBe(true);
    expect(
      requests.some(
        (request) =>
          request.method === "DELETE" &&
          request.pathname === "/api/user/9001/bindings/github"
      )
    ).toBe(true);
    expect(
      requests.some(
        (request) =>
          request.method === "DELETE" &&
          request.pathname === "/api/user/9001/oauth/bindings/77"
      )
    ).toBe(true);
    expect(
      requests.some(
        (request) =>
          request.method === "DELETE" &&
          request.pathname === "/api/user/9001/reset_passkey"
      )
    ).toBe(true);
    expect(
      requests.some(
        (request) =>
          request.method === "DELETE" && request.pathname === "/api/user/9001/2fa"
      )
    ).toBe(true);
    expect(
      requests.some(
        (request) =>
          request.method === "DELETE" &&
          request.pathname === "/api/user/9001/bindings/github_id"
      )
    ).toBe(false);
    expect(unhandled).toEqual([]);
  });

  test("shows row subscription management with allowed group permissions", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

    await openRowMenu(page, "runtime-user");
    await page.getByRole("menuitem", { name: "Manage Subscriptions" }).click();

    const dialog = page.getByRole("dialog", {
      name: "User Subscription Management",
    });
    await expect(dialog).toBeVisible();
    const proSubscriptionRow = dialog.getByRole("row", { name: /#8801/ });
    await expect(proSubscriptionRow).toBeVisible();
    await expect(proSubscriptionRow.getByText("Smoke Pro Plan")).toBeVisible();
    await expect(proSubscriptionRow).toContainText("30,000 tokens/120,000 tokens");
    await expect(proSubscriptionRow).not.toContainText("30000/120000");
    await expect(dialog.getByText("Allowed Groups")).toBeVisible();
    await expect(dialog.getByText("users-premium")).toBeVisible();
    await expect(dialog.getByText("users-vision")).toBeVisible();
    await expect(dialog.getByText("All Groups")).toBeVisible();

    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/subscription/admin/plans"
      )
    ).toBe(true);
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname ===
            "/api/subscription/admin/users/9001/subscriptions"
      )
    ).toBe(true);
    expect(unhandled).toEqual([]);
  });

  test("keeps subscription management open across consecutive row mutations", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

    await openRowMenu(page, "runtime-user");
    await page.getByRole("menuitem", { name: "Manage Subscriptions" }).click();

    const dialog = page.getByRole("dialog", {
      name: "User Subscription Management",
    });
    await expect(dialog).toBeVisible();
    const subscriptionRow = dialog.getByRole("row", { name: /#8801/ });
    await expect(subscriptionRow).toBeVisible();

    await subscriptionRow.getByRole("button", { name: "Invalidate" }).click();
    const invalidateConfirm = page.getByRole("dialog", {
      name: "Confirm invalidate",
    });
    await expect(invalidateConfirm).toBeVisible();
    await invalidateConfirm.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("subscription invalidated")).toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(
      subscriptionRow.getByText("Invalidated", { exact: true })
    ).toBeVisible();

    await subscriptionRow.getByRole("button", { name: "Delete" }).click();
    const deleteConfirm = page.getByRole("dialog", { name: "Confirm delete" });
    await expect(deleteConfirm).toBeVisible();
    await deleteConfirm.getByRole("button", { name: "Confirm" }).click();
    await expect(
      page.locator("[data-title]").filter({ hasText: /^Deleted$/ })
    ).toBeVisible();
    await expect(dialog).toBeVisible();

    expect(
      requests.some(
        (request) =>
          request.method === "POST" &&
          request.pathname ===
            "/api/subscription/admin/user_subscriptions/8801/invalidate"
      )
    ).toBe(true);
    expect(
      requests.some(
        (request) =>
          request.method === "DELETE" &&
          request.pathname ===
            "/api/subscription/admin/user_subscriptions/8801"
      )
    ).toBe(true);
    expect(unhandled).toEqual([]);
  });
});
