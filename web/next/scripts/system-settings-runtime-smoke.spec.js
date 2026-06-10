/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 8701,
  username: "system-settings-runtime-smoke-admin",
  display_name: "System Settings Runtime Smoke Admin",
  email: "system-settings-runtime-smoke-admin@example.com",
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

const optionValues = {
  "theme.frontend": "next",
  SystemName: "new-api runtime smoke",
  RetryTimes: "1",
  DefaultCollapseSidebar: "false",
  DemoSiteEnabled: "false",
  SelfUseModeEnabled: "false",
  "token_setting.max_user_tokens": "1000",
  LogConsumeEnabled: "true",
  "performance_setting.disk_cache_enabled": "true",
  "performance_setting.disk_cache_threshold_mb": "10",
  "performance_setting.disk_cache_max_size_mb": "1024",
  "performance_setting.disk_cache_path": "/tmp/new-api-runtime-smoke-cache",
  "performance_setting.monitor_enabled": "false",
  "performance_setting.monitor_cpu_threshold": "90",
  "performance_setting.monitor_memory_threshold": "90",
  "performance_setting.monitor_disk_threshold": "95",
  "perf_metrics_setting.enabled": "true",
  "perf_metrics_setting.flush_interval": "5",
  "perf_metrics_setting.bucket_time": "hour",
  "perf_metrics_setting.retention_days": "0",
  QuotaForNewUser: "0",
  PreConsumedQuota: "0",
  QuotaForInviter: "0",
  QuotaForInvitee: "0",
  TopUpLink: "",
  "general_setting.docs_link": "",
  "quota_setting.enable_free_model_pre_consume": "true",
  QuotaPerUnit: "500000",
  USDExchangeRate: "7",
  "general_setting.quota_display_type": "USD",
  "general_setting.custom_currency_symbol": "$",
  "general_setting.custom_currency_exchange_rate": "1",
  DisplayInCurrencyEnabled: "true",
  DisplayTokenStatEnabled: "true",
  ModelPrice: "{}",
  ModelRatio: '{"gpt-4o-mini":1}',
  CacheRatio: "{}",
  CreateCacheRatio: "{}",
  CompletionRatio: "{}",
  ImageRatio: "{}",
  AudioRatio: "{}",
  AudioCompletionRatio: "{}",
  ExposeRatioEnabled: "false",
  "billing_setting.billing_mode": "{}",
  "billing_setting.billing_expr": "{}",
  "tool_price_setting.prices": "{}",
  TopupGroupRatio: "{}",
  GroupRatio: "{}",
  UserUsableGroups: "{}",
  UserUnselectableGroups: "{}",
  GroupGroupRatio: "{}",
  AutoGroups: "[]",
  DefaultUseAutoGroup: "false",
  "group_ratio_setting.group_special_usable_group": "{}",
  "payment_setting.compliance_confirmed": "false",
  "payment_setting.compliance_terms_version": "",
  "payment_setting.compliance_confirmed_at": "0",
  "payment_setting.compliance_confirmed_by": "0",
  "payment_setting.compliance_confirmed_ip": "",
  "checkin_setting.enabled": "false",
  "checkin_setting.min_quota": "1000",
  "checkin_setting.max_quota": "10000",
  WaffoPancakeMerchantID: "",
  WaffoPancakePrivateKey: "",
  WaffoPancakeStoreID: "",
  WaffoPancakeProductID: "",
  WaffoPancakeReturnURL: "https://runtime-smoke.example.test/console/topup",
  WaffoPancakeUnitPrice: "1",
  WaffoPancakeMinTopUp: "1",
  "channel_affinity_setting.enabled": "false",
  "channel_affinity_setting.switch_on_success": "true",
  "channel_affinity_setting.keep_on_channel_disabled": "false",
  "channel_affinity_setting.max_entries": "100000",
  "channel_affinity_setting.default_ttl_seconds": "3600",
  "channel_affinity_setting.rules": "[]",
};

function parseJsonBody(request) {
  const body = request.postData();
  if (!body) return undefined;
  return JSON.parse(body);
}

function optionsList() {
  return Object.entries(optionValues).map(([key, value]) => ({ key, value }));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mockApi(page, options = {}) {
  const requests = [];
  const unhandled = [];
  let statusRequestCount = 0;

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
      const currentStatusRequest = statusRequestCount;
      statusRequestCount += 1;
      if (
        currentStatusRequest > 0 &&
        options.delayStatusAfterFirstMs
      ) {
        await delay(options.delayStatusAfterFirstMs);
      }
      await fulfill({
        success: true,
        data: {
          system_name: "new-api system settings runtime smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          version: "runtime-smoke",
          start_time: 1710000000,
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
      await fulfill({ success: true, message: "", data: optionsList() });
      return;
    }

    if (method === "PUT" && url.pathname === "/api/option/") {
      optionValues[body.key] = String(body.value);
      await fulfill({ success: true, message: "updated" });
      return;
    }

    if (method === "POST" && url.pathname === "/api/option/migrate_console_setting") {
      if (optionValues.ApiInfo) {
        optionValues["console_setting.api_info"] = optionValues.ApiInfo;
      }
      if (optionValues.Announcements) {
        optionValues["console_setting.announcements"] =
          optionValues.Announcements;
      }
      if (optionValues.FAQ) {
        optionValues["console_setting.faq"] = optionValues.FAQ;
      }
      if (optionValues.UptimeKumaUrl && optionValues.UptimeKumaSlug) {
        optionValues["console_setting.uptime_kuma_groups"] = JSON.stringify([
          {
            id: 1,
            categoryName: "old",
            url: optionValues.UptimeKumaUrl,
            slug: optionValues.UptimeKumaSlug,
            description: "",
          },
        ]);
      }
      [
        "ApiInfo",
        "Announcements",
        "FAQ",
        "UptimeKumaUrl",
        "UptimeKumaSlug",
      ].forEach((key) => {
        delete optionValues[key];
      });
      await fulfill({ success: true, message: "migrated" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/performance/stats") {
      await fulfill({
        success: true,
        data: {
          cache_stats: {
            current_disk_usage_bytes: 1024,
            disk_cache_max_bytes: 1024 * 1024,
            active_disk_files: 2,
            disk_cache_hits: 7,
            current_memory_usage_bytes: 2048,
            active_memory_buffers: 3,
            memory_cache_hits: 11,
          },
          disk_space_info: {
            total: 1024 * 1024 * 1024,
            free: 512 * 1024 * 1024,
            used: 512 * 1024 * 1024,
            used_percent: 50,
          },
          memory_stats: {
            alloc: 4096,
            total_alloc: 8192,
            sys: 16384,
            num_gc: 4,
            num_goroutine: 12,
          },
          disk_cache_info: {
            path: "/tmp/new-api-runtime-smoke-cache",
            file_count: 5,
            total_size: 8192,
          },
          config: {
            is_running_in_container: false,
          },
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/performance/logs") {
      await fulfill({
        success: true,
        data: {
          enabled: true,
          log_dir: "/tmp/new-api-runtime-smoke-logs",
          file_count: 12,
          total_size: 4096,
          oldest_time: "2026-06-01T00:00:00Z",
          newest_time: "2026-06-08T00:00:00Z",
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/performance/reset_stats") {
      await fulfill({ success: true, message: "reset" });
      return;
    }

    if (method === "POST" && url.pathname === "/api/performance/gc") {
      await fulfill({ success: true, message: "gc" });
      return;
    }

    if (method === "DELETE" && url.pathname === "/api/performance/logs") {
      await fulfill({
        success: true,
        data: { deleted_count: 2, freed_bytes: 2048 },
      });
      return;
    }

    if (method === "DELETE" && url.pathname === "/api/performance/disk_cache") {
      await fulfill({ success: true, message: "cleared" });
      return;
    }

    if (method === "POST" && url.pathname === "/api/option/rest_model_ratio") {
      await fulfill({ success: true, message: "reset ratios" });
      return;
    }

    if (
      method === "GET" &&
      url.pathname === "/api/option/channel_affinity_cache"
    ) {
      await fulfill({
        success: true,
        data: {
          enabled: true,
          total: 0,
          unknown: 0,
          by_rule_name: {},
          cache_capacity: 100000,
          cache_algo: "lru",
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/option/payment_compliance") {
      optionValues["payment_setting.compliance_confirmed"] = "true";
      optionValues["payment_setting.compliance_terms_version"] = "v1";
      optionValues["payment_setting.compliance_confirmed_at"] = "1710000000";
      optionValues["payment_setting.compliance_confirmed_by"] = String(user.id);
      await fulfill({
        success: true,
        message: "confirmed",
        data: {
          confirmed: true,
          terms_version: "v1",
          confirmed_at: 1710000000,
          confirmed_by: user.id,
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/option/waffo-pancake/catalog") {
      await fulfill({
        message: "success",
        data: {
          stores: [
            {
              id: "store-runtime-1",
              name: "Runtime Store",
              status: "active",
              prodEnabled: true,
              onetimeProducts: [
                {
                  id: "product-runtime-1",
                  name: "Runtime Product",
                  active: true,
                },
              ],
            },
          ],
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/option/waffo-pancake/save") {
      optionValues.WaffoPancakeMerchantID = body.merchant_id;
      optionValues.WaffoPancakeStoreID = body.store_id;
      optionValues.WaffoPancakeProductID = body.product_id;
      optionValues.WaffoPancakeReturnURL = body.return_url;
      await fulfill({
        message: "success",
        data: {
          store_id: body.store_id,
          product_id: body.product_id,
        },
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

async function authenticate(page) {
  await page.addInitScript((storedUser) => {
    window.localStorage.setItem("i18nextLng", "en");
    window.localStorage.setItem("user", JSON.stringify(storedUser));
    window.localStorage.setItem("uid", String(storedUser.id));
    window.localStorage.setItem("setup_required", "false");
  }, user);
}

async function seedStaleStatusCache(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "status",
      JSON.stringify({
        system_name: "stale cached status",
        HeaderNavModules: '{"home":false}',
      })
    );
  });
}

function requestsFor(requests, method, pathname) {
  return requests.filter(
    (request) => request.method === method && request.pathname === pathname
  );
}

test.describe("system settings production runtime smoke", () => {
  test("migrates legacy dashboard console settings through backend endpoint", async ({
    page,
  }) => {
    delete optionValues["console_setting.api_info"];
    delete optionValues["console_setting.announcements"];
    delete optionValues["console_setting.faq"];
    delete optionValues["console_setting.uptime_kuma_groups"];
    optionValues.ApiInfo =
      '[{"name":"Legacy OpenAI","url":"https://legacy.example.com/v1"}]';
    optionValues.Announcements =
      '[{"title":"Legacy announcement","content":"Legacy announcement body"}]';
    optionValues.FAQ =
      '[{"question":"Legacy question","answer":"Legacy answer"}]';
    optionValues.UptimeKumaUrl = "https://status.example.com";
    optionValues.UptimeKumaSlug = "new-api";

    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/system-settings/content/dashboard");
    await expect(
      page.getByRole("heading", { name: "Legacy dashboard settings detected" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Migrate settings" }).click();

    await expect
      .poll(() =>
        requestsFor(
          requests,
          "POST",
          "/api/option/migrate_console_setting"
        ).length
      )
      .toBe(1);

    const migrationRequest = requestsFor(
      requests,
      "POST",
      "/api/option/migrate_console_setting"
    )[0];
    expect(migrationRequest.body).toBeUndefined();
    await expect(
      page.getByText("Legacy settings migrated successfully")
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Data Dashboard" })
    ).toBeVisible();
    expect(requestsFor(requests, "GET", "/api/option/").length).toBeGreaterThan(
      1
    );
    expect(unhandled).toEqual([]);
  });

  test("saves maximum token count per user from system behavior settings", async ({
    page,
  }) => {
    optionValues["token_setting.max_user_tokens"] = "1000";

    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/system-settings/operations/behavior");
    await expect(
      page.getByRole("heading", { name: "System Behavior" })
    ).toBeVisible();

    await page.getByLabel("Maximum Tokens per User").fill("1200");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect
      .poll(() =>
        requestsFor(requests, "PUT", "/api/option/").some(
          (request) => request.body?.key === "token_setting.max_user_tokens"
        )
      )
      .toBe(true);

    const maxTokensSave = requestsFor(requests, "PUT", "/api/option/").find(
      (request) => request.body?.key === "token_setting.max_user_tokens"
    );
    expect(maxTokensSave?.body).toEqual({
      key: "token_setting.max_user_tokens",
      value: 1200,
    });
    expect(unhandled).toEqual([]);
  });

  test("preserves and saves the Next frontend theme option", async ({
    page,
  }) => {
    optionValues["theme.frontend"] = "next";

    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/system-settings/site/system-info");
    await expect(
      page.getByRole("heading", { name: "System Information" })
    ).toBeVisible();

    const themeSelect = page.getByRole("combobox", {
      name: "Frontend Theme",
    });
    await expect(themeSelect).toContainText("Next.js Frontend");

    optionValues["theme.frontend"] = "classic";
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "System Information" })
    ).toBeVisible();
    await expect(themeSelect).toContainText("Classic (Legacy Frontend)");

    await themeSelect.click();
    await page.getByRole("option", { name: "Next.js Frontend" }).click();
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect
      .poll(() =>
        requestsFor(requests, "PUT", "/api/option/").some(
          (request) => request.body?.key === "theme.frontend"
        )
      )
      .toBe(true);

    const themeSave = requestsFor(requests, "PUT", "/api/option/").find(
      (request) => request.body?.key === "theme.frontend"
    );
    expect(themeSave?.body).toEqual({
      key: "theme.frontend",
      value: "next",
    });
    expect(unhandled).toEqual([]);
  });

  test("saves performance options and invokes non-option runtime actions", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/system-settings/operations/performance");
    await expect(
      page.getByRole("heading", { name: "Performance Settings" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Performance Monitor", exact: true })
    ).toBeVisible();

    await page.getByRole("button", { name: "Reset Stats" }).click();
    await page.getByRole("button", { name: "Run GC" }).click();

    await expect(page.getByText("Statistics reset")).toBeVisible();
    await expect(page.getByText("GC executed")).toBeVisible();

    const resetRequest = requestsFor(
      requests,
      "POST",
      "/api/performance/reset_stats"
    );
    expect(resetRequest).toHaveLength(1);
    expect(resetRequest[0].body).toBeUndefined();

    const gcRequest = requestsFor(requests, "POST", "/api/performance/gc");
    expect(gcRequest).toHaveLength(1);
    expect(gcRequest[0].body).toBeUndefined();

    await page.getByLabel("Flush interval (minutes)").fill("8");
    await page.getByLabel("Retention days").fill("14");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect
      .poll(
        () =>
          requestsFor(requests, "PUT", "/api/option/").filter((request) =>
            [
              "perf_metrics_setting.flush_interval",
              "perf_metrics_setting.retention_days",
            ].includes(request.body?.key)
          ).length
      )
      .toBe(2);

    const optionSaves = requestsFor(requests, "PUT", "/api/option/");
    expect(optionSaves).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          body: {
            key: "perf_metrics_setting.flush_interval",
            value: 8,
          },
        }),
        expect.objectContaining({
          body: {
            key: "perf_metrics_setting.retention_days",
            value: 14,
          },
        }),
      ])
    );

    expect(
      requestsFor(requests, "GET", "/api/performance/stats").length
    ).toBeGreaterThanOrEqual(3);
    expect(requestsFor(requests, "GET", "/api/performance/logs")).toHaveLength(
      1
    );
    expect(unhandled).toEqual([]);
  });

  test("saves model ratio JSON and resets model ratios through runtime APIs", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/system-settings/billing/model-pricing");
    await expect(
      page.getByRole("heading", { name: "Model Pricing" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Switch to JSON" }).click();
    await page
      .getByLabel("Model ratio")
      .fill('{"gpt-4o-mini":1,"runtime-smoke-model":2.5}');
    await page.getByRole("button", { name: "Save model prices" }).click();

    await expect(page.getByText("Setting updated successfully")).toBeVisible();

    await page.getByRole("button", { name: "Reset prices" }).click();
    await expect(
      page.getByRole("heading", { name: "Reset all model prices?" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.getByText("Model prices reset successfully")).toBeVisible();

    const modelRatioSave = requestsFor(requests, "PUT", "/api/option/").find(
      (request) => request.body?.key === "ModelRatio"
    );
    expect(modelRatioSave?.body).toEqual({
      key: "ModelRatio",
      value: '{"gpt-4o-mini":1,"runtime-smoke-model":2.5}',
    });

    const ratioReset = requestsFor(
      requests,
      "POST",
      "/api/option/rest_model_ratio"
    );
    expect(ratioReset).toHaveLength(1);
    expect(ratioReset[0].body).toBeUndefined();
    expect(unhandled).toEqual([]);
  });

  test("saves hidden group pricing settings through runtime option APIs", async ({
    page,
  }) => {
    optionValues.GroupRatio = '{"internal-smoke":1.5}';
    optionValues.UserUsableGroups = "{}";
    optionValues.UserUnselectableGroups =
      '{"internal-smoke":"Internal smoke group"}';

    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/system-settings/billing/group-pricing");
    await expect(
      page.getByRole("heading", { name: "Group Pricing" })
    ).toBeVisible();

    await expect(page.getByText("Hidden group")).toBeVisible();
    await expect(
      page.locator('input[value="Internal smoke group"]')
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: "Hidden group" }).first()
    ).toBeChecked();
    await expect(
      page.getByRole("checkbox", { name: "User selectable" }).first()
    ).not.toBeChecked();

    await page.getByRole("button", { name: "Switch to JSON" }).click();
    await expect(page.getByLabel("Hidden groups")).toBeVisible();
    await page
      .getByLabel("Hidden groups")
      .fill(
        '{"internal-smoke":"Internal smoke group","internal-smoke-2":"Second hidden group"}'
      );
    await page.getByRole("button", { name: "Save group ratios" }).click();

    await expect
      .poll(() =>
        requestsFor(requests, "PUT", "/api/option/").some(
          (request) => request.body?.key === "UserUnselectableGroups"
        )
      )
      .toBe(true);

    const hiddenGroupSave = requestsFor(requests, "PUT", "/api/option/").find(
      (request) => request.body?.key === "UserUnselectableGroups"
    );
    expect(hiddenGroupSave?.body).toEqual({
      key: "UserUnselectableGroups",
      value:
        '{"internal-smoke":"Internal smoke group","internal-smoke-2":"Second hidden group"}',
    });
    expect(unhandled).toEqual([]);
  });

  test("clears stale cached status after status-related option saves", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page, {
      delayStatusAfterFirstMs: 15_000,
    });
    await authenticate(page);

    await page.goto("/system-settings/site/notice");
    await expect(
      page.getByRole("heading", { name: "System Notice" })
    ).toBeVisible();
    await seedStaleStatusCache(page);

    await page
      .getByLabel("Announcement content")
      .fill("Runtime smoke notice clears stale cached status");
    await page.getByRole("button", { name: "Save notice" }).click();

    await expect
      .poll(() =>
        requestsFor(requests, "PUT", "/api/option/").some(
          (request) => request.body?.key === "Notice"
        )
      )
      .toBe(true);
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem("status")))
      .toBe(null);
    expect(unhandled).toEqual([]);
  });

  test("saves channel-affinity disabled-channel retention option", async ({
    page,
  }) => {
    optionValues["channel_affinity_setting.keep_on_channel_disabled"] = "false";

    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/system-settings/models/channel-affinity");
    await expect(
      page.getByRole("heading", { name: "Channel Affinity" })
    ).toBeVisible();

    const keepDisabledSwitch = page.getByRole("switch", {
      name: "Keep affinity when channel is disabled",
    });
    await expect(keepDisabledSwitch).toBeVisible();
    await expect(keepDisabledSwitch).not.toBeChecked();
    await keepDisabledSwitch.click();
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect
      .poll(() =>
        requestsFor(requests, "PUT", "/api/option/").some(
          (request) =>
            request.body?.key ===
            "channel_affinity_setting.keep_on_channel_disabled"
        )
      )
      .toBe(true);

    const keepDisabledSave = requestsFor(
      requests,
      "PUT",
      "/api/option/"
    ).find(
      (request) =>
        request.body?.key ===
        "channel_affinity_setting.keep_on_channel_disabled"
    );
    expect(keepDisabledSave?.body).toEqual({
      key: "channel_affinity_setting.keep_on_channel_disabled",
      value: "true",
    });
    expect(unhandled).toEqual([]);
  });

  test("requires payment compliance confirmation before payment settings", async ({
    page,
  }) => {
    optionValues["payment_setting.compliance_confirmed"] = "false";
    optionValues["payment_setting.compliance_terms_version"] = "v1";
    optionValues["payment_setting.compliance_confirmed_at"] = "0";
    optionValues["payment_setting.compliance_confirmed_by"] = "0";
    optionValues["payment_setting.compliance_confirmed_ip"] = "";

    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/system-settings/billing/quota");
    await expect(
      page.getByRole("heading", { name: "Quota Settings" })
    ).toBeVisible();
    await expect(
      page.getByText(
        "Non-zero invitation rewards require compliance confirmation in Payment Gateway settings."
      )
    ).toBeVisible();

    await page.goto("/system-settings/billing/payment");
    await expect(
      page.getByRole("heading", { name: "Payment Gateway", exact: true })
    ).toBeVisible();
    await expect(page.getByText("Compliance confirmation required")).toBeVisible();
    await expect(page.getByText("Payment methods", { exact: true })).toBeVisible();
    await expect(page.getByTestId("payment-settings-fields")).toHaveClass(
      /pointer-events-none/
    );

    await page.getByRole("button", { name: "Confirm compliance" }).click();
    await expect(
      page.getByRole("heading", { name: "Confirm compliance terms" })
    ).toBeVisible();

    await page
      .getByLabel("Please type the following text to confirm:")
      .fill(
        "I have read and understood the above compliance reminder, acknowledge the related legal risks, and confirm that I bear legal responsibility arising from deployment, operation, and charging behavior."
      );
    await page.getByRole("button", { name: "Confirm and enable" }).click();

    await expect
      .poll(() =>
        requestsFor(requests, "POST", "/api/option/payment_compliance").some(
          (request) => request.body?.confirmed === true
        )
      )
      .toBe(true);

    expect(
      requestsFor(requests, "POST", "/api/option/payment_compliance")[0]?.body
    ).toEqual({ confirmed: true });
    expect(unhandled).toEqual([]);
  });

  test("refreshes Waffo Pancake saved binding after save", async ({ page }) => {
    optionValues["payment_setting.compliance_confirmed"] = "true";
    optionValues["payment_setting.compliance_terms_version"] = "v1";
    optionValues.WaffoPancakeMerchantID = "merchant-runtime";
    optionValues.WaffoPancakePrivateKey = "";
    optionValues.WaffoPancakeStoreID = "";
    optionValues.WaffoPancakeProductID = "";
    optionValues.WaffoPancakeReturnURL =
      "https://runtime-smoke.example.test/console/topup";
    optionValues.WaffoPancakeUnitPrice = "1";
    optionValues.WaffoPancakeMinTopUp = "1";

    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/system-settings/billing/payment");
    await expect(
      page.getByRole("heading", { name: "Waffo Pancake MoR" })
    ).toBeVisible();

    const waffoSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Waffo Pancake MoR" }) });

    await waffoSection
      .getByPlaceholder("Leave blank to keep the existing key")
      .fill("private-runtime");
    await page
      .getByRole("button", { name: "Verify and load catalog" })
      .click();
    await expect(page.getByText("Runtime Store")).toBeVisible();
    await expect(page.getByText("Runtime Product")).toBeVisible();

    await page
      .getByRole("button", { name: "Save Waffo Pancake settings" })
      .click();

    await expect
      .poll(() =>
        requestsFor(requests, "POST", "/api/option/waffo-pancake/save").length
      )
      .toBe(1);
    expect(
      requestsFor(requests, "POST", "/api/option/waffo-pancake/save")[0].body
    ).toEqual({
      merchant_id: "merchant-runtime",
      private_key: "private-runtime",
      return_url: "https://runtime-smoke.example.test/console/topup",
      store_id: "store-runtime-1",
      product_id: "product-runtime-1",
    });
    await expect(page.getByText("Bound store:")).toBeVisible();
    await expect(
      waffoSection.locator("code", { hasText: "store-runtime-1" })
    ).toBeVisible();
    await expect(page.getByText("Bound product:")).toBeVisible();
    await expect(
      waffoSection.locator("code", { hasText: "product-runtime-1" })
    ).toBeVisible();
    await expect
      .poll(() => requestsFor(requests, "GET", "/api/option/").length)
      .toBeGreaterThan(1);
    expect(unhandled).toEqual([]);
  });

  test("saves daily check-in reward settings through runtime option APIs", async ({
    page,
  }) => {
    optionValues["checkin_setting.enabled"] = "false";
    optionValues["checkin_setting.min_quota"] = "1000";
    optionValues["checkin_setting.max_quota"] = "10000";

    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/system-settings/billing/checkin");
    await expect(
      page.getByRole("heading", { name: "Check-in Settings" })
    ).toBeVisible();

    await page.getByRole("switch", { name: "Enable check-in feature" }).click();
    await page.getByLabel("Minimum check-in quota").fill("1500");
    await page.getByLabel("Maximum check-in quota").fill("2500");
    await page.getByRole("button", { name: "Save check-in settings" }).click();

    await expect
      .poll(
        () =>
          requestsFor(requests, "PUT", "/api/option/").filter((request) =>
            [
              "checkin_setting.enabled",
              "checkin_setting.min_quota",
              "checkin_setting.max_quota",
            ].includes(request.body?.key)
          ).length
      )
      .toBe(3);

    expect(requestsFor(requests, "PUT", "/api/option/")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          body: { key: "checkin_setting.enabled", value: "true" },
        }),
        expect.objectContaining({
          body: { key: "checkin_setting.min_quota", value: "1500" },
        }),
        expect.objectContaining({
          body: { key: "checkin_setting.max_quota", value: "2500" },
        }),
      ])
    );
    expect(unhandled).toEqual([]);
  });
});
