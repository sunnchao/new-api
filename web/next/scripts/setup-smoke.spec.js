/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const authUser = {
  id: 7401,
  username: "setup-smoke-root",
  display_name: "Setup Smoke Root",
  role: 100,
  status: 1,
  group: "default",
  quota: 1000000,
  used_quota: 0,
  request_count: 0,
};

async function mockApi(page) {
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
      await fulfill({
        success: true,
        data: {
          status: false,
          root_init: false,
          database_type: "mysql",
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/setup") {
      const body = request.postDataJSON();
      requests.push({ method, pathname: url.pathname, body });
      await fulfill({ success: true, message: "initialized" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/status") {
      await fulfill({
        success: true,
        data: {
          system_name: "Setup Smoke Gateway",
          logo: "",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          server_address: "https://gateway.example.com",
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({
        success: true,
        data: authUser,
      });
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

test.describe("setup wizard production smoke", () => {
  test("renders localized setup wizard and submits initialization payload", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript(() => {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
      window.localStorage.removeItem("setup_required");
      window.localStorage.setItem("i18nextLng", "zh");
    });

    await page.goto("/setup");

    await expect(page.getByText("系统设置向导")).toBeVisible();
    await expect(page.getByText("数据库检查")).toBeVisible();
    await expect(page.getByText("检测到的数据库")).toBeVisible();
    await expect(page.getByText("检测到 MySQL")).toBeVisible();

    await page.getByRole("button", { name: "下一步" }).click();
    await expect(page.getByText("管理员用户名")).toBeVisible();
    await page.getByLabel("管理员用户名").fill("root-smoke");
    await page.getByLabel("密码", { exact: true }).fill("Passw0rd!");
    await page.getByLabel("确认密码").fill("Passw0rd!");

    await page.getByRole("button", { name: "下一步" }).click();
    await expect(page.getByText("您将如何使用本平台？")).toBeVisible();
    await page.getByLabel("个人使用").click();

    await page.getByRole("button", { name: "下一步" }).click();
    await expect(page.getByText("准备初始化")).toBeVisible();
    await expect(page.getByText("个人使用模式")).toBeVisible();

    await page.getByRole("button", { name: "初始化系统" }).click();

    await expect
      .poll(() =>
        requests.find(
          (request) =>
            request.method === "POST" &&
            request.pathname === "/api/setup" &&
            request.body
        )?.body
      )
      .toEqual({
        username: "root-smoke",
        password: "Passw0rd!",
        confirmPassword: "Passw0rd!",
        SelfUseModeEnabled: true,
        DemoSiteEnabled: false,
      });
    expect(unhandled).toEqual([]);
  });

  test("redirects to setup even when stale setup cache says initialized", async ({
    page,
  }) => {
    const { requests } = await mockApi(page);

    await page.addInitScript((user) => {
      window.localStorage.setItem("setup_required", "false");
      window.localStorage.setItem("user", JSON.stringify(user));
      window.localStorage.setItem("uid", String(user.id));
      window.localStorage.setItem("i18nextLng", "en");
    }, authUser);

    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/setup$/);
    await expect(
      page.getByRole("heading", { name: "System setup wizard" })
    ).toBeVisible();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" && request.pathname === "/api/setup"
      )
    ).toBeTruthy();
  });
});
