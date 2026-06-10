/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const commonUser = {
  id: 8901,
  username: "admin-route-access-smoke-user",
  display_name: "Admin Route Access Smoke User",
  email: "admin-route-access-smoke-user@example.com",
  role: 1,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 0,
  request_count: 0,
  permissions: {
    sidebar_settings: false,
  },
};

const adminOnlyRoutes = [
  "/channels",
  "/models",
  "/models/metadata",
  "/models/deployments",
  "/users",
  "/redemption-codes",
  "/subscriptions",
  "/admin-packages",
  "/admin-tokens",
  "/health",
  "/performance-metrics",
  "/dashboard/users",
  "/vibecoding/admin",
];

const forbiddenAdminApiPrefixes = [
  "/api/channel",
  "/api/models",
  "/api/deployments",
  "/api/vendors",
  "/api/user/",
  "/api/user/search",
  "/api/redemption",
  "/api/subscription/admin",
  "/api/packages-admin",
  "/api/admin/token",
  "/api/perf-metrics",
  "/api/data/users",
];

async function seedUser(page, user) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("setup_required", "false");
    window.localStorage.setItem("user", JSON.stringify(value));
    window.localStorage.setItem("uid", String(value.id));
  }, user);
}

async function mockApi(page, user) {
  const requests = [];
  const unhandled = [];

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    requests.push({ method, pathname: url.pathname });

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
          system_name: "new-api admin route access smoke",
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

    unhandled.push(`${method} ${url.pathname}`);
    await fulfill(
      { success: false, message: `Unhandled ${method} ${url.pathname}` },
      404
    );
  });

  return { requests, unhandled };
}

function isForbiddenAdminApi(request) {
  return forbiddenAdminApiPrefixes.some((prefix) =>
    request.pathname.startsWith(prefix)
  );
}

test.describe("admin direct-route access smoke", () => {
  for (const routePath of adminOnlyRoutes) {
    test(`redirects common users from ${routePath} to 403 before admin APIs mount`, async ({
      page,
    }) => {
      const { requests, unhandled } = await mockApi(page, commonUser);
      await seedUser(page, commonUser);

      await page.goto(routePath);

      await expect(page).toHaveURL(/\/403$/);
      await expect(
        page.getByRole("heading", { name: "Access denied" })
      ).toBeVisible();
      expect(requests.filter(isForbiddenAdminApi)).toEqual([]);
      expect(unhandled).toEqual([]);
    });
  }
});
