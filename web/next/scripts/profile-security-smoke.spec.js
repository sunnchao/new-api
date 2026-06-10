/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 5151,
  username: "profile-security-smoke",
  display_name: "Profile Security Smoke",
  role: 1,
  status: 1,
  group: "default",
  quota: 100000,
  used_quota: 0,
  request_count: 0,
  email: "profile-security-smoke@example.com",
  aff_count: 0,
  aff_quota: 0,
  aff_history_quota: 0,
  created_time: 1717200000,
  setting: JSON.stringify({ language: "en" }),
  permissions: {
    sidebar_settings: false,
  },
};

const setupBackupCodes = [
  "SMOKE-001",
  "SMOKE-002",
  "SMOKE-003",
  "SMOKE-004",
  "SMOKE-005",
  "SMOKE-006",
  "SMOKE-007",
  "SMOKE-008",
];

const regeneratedBackupCodes = [
  "NEW-001",
  "NEW-002",
  "NEW-003",
  "NEW-004",
  "NEW-005",
  "NEW-006",
  "NEW-007",
  "NEW-008",
];

function baseStatus() {
  return {
    system_name: "new-api profile security smoke",
    display_in_currency: false,
    quota_display_type: "TOKENS",
    quota_per_unit: 500000,
    checkin_enabled: false,
    turnstile_check: false,
    passkey_login: false,
    github_oauth: false,
    discord_oauth: false,
    oidc_enabled: false,
    telegram_oauth: false,
    wechat_login: false,
    linux_do_oauth: false,
    custom_oauth_providers: [],
  };
}

async function mockApi(page, options = {}) {
  const requests = [];
  const unhandled = [];
  const twoFA = {
    enabled: false,
    locked: false,
    backup_codes_remaining: 0,
  };
  const apiUser = {
    ...user,
    ...(options.userOverrides || {}),
  };
  const statusData = {
    ...baseStatus(),
    ...(options.statusOverrides || {}),
  };
  const checkinState = {
    checkedInToday: options.checkedInToday ?? false,
    totalCheckins: options.totalCheckins ?? 8,
    totalQuota: options.totalQuota ?? 30000,
    records: [...(options.checkinRecords || [])],
  };

  function currentMonthRecords(month) {
    return checkinState.records.filter((record) =>
      String(record.checkin_date).startsWith(`${month}-`)
    );
  }

  function checkinStats(month) {
    const records = currentMonthRecords(month);
    return {
      checked_in_today: checkinState.checkedInToday,
      total_checkins: checkinState.totalCheckins,
      total_quota: checkinState.totalQuota,
      checkin_count: records.length,
      records,
    };
  }

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    requests.push({ method, pathname: url.pathname, search: url.search });

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
      await fulfill({ success: true, data: statusData });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: apiUser });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/passkey") {
      await fulfill({
        success: true,
        data: {
          enabled: false,
          last_used_at: null,
          backup_eligible: false,
          backup_state: false,
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/2fa/status") {
      await fulfill({ success: true, data: twoFA });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/2fa/setup") {
      await fulfill({
        success: true,
        data: {
          secret: "JBSWY3DPEHPK3PXP",
          qr_code_data:
            "otpauth://totp/new-api:profile-security-smoke?secret=JBSWY3DPEHPK3PXP&issuer=new-api",
          backup_codes: setupBackupCodes,
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/2fa/enable") {
      const body = request.postDataJSON();
      requests.push({ method, pathname: url.pathname, body });
      twoFA.enabled = true;
      twoFA.backup_codes_remaining = setupBackupCodes.length;
      await fulfill({ success: true, message: "enabled" });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/2fa/backup_codes") {
      const body = request.postDataJSON();
      requests.push({ method, pathname: url.pathname, body });
      twoFA.backup_codes_remaining = regeneratedBackupCodes.length;
      await fulfill({
        success: true,
        data: { backup_codes: regeneratedBackupCodes },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/2fa/disable") {
      const body = request.postDataJSON();
      requests.push({ method, pathname: url.pathname, body });
      twoFA.enabled = false;
      twoFA.locked = false;
      twoFA.backup_codes_remaining = 0;
      await fulfill({ success: true, message: "disabled" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/checkin") {
      const month = url.searchParams.get("month") || "2026-06";
      await fulfill({
        success: true,
        data: {
          enabled: true,
          min_quota: 1000,
          max_quota: 10000,
          stats: checkinStats(month),
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/user/checkin") {
      const today = new Date().toISOString().slice(0, 10);
      const quotaAwarded = 12000;
      checkinState.checkedInToday = true;
      checkinState.totalCheckins += 1;
      checkinState.totalQuota += quotaAwarded;
      checkinState.records = checkinState.records.filter(
        (record) => record.checkin_date !== today
      );
      checkinState.records.push({
        checkin_date: today,
        quota_awarded: quotaAwarded,
      });
      await fulfill({
        success: true,
        message: "签到成功",
        data: {
          quota_awarded: quotaAwarded,
          checkin_date: today,
        },
      });
      return;
    }

    unhandled.push(`${method} ${url.pathname}`);
    await fulfill({ success: true, data: null });
  });

  return { requests, unhandled };
}

test.describe("profile 2FA security flow", () => {
  test("redirects legacy /console/personal links to the profile surface", async ({ page }) => {
    const { unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/console/personal");

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: "Profile Security Smoke" })).toBeVisible();
    await expect(page.getByText("@profile-security-smoke")).toBeVisible();
    expect(unhandled).toEqual([]);
  });

  test("sets up, enables, regenerates backup codes, and disables 2FA", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/profile");

    await expect(page.getByRole("heading", { name: "Two-Factor Authentication" })).toBeVisible();
    await expect(page.getByText("Two-Step Verification")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enable", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Enable", exact: true }).click();
    const setupDialog = page.getByRole("dialog");
    await expect(setupDialog.getByRole("heading", { name: "Setup Two-Factor Authentication" })).toBeVisible();
    await expect(setupDialog.getByText("JBSWY3DPEHPK3PXP")).toBeVisible();

    await setupDialog.getByRole("button", { name: "Next" }).click();
    await expect(setupDialog.getByText("SMOKE-001")).toBeVisible();
    await setupDialog.getByRole("button", { name: "Next" }).click();
    await setupDialog.getByLabel("Verification Code").fill("123456");
    await setupDialog.getByRole("button", { name: "Enable 2FA" }).click();

    await expect(setupDialog).toBeHidden();
    await expect(page.getByText("Backup codes remaining: 8")).toBeVisible();
    await expect(page.getByRole("button", { name: "Regenerate Backup Codes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Disable 2FA" })).toBeVisible();

    await page.getByRole("button", { name: "Regenerate Backup Codes" }).click();
    const backupDialog = page.getByRole("dialog");
    await expect(backupDialog.getByRole("heading", { name: "Regenerate Backup Codes" })).toBeVisible();
    await backupDialog.getByLabel("Verification Code").fill("654321");
    await backupDialog.getByRole("button", { name: "Generate New Codes" }).click();
    await expect(backupDialog.getByText("NEW-001")).toBeVisible();
    await backupDialog.getByRole("button", { name: "Done" }).click();
    await expect(backupDialog).toBeHidden();
    await expect(page.getByText("Backup codes remaining: 8")).toBeVisible();

    await page.getByRole("button", { name: "Disable 2FA" }).click();
    const disableDialog = page.getByRole("dialog");
    await expect(disableDialog.getByRole("heading", { name: "Disable Two-Factor Authentication" })).toBeVisible();
    await disableDialog.getByLabel("Verification Code").fill("SMOKE-001");
    await disableDialog
      .getByLabel("I understand that disabling 2FA will remove all protection and backup codes")
      .click();
    await disableDialog.getByRole("button", { name: "Disable 2FA" }).click();

    await expect(disableDialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Enable", exact: true })).toBeVisible();

    const enableRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/user/2fa/enable" &&
        request.body?.code === "123456"
    );
    const backupRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/user/2fa/backup_codes" &&
        request.body?.code === "654321"
    );
    const disableRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/user/2fa/disable" &&
        request.body?.code === "SMOKE-001"
    );

    expect(enableRequest).toBeTruthy();
    expect(backupRequest).toBeTruthy();
    expect(disableRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});

test.describe("profile daily check-in", () => {
  test("renders localized check-in status and refreshes after check-in", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page, {
      statusOverrides: {
        checkin_enabled: true,
        quota_display_type: "TOKENS",
        quota_per_unit: 500000,
      },
      userOverrides: {
        setting: JSON.stringify({ language: "zh" }),
      },
      totalCheckins: 3,
      totalQuota: 30000,
      checkinRecords: [
        { checkin_date: "2026-06-03", quota_awarded: 10000 },
        { checkin_date: "2026-06-08", quota_awarded: 20000 },
      ],
    });

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "zh");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, { ...user, setting: JSON.stringify({ language: "zh" }) });

    await page.goto("/profile");

    await expect(page.getByRole("heading", { name: "每日签到" })).toBeVisible();
    await expect(page.getByRole("button", { name: "立即签到" })).toBeVisible();
    await expect(page.getByText("本月获得")).toBeVisible();
    await expect(page.getByText("累计获得")).toBeVisible();
    await expect(page.getByText("每日仅可签到一次", { exact: true })).toBeVisible();
    await expect(page.getByText("签到奖励将直接添加到您的账户余额")).toBeVisible();
    await expect(page.getByText("This month")).toHaveCount(0);
    await expect(page.getByText("Total earned")).toHaveCount(0);

    await page.getByRole("button", { name: "立即签到" }).click();

    await expect(
      page.getByRole("button", { name: "已签到", exact: true })
    ).toBeVisible();
    await expect(page.getByText("今日 +12k")).toBeVisible();

    const statusRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/user/checkin" &&
        /^\?month=\d{4}-\d{2}$/.test(request.search)
    );
    const checkinRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/user/checkin" &&
        request.search === ""
    );
    const refreshedStatusRequests = requests.filter(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/user/checkin" &&
        /^\?month=\d{4}-\d{2}$/.test(request.search)
    );

    expect(statusRequest).toBeTruthy();
    expect(checkinRequest).toBeTruthy();
    expect(refreshedStatusRequests.length).toBeGreaterThanOrEqual(2);
    expect(unhandled).toEqual([]);
  });
});
