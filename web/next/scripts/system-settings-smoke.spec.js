/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 8601,
  username: "system-settings-smoke-admin",
  display_name: "System Settings Smoke Admin",
  email: "system-settings-smoke-admin@example.com",
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

function buildUser(role) {
  return {
    ...user,
    id: 8601 + role,
    username: `system-settings-smoke-role-${role}`,
    display_name: `System Settings Smoke Role ${role}`,
    email: `system-settings-smoke-role-${role}@example.com`,
    role,
  };
}

const baseProviders = [
  {
    id: 301,
    name: "Legacy Smoke IDP",
    slug: "legacy-smoke",
    icon: "openid",
    enabled: true,
    client_id: "legacy-client",
    client_secret: "legacy-secret",
    authorization_endpoint: "https://legacy.example.com/oauth/authorize",
    token_endpoint: "https://legacy.example.com/oauth/token",
    user_info_endpoint: "https://legacy.example.com/userinfo",
    scopes: "openid profile email",
    user_id_field: "sub",
    username_field: "preferred_username",
    display_name_field: "name",
    email_field: "email",
    well_known: "https://legacy.example.com/.well-known/openid-configuration",
    auth_style: 1,
    access_policy: "",
    access_denied_message: "",
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

function rowByText(page, text) {
  return page.getByRole("row").filter({ hasText: text });
}

async function mockApi(page, activeUser = user) {
  const requests = [];
  const unhandled = [];
  const providers = clone(baseProviders);
  let nextProviderId = 401;

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
          system_name: "new-api system settings smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: activeUser });
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

    if (method === "GET" && url.pathname === "/api/custom-oauth-provider/") {
      await fulfill({ success: true, data: clone(providers) });
      return;
    }

    if (method === "GET" && url.pathname === "/api/performance/stats") {
      await fulfill({
        success: true,
        data: {
          cache_stats: {
            disk_cache_max_bytes: 1073741824,
            current_disk_usage_bytes: 0,
            active_disk_files: 0,
            disk_cache_hits: 0,
            current_memory_usage_bytes: 0,
            active_memory_buffers: 0,
            memory_cache_hits: 0,
          },
          disk_space_info: {
            total: 10737418240,
            free: 8589934592,
            used: 2147483648,
            used_percent: 20,
          },
          memory_stats: {
            alloc: 1048576,
            total_alloc: 2097152,
            sys: 4194304,
            num_gc: 1,
            num_goroutine: 8,
          },
          disk_cache_info: {
            path: "/tmp/new-api-cache",
            file_count: 0,
            total_size: 0,
          },
          config: {
            is_running_in_container: true,
          },
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/performance/logs") {
      await fulfill({
        success: true,
        data: {
          files: [],
          total_count: 0,
          total_size: 0,
        },
      });
      return;
    }

    if (
      method === "POST" &&
      url.pathname === "/api/custom-oauth-provider/discovery"
    ) {
      await fulfill({
        success: true,
        data: {
          well_known_url: body.well_known_url,
          discovery: {
            authorization_endpoint:
              "https://idp.example.com/oauth2/authorize",
            token_endpoint: "https://idp.example.com/oauth2/token",
            userinfo_endpoint: "https://idp.example.com/oauth2/userinfo",
            scopes_supported: ["openid", "profile", "email", "offline_access"],
          },
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/custom-oauth-provider/") {
      const created = {
        id: nextProviderId++,
        ...body,
      };
      providers.unshift(created);
      await fulfill({ success: true, data: clone(created), message: "created" });
      return;
    }

    const providerMatch = url.pathname.match(
      /^\/api\/custom-oauth-provider\/(\d+)$/
    );
    if (providerMatch && method === "PUT") {
      const id = Number(providerMatch[1]);
      const index = providers.findIndex((provider) => provider.id === id);
      if (index >= 0) {
        providers[index] = { ...providers[index], ...body };
      }
      await fulfill({
        success: true,
        data: clone(providers[index]),
        message: "updated",
      });
      return;
    }

    if (providerMatch && method === "DELETE") {
      const id = Number(providerMatch[1]);
      const index = providers.findIndex((provider) => provider.id === id);
      if (index >= 0) providers.splice(index, 1);
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

async function authenticate(page, activeUser = user) {
  await page.addInitScript((storedUser) => {
    window.localStorage.setItem("i18nextLng", "en");
    window.localStorage.setItem("user", JSON.stringify(storedUser));
    window.localStorage.setItem("uid", String(storedUser.id));
    window.localStorage.setItem("setup_required", "false");
  }, activeUser);
}

async function openCustomOAuth(page) {
  await page.goto("/system-settings/auth/custom-oauth");
  await expect(
    page.getByRole("heading", { name: "System Settings" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Custom OAuth Providers" })
  ).toBeVisible();
  await expect(page.getByText("Legacy Smoke IDP")).toBeVisible();
}

async function expectSystemSettingsRedirect(page, from, to, headingName) {
  await page.goto(from);
  await expect(page).toHaveURL(new RegExp(`${to.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
  await expect(
    page.getByRole("heading", { name: "System Settings" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: headingName, exact: true })
  ).toBeVisible();
}

test.describe("system settings custom OAuth runtime surface", () => {
  for (const role of [1, 10]) {
    test(`blocks role ${role} from direct system settings routes before root APIs mount`, async ({
      page,
    }) => {
      const roleUser = buildUser(role);
      const { requests, unhandled } = await mockApi(page, roleUser);
      await authenticate(page, roleUser);

      await page.goto("/system-settings/auth/custom-oauth");

      await expect(page).toHaveURL(/\/403$/);
      await expect(
        page.getByRole("heading", { name: "Access denied" })
      ).toBeVisible();
      expect(
        requests.some(
          (request) =>
            request.pathname === "/api/custom-oauth-provider/" ||
            request.pathname === "/api/option/" ||
            request.pathname.startsWith("/api/performance") ||
            request.pathname.startsWith("/api/ratio_sync")
        )
      ).toBe(false);
      expect(unhandled).toEqual([]);
    });
  }

  test("canonicalizes invalid settings sections to category defaults", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page);
    await authenticate(page);

    const invalidSectionCases = [
      {
        from: "/system-settings/auth/not-real",
        to: "/system-settings/auth/basic-auth",
        heading: "Basic Authentication",
      },
      {
        from: "/system-settings/billing/not-real",
        to: "/system-settings/billing/quota",
        heading: "Quota Settings",
      },
      {
        from: "/system-settings/content/not-real",
        to: "/system-settings/content/dashboard",
        heading: "Data Dashboard",
      },
      {
        from: "/system-settings/models/not-real",
        to: "/system-settings/models/global",
        heading: "Global Model Configuration",
      },
      {
        from: "/system-settings/operations/not-real",
        to: "/system-settings/operations/behavior",
        heading: "System Behavior",
      },
      {
        from: "/system-settings/security/not-real",
        to: "/system-settings/security/rate-limit",
        heading: "Rate Limiting",
      },
      {
        from: "/system-settings/site/not-real",
        to: "/system-settings/site/system-info",
        heading: "System Information",
      },
    ];

    for (const { from, to, heading } of invalidSectionCases) {
      await expectSystemSettingsRedirect(page, from, to, heading);
    }

    expect(unhandled).toEqual([]);
  });

  test("maps classic settings tab bookmarks to modern sections", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page);
    await authenticate(page);

    const classicTabCases = [
      {
        tab: "operation",
        route: "/system-settings/operations/behavior",
        heading: "System Behavior",
      },
      {
        tab: "dashboard",
        route: "/system-settings/content/dashboard",
        heading: "Data Dashboard",
      },
      {
        tab: "chats",
        route: "/system-settings/content/chat",
        heading: "Chat Presets",
      },
      {
        tab: "drawing",
        route: "/system-settings/content/drawing",
        heading: "Drawing",
      },
      {
        tab: "payment",
        route: "/system-settings/billing/payment",
        heading: "Payment Gateway",
      },
      {
        tab: "ratio",
        route: "/system-settings/billing/model-pricing",
        heading: "Model Pricing",
      },
      {
        tab: "ratelimit",
        route: "/system-settings/security/rate-limit",
        heading: "Rate Limiting",
      },
      {
        tab: "models",
        route: "/system-settings/models/global",
        heading: "Global Model Configuration",
      },
      {
        tab: "model-deployment",
        route: "/system-settings/models/model-deployment",
        heading: "io.net Deployments",
      },
      {
        tab: "performance",
        route: "/system-settings/operations/performance",
        heading: "Performance Settings",
      },
      {
        tab: "system",
        route: "/system-settings/auth/basic-auth",
        heading: "Basic Authentication",
      },
      {
        tab: "other",
        route: "/system-settings/site/system-info",
        heading: "System Information",
      },
    ];

    for (const { tab, route, heading } of classicTabCases) {
      await expectSystemSettingsRedirect(
        page,
        `/console/setting?tab=${tab}`,
        route,
        heading
      );
    }

    await expectSystemSettingsRedirect(
      page,
      "/console/setting",
      "/system-settings/operations/behavior",
      "System Behavior"
    );
    await expectSystemSettingsRedirect(
      page,
      "/console/setting?tab=not-real",
      "/system-settings/operations/behavior",
      "System Behavior"
    );

    expect(unhandled).toEqual([]);
  });

  test("manages providers through discovery, create, edit, and delete APIs", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await openCustomOAuth(page);

    await page.getByRole("button", { name: "Add Provider" }).click();
    let dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Add OAuth Provider" })
    ).toBeVisible();

    await dialog.getByLabel("Provider Name").fill("Created Smoke IDP");
    await dialog.getByLabel("Slug").fill("created-smoke");
    await dialog.getByLabel("Icon").fill("openid");
    await dialog.getByLabel("Client ID").fill("created-client");
    await dialog.getByLabel("Client Secret").fill("created-secret");
    await dialog
      .getByLabel("Well-Known URL")
      .fill("https://idp.example.com/.well-known/openid-configuration");
    await dialog.getByRole("button", { name: "Auto-discover" }).click();

    await expect(dialog.getByLabel("Authorization Endpoint")).toHaveValue(
      "https://idp.example.com/oauth2/authorize"
    );
    await expect(dialog.getByLabel("Token Endpoint")).toHaveValue(
      "https://idp.example.com/oauth2/token"
    );
    await expect(dialog.getByLabel("User Info Endpoint")).toHaveValue(
      "https://idp.example.com/oauth2/userinfo"
    );
    await expect(dialog.getByLabel("Scopes")).toHaveValue(
      "openid profile email"
    );

    await dialog.getByLabel("User ID Field").fill("sub");
    await dialog.getByLabel("Username Field").fill("preferred_username");
    await dialog.getByLabel("Display Name Field").fill("name");
    await dialog.getByLabel("Email Field").fill("email");
    await dialog.getByRole("button", { name: "Create Provider" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Created Smoke IDP")).toBeVisible();

    const existingRow = rowByText(page, "Legacy Smoke IDP");
    await existingRow.getByRole("button").first().click();
    dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Edit OAuth Provider" })
    ).toBeVisible();
    await expect(dialog.getByLabel("Provider Name")).toHaveValue(
      "Legacy Smoke IDP"
    );
    await dialog.getByLabel("Client ID").fill("legacy-updated-client");
    await dialog.getByLabel("Enabled").click();
    await dialog.getByRole("button", { name: "Update Provider" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("legacy-updated-client")).toBeVisible();

    const createdRow = rowByText(page, "Created Smoke IDP");
    await createdRow.getByRole("button").nth(1).click();
    dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Delete Provider" })
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Created Smoke IDP")).toBeHidden();

    const discoveryRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/custom-oauth-provider/discovery"
    );
    expect(discoveryRequest?.body).toEqual({
      well_known_url:
        "https://idp.example.com/.well-known/openid-configuration",
    });

    const createRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/custom-oauth-provider/"
    );
    expect(createRequest?.body).toMatchObject({
      name: "Created Smoke IDP",
      slug: "created-smoke",
      enabled: true,
      client_id: "created-client",
      client_secret: "created-secret",
      authorization_endpoint: "https://idp.example.com/oauth2/authorize",
      token_endpoint: "https://idp.example.com/oauth2/token",
      user_info_endpoint: "https://idp.example.com/oauth2/userinfo",
      scopes: "openid profile email",
      user_id_field: "sub",
      username_field: "preferred_username",
      display_name_field: "name",
      email_field: "email",
      auth_style: 0,
    });

    const updateRequest = requests.find(
      (request) =>
        request.method === "PUT" &&
        request.pathname === "/api/custom-oauth-provider/301"
    );
    expect(updateRequest?.body).toMatchObject({
      name: "Legacy Smoke IDP",
      enabled: false,
      client_id: "legacy-updated-client",
    });

    const deleteRequest = requests.find(
      (request) =>
        request.method === "DELETE" &&
        request.pathname === "/api/custom-oauth-provider/401" &&
        request.body == null
    );
    expect(deleteRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
