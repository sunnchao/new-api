/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 9090,
  username: "channel-specialist-smoke",
  display_name: "Channel Specialist Smoke",
  role: 100,
  status: 1,
  group: "default",
  quota: 100000,
  used_quota: 0,
  request_count: 0,
  permissions: {
    sidebar_settings: false,
  },
};

const baseChannel = {
  key: "sk-smoke",
  openai_organization: "",
  status: 1,
  weight: 0,
  created_time: 1717200000,
  test_time: 1717200100,
  response_time: 0,
  base_url: "https://upstream.example.test",
  other: "",
  balance: 0,
  balance_updated_time: 1717200200,
  group: "default",
  used_quota: 0,
  model_mapping: "",
  status_code_mapping: "",
  priority: 0,
  auto_ban: 1,
  other_info: "",
  tag: "",
  setting: "",
  param_override: "",
  header_override: "",
  remark: "",
  max_input_tokens: 0,
  channel_info: {
    is_multi_key: false,
    multi_key_size: 0,
    multi_key_polling_index: 0,
    multi_key_mode: "random",
  },
  settings: "{}",
};

const codexChannel = {
  ...baseChannel,
  id: 5701,
  type: 57,
  name: "smoke-codex-runtime",
  models: "gpt-5-codex-smoke",
  test_model: "gpt-5-codex-smoke",
};

const ollamaChannel = {
  ...baseChannel,
  id: 401,
  type: 4,
  name: "smoke-ollama-runtime",
  base_url: "http://127.0.0.1:11434",
  models: "llama3.1:8b",
  test_model: "llama3.1:8b",
};

const multiKeyChannel = {
  ...baseChannel,
  id: 1101,
  type: 1,
  name: "smoke-multi-key-runtime",
  models: "gpt-4o-mini",
  test_model: "gpt-4o-mini",
  channel_info: {
    is_multi_key: true,
    multi_key_size: 3,
    multi_key_status_list: {
      1: 2,
      2: 3,
    },
    multi_key_disabled_reason: {
      1: "manual smoke disable",
      2: "auto smoke ban",
    },
    multi_key_disabled_time: {
      1: 1717200300,
      2: 1717200400,
    },
    multi_key_polling_index: 0,
    multi_key_mode: "polling",
  },
};

const passThroughChannel = {
  ...baseChannel,
  id: 1601,
  type: 1,
  name: "smoke-pass-through-runtime",
  base_url: " https://pass-through.example.test/// ",
  models: "gpt-4o-mini",
  test_model: "gpt-4o-mini",
  setting: JSON.stringify({
    force_format: false,
    thinking_to_content: false,
    proxy: "",
    pass_through_body_enabled: false,
    pass_through_header_enabled: true,
    system_prompt: "",
    system_prompt_override: false,
  }),
};

const upstreamUpdateChannel = {
  ...baseChannel,
  id: 1401,
  type: 14,
  name: "smoke-upstream-update-runtime",
  models: "claude-3-5-sonnet",
  test_model: "claude-3-5-sonnet",
  settings: JSON.stringify({
    upstream_model_update_check_enabled: true,
    upstream_model_update_last_detected_models: [
      "claude-3-7-sonnet-smoke",
    ],
    upstream_model_update_last_removed_models: [
      "claude-3-5-sonnet",
    ],
  }),
};

const channels = [
  codexChannel,
  ollamaChannel,
  multiKeyChannel,
  passThroughChannel,
  upstreamUpdateChannel,
];

async function mockApi(page) {
  const requests = [];
  const unhandled = [];

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    const params = Object.fromEntries(url.searchParams.entries());
    let postData = null;
    try {
      postData = request.postDataJSON();
    } catch {
      postData = request.postData();
    }
    requests.push({ method, pathname: url.pathname, params, postData });

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
          system_name: "new-api channel specialist smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: user });
      return;
    }

    if (method === "GET" && url.pathname === "/api/notice") {
      await fulfill({ success: true, data: [] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/option/") {
      await fulfill({ success: true, data: null });
      return;
    }

    if (method === "GET" && url.pathname === "/api/group/") {
      await fulfill({ success: true, data: ["default", "vip"] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/2fa/status") {
      await fulfill({ success: true, data: { enabled: false } });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/passkey") {
      await fulfill({ success: true, data: [] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/channel") {
      await fulfill({
        success: true,
        data: {
          items: channels,
          total: channels.length,
          page: Number(params.p || 1),
          page_size: Number(params.page_size || 10),
          type_counts: {
            1: 1,
            4: 1,
            57: 1,
          },
        },
      });
      return;
    }

    if (method === "GET" && url.pathname.startsWith("/api/channel/")) {
      const id = Number(url.pathname.replace("/api/channel/", ""));
      const channel = channels.find((item) => item.id === id);
      if (channel) {
        await fulfill({ success: true, data: channel });
        return;
      }
    }

    if (method === "GET" && url.pathname === "/api/channel/models") {
      await fulfill({
        success: true,
        data: [
          { id: "gpt-5-codex-smoke" },
          { id: "llama3.1:8b" },
          { id: "qwen2.5:7b" },
          { id: "gpt-4o-mini" },
          { id: "claude-3-5-sonnet" },
          { id: "claude-3-7-sonnet-smoke" },
        ],
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/prefill_group") {
      await fulfill({ success: true, data: [] });
      return;
    }

    if (
      method === "POST" &&
      url.pathname === "/api/channel/codex/oauth/start"
    ) {
      await fulfill({
        success: true,
        data: {
          authorize_url: "https://auth.example.test/codex?state=smoke",
        },
      });
      return;
    }

    if (
      method === "POST" &&
      url.pathname === "/api/channel/codex/oauth/complete"
    ) {
      await fulfill({
        success: true,
        data: {
          key: JSON.stringify({
            access_token: "access-smoke",
            refresh_token: "refresh-smoke",
            account_id: "acct-codex-generated-smoke",
          }),
          account_id: "acct-codex-generated-smoke",
          email: "generated-codex-smoke@example.test",
        },
      });
      return;
    }

    if (
      method === "POST" &&
      url.pathname === `/api/channel/${codexChannel.id}/codex/refresh`
    ) {
      await fulfill({
        success: true,
        data: {
          account_id: "acct-codex-refreshed-smoke",
          email: "refreshed-codex-smoke@example.test",
          channel_id: codexChannel.id,
          channel_type: codexChannel.type,
          channel_name: codexChannel.name,
        },
      });
      return;
    }

    if (
      method === "GET" &&
      url.pathname === `/api/channel/${codexChannel.id}/codex/usage`
    ) {
      await fulfill({
        success: true,
        upstream_status: 200,
        data: {
          user_id: "codex-user-smoke",
          email: "codex-smoke@example.test",
          account_id: "acct-codex-smoke",
          plan_type: "plus",
          rate_limit: {
            allowed: true,
            limit_reached: false,
            plan_type: "plus",
            primary: {
              used: 12,
              limit: 300,
              reset_after_seconds: 3600,
            },
            secondary: {
              used: 20,
              limit: 1000,
              reset_after_seconds: 604800,
            },
          },
        },
      });
      return;
    }

    if (method === "PUT" && url.pathname === "/api/channel/") {
      const id = Number(postData?.id);
      const channel = channels.find((item) => item.id === id);
      await fulfill({
        success: true,
        data: {
          ...(channel || {}),
          ...(postData || {}),
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/channel/fetch_models") {
      await fulfill({
        success: true,
        data: [
          {
            id: "llama3.1:8b",
            owned_by: "ollama",
            size: 4_920_000_000,
            digest: "sha256:smoke",
          },
          {
            id: "qwen2.5:7b",
            owned_by: "ollama",
            size: 4_400_000_000,
          },
        ],
      });
      return;
    }

    if (method === "DELETE" && url.pathname === "/api/channel/ollama/delete") {
      await fulfill({ success: true, message: "deleted" });
      return;
    }

    if (
      method === "GET" &&
      url.pathname === `/api/channel/fetch_models/${ollamaChannel.id}`
    ) {
      await fulfill({
        success: true,
        data: ["llama3.1:8b", "qwen2.5:7b"],
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/channel/multi_key/manage") {
      await fulfill({
        success: true,
        data: {
          keys: [
            { index: 0, status: 1, reason: "", disabled_time: 0 },
            {
              index: 1,
              status: 2,
              reason: "manual smoke disable",
              disabled_time: 1717200300,
            },
            {
              index: 2,
              status: 3,
              reason: "auto smoke ban",
              disabled_time: 1717200400,
            },
          ],
          total: 3,
          page: 1,
          page_size: 10,
          total_pages: 1,
          enabled_count: 1,
          manual_disabled_count: 1,
          auto_disabled_count: 1,
        },
      });
      return;
    }

    if (
      method === "GET" &&
      url.pathname === `/api/channel/test/${multiKeyChannel.id}`
    ) {
      await fulfill({
        success: true,
        message: "tested",
        time: 0.456,
      });
      return;
    }

    if (
      method === "POST" &&
      url.pathname === "/api/channel/upstream_updates/apply"
    ) {
      await fulfill({
        success: true,
        data: {
          added_models: postData?.add_models || [],
          removed_models: postData?.remove_models || [],
          settings: {
            upstream_model_update_ignored_models: postData?.ignore_models || [],
          },
        },
      });
      return;
    }

    unhandled.push(`${method} ${url.pathname}`);
    await fulfill({ success: true, data: null });
  });

  return { requests, unhandled };
}

async function openRowMenu(page, channelName) {
  const row = page.getByRole("row", { name: new RegExp(channelName) });
  await row.getByRole("button", { name: "Open menu" }).click();
}

test.describe("channel specialist runtime surfaces", () => {
  test("opens Codex usage, Ollama models, multi-key status, and selected-model test flows", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
      window.localStorage.setItem("enable-tag-mode", "false");
      window.localStorage.setItem("channels-id-sort", "false");
    }, user);

    await page.goto("/channels");

    await expect(page.getByRole("heading", { name: "Channels" })).toBeVisible();
    await expect(page.getByText("smoke-codex-runtime")).toBeVisible();
    await expect(page.getByText("smoke-ollama-runtime")).toBeVisible();
    await expect(page.getByText("smoke-multi-key-runtime")).toBeVisible();

    await page.getByText("Account Info").click();
    const codexDialog = page.getByRole("dialog");
    await expect(
      codexDialog.getByRole("heading", { name: "Codex Account & Usage" })
    ).toBeVisible();
    await expect(codexDialog.getByText("codex-smoke@example.test")).toBeVisible();
    await expect(codexDialog.getByText("acct-codex-smoke")).toBeVisible();
    await codexDialog.getByRole("button", { name: "Close" }).click();

    await openRowMenu(page, "smoke-ollama-runtime");
    await page.getByRole("menuitem", { name: "Manage Ollama Models" }).click();
    const ollamaDialog = page.getByRole("dialog");
    await expect(
      ollamaDialog.getByRole("heading", { name: "Ollama Models" })
    ).toBeVisible();
    await expect(ollamaDialog.getByText("llama3.1:8b")).toBeVisible();
    await expect(ollamaDialog.getByText("qwen2.5:7b")).toBeVisible();
    await ollamaDialog.getByRole("button", { name: "Close" }).click();

    await openRowMenu(page, "smoke-multi-key-runtime");
    await page.getByRole("menuitem", { name: "Manage Keys" }).click();
    const multiKeyDialog = page.locator('[role="dialog"]').filter({
      hasText: "Multi-Key Management",
    });
    await expect(
      multiKeyDialog.getByRole("heading", { name: /Multi-Key Management/ })
    ).toBeVisible();
    await expect(multiKeyDialog.getByText("manual smoke disable")).toBeVisible();
    await expect(multiKeyDialog.getByText("auto smoke ban")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(multiKeyDialog).toBeHidden();

    await openRowMenu(page, "smoke-multi-key-runtime");
    await page.getByRole("menuitem", { name: "Test Connection" }).click();
    const testDialog = page.getByRole("dialog");
    await expect(
      testDialog.getByRole("heading", { name: "Test Channel Connection" })
    ).toBeVisible();
    await expect(testDialog.getByText("gpt-4o-mini")).toBeVisible();
    await testDialog
      .getByRole("row", { name: /gpt-4o-mini/ })
      .getByRole("button", { name: "Test" })
      .click();
    await expect(testDialog.getByText("456ms")).toBeVisible();

    const listRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/channel" &&
        request.params.p === "1" &&
        request.params.page_size === "20"
    );
    const codexUsageRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === `/api/channel/${codexChannel.id}/codex/usage`
    );
    const ollamaLiveFetchRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/channel/fetch_models" &&
        request.postData?.type === ollamaChannel.type &&
        request.postData?.base_url === ollamaChannel.base_url
    );
    const multiKeyStatusRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/channel/multi_key/manage" &&
        request.postData?.channel_id === multiKeyChannel.id &&
        request.postData?.action === "get_key_status" &&
        request.postData?.page === 1 &&
        request.postData?.page_size === 10
    );
    const modelTestRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === `/api/channel/test/${multiKeyChannel.id}` &&
        request.params.model === "gpt-4o-mini"
    );

    expect(listRequest).toBeTruthy();
    expect(codexUsageRequest).toBeTruthy();
    expect(ollamaLiveFetchRequest).toBeTruthy();
    expect(multiKeyStatusRequest).toBeTruthy();
    expect(modelTestRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("executes mocked Codex OAuth, credential refresh, multi-key, Ollama, and upstream update actions", async ({
    page,
    context,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await context.addInitScript(() => {
      window.open = () => null;
    });

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
      window.localStorage.setItem("enable-tag-mode", "false");
      window.localStorage.setItem("channels-id-sort", "false");
    }, user);

    await page.goto("/channels");

    await openRowMenu(page, "smoke-codex-runtime");
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: "Edit Channel" })).toBeVisible();
    await expect(page.getByText("Codex Authorization")).toBeVisible();
    await page.getByRole("button", { name: "Refresh credential" }).click();
    await page.getByRole("button", { name: "Authorize" }).click();
    const oauthDialog = page.getByRole("dialog");
    await expect(
      oauthDialog.getByRole("heading", { name: "Codex Authorization" })
    ).toBeVisible();
    await oauthDialog
      .getByRole("button", { name: "Open authorization page" })
      .click();
    await oauthDialog
      .getByPlaceholder("Paste the full callback URL (includes code & state)")
      .fill("http://127.0.0.1:1455/callback?code=smoke-code&state=smoke");
    await oauthDialog
      .getByRole("button", { name: "Generate credential" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Codex Authorization" }).first()
    ).toBeHidden();
    await page.getByRole("button", { name: "Update Channel" }).click();
    await expect(page.getByRole("heading", { name: "Edit Channel" })).toBeHidden();

    await openRowMenu(page, "smoke-multi-key-runtime");
    await page.getByRole("menuitem", { name: "Manage Keys" }).click();
    const multiKeyDialog = page.getByRole("dialog");
    await expect(
      multiKeyDialog.getByRole("heading", { name: /Multi-Key Management/ })
    ).toBeVisible();
    await multiKeyDialog
      .getByRole("row", { name: /#1\s+Enabled/ })
      .getByRole("button", { name: "Disable" })
      .click();
    const confirmDialog = page.locator('[role="dialog"]').filter({
      hasText: "Confirm Action",
    });
    await confirmDialog.getByRole("button", { name: "Confirm" }).click();
    await multiKeyDialog.locator("button.absolute.right-4.top-4").click();
    await expect(
      page.getByRole("heading", { name: /Multi-Key Management/ })
    ).toBeHidden();

    await openRowMenu(page, "smoke-ollama-runtime");
    await page.getByRole("menuitem", { name: "Manage Ollama Models" }).click();
    const ollamaDialog = page.getByRole("dialog");
    await expect(
      ollamaDialog.getByRole("heading", { name: "Ollama Models" })
    ).toBeVisible();
    await ollamaDialog.getByLabel("Select model qwen2.5:7b").check();
    await ollamaDialog
      .getByRole("button", { name: "Append to channel" })
      .click();
    await ollamaDialog.locator("button.text-destructive").nth(1).click();
    const deleteDialog = page.getByRole("alertdialog");
    await expect(deleteDialog.getByText(/Delete model/)).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Delete" }).click();
    await ollamaDialog.getByRole("button", { name: "Close" }).click();

    await openRowMenu(page, "smoke-upstream-update-runtime");
    await page.getByRole("menuitem", { name: "Upstream Updates" }).click();
    const upstreamDialog = page.getByRole("dialog");
    await expect(
      upstreamDialog.getByRole("heading", { name: "Upstream Model Updates" })
    ).toBeVisible();
    await expect(upstreamDialog.getByText("claude-3-7-sonnet-smoke")).toBeVisible();
    await upstreamDialog.getByRole("button", { name: "Confirm" }).click();
    await expect(upstreamDialog).toBeHidden();

    const oauthStartRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/channel/codex/oauth/start"
    );
    const oauthCompleteRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/channel/codex/oauth/complete" &&
        request.postData?.input?.includes("code=smoke-code")
    );
    const credentialRefreshRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === `/api/channel/${codexChannel.id}/codex/refresh`
    );
    const codexUpdateRequest = requests.find(
      (request) =>
        request.method === "PUT" &&
        request.pathname === "/api/channel/" &&
        request.postData?.id === codexChannel.id &&
        typeof request.postData?.key === "string" &&
        request.postData.key.includes("acct-codex-generated-smoke")
    );
    const multiKeyDisableRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/channel/multi_key/manage" &&
        request.postData?.channel_id === multiKeyChannel.id &&
        request.postData?.action === "disable_key" &&
        request.postData?.key_index === 0
    );
    const ollamaUpdateRequest = requests.find(
      (request) =>
        request.method === "PUT" &&
        request.pathname === "/api/channel/" &&
        request.postData?.id === ollamaChannel.id &&
        String(request.postData?.models || "").includes("qwen2.5:7b")
    );
    const ollamaDeleteRequest = requests.find(
      (request) =>
        request.method === "DELETE" &&
        request.pathname === "/api/channel/ollama/delete" &&
        request.postData?.channel_id === ollamaChannel.id &&
        request.postData?.model_name === "qwen2.5:7b"
    );
    const upstreamApplyRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/channel/upstream_updates/apply" &&
        request.postData?.id === upstreamUpdateChannel.id &&
        request.postData?.add_models?.includes("claude-3-7-sonnet-smoke") &&
        request.postData?.remove_models?.includes("claude-3-5-sonnet")
    );

    expect(oauthStartRequest).toBeTruthy();
    expect(oauthCompleteRequest).toBeTruthy();
    expect(credentialRefreshRequest).toBeTruthy();
    expect(codexUpdateRequest).toBeTruthy();
    expect(multiKeyDisableRequest).toBeTruthy();
    expect(ollamaUpdateRequest).toBeTruthy();
    expect(ollamaDeleteRequest).toBeTruthy();
    expect(upstreamApplyRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("normalizes base_url while preserving pass-through header settings when editing a channel", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
      window.localStorage.setItem("enable-tag-mode", "false");
      window.localStorage.setItem("channels-id-sort", "false");
    }, user);

    await page.goto("/channels");

    await openRowMenu(page, passThroughChannel.name);
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Channel" })
    ).toBeVisible();
    await expect(page.getByText("Pass Through Headers")).toBeVisible();
    await expect(
      page.getByText("Pass request headers directly to upstream")
    ).toBeVisible();

    await page.getByLabel("Name *").fill("smoke-pass-through-runtime-edited");
    await page.getByRole("button", { name: "Update Channel" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Channel" })
    ).toBeHidden();

    await expect
      .poll(
        () =>
          requests
            .filter(
              (request) =>
                request.method === "PUT" &&
                request.pathname === "/api/channel/" &&
                request.postData?.id === passThroughChannel.id
            )
            .map((request) => {
              try {
                return {
                  base_url: request.postData.base_url,
                  setting: JSON.parse(request.postData.setting || "{}"),
                };
              } catch {
                return null;
              }
            }),
        { timeout: 3000 }
      )
      .toEqual([
        expect.objectContaining({
          base_url: "https://pass-through.example.test",
          setting: expect.objectContaining({
            pass_through_body_enabled: false,
            pass_through_header_enabled: true,
          }),
        }),
      ]);
    expect(unhandled).toEqual([]);
  });

  test("suggests source and target models in the mapping editor", async ({
    page,
  }) => {
    const { unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
      window.localStorage.setItem("enable-tag-mode", "false");
      window.localStorage.setItem("channels-id-sort", "false");
    }, user);

    await page.goto("/channels");

    await openRowMenu(page, multiKeyChannel.name);
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Channel" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Add Mapping" }).click();

    const sourceInput = page.locator('input[placeholder="gpt-3.5-turbo"]');
    const targetInput = page.locator('input[placeholder="gpt-3.5-turbo-0125"]');
    await expect(sourceInput).toBeVisible();
    await expect(targetInput).toBeVisible();

    const sourceListId = await sourceInput.getAttribute("list");
    const targetListId = await targetInput.getAttribute("list");
    expect(sourceListId).toBeTruthy();
    expect(targetListId).toBeTruthy();

    await expect
      .poll(
        async () => ({
          sourceOptions: await page
            .locator(`datalist[id="${sourceListId}"] option`)
            .evaluateAll((options) =>
              options.map((option) => option.getAttribute("value"))
            ),
          targetOptions: await page
            .locator(`datalist[id="${targetListId}"] option`)
            .evaluateAll((options) =>
              options.map((option) => option.getAttribute("value"))
            ),
        }),
        { timeout: 3000 }
      )
      .toEqual({
        sourceOptions: expect.arrayContaining(["gpt-4o-mini"]),
        targetOptions: expect.arrayContaining([
          "gpt-4o-mini",
          "claude-3-7-sonnet-smoke",
        ]),
      });

    expect(unhandled).toEqual([]);
  });

  test("opens Advanced Settings when a hidden advanced field is invalid", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
      window.localStorage.setItem("enable-tag-mode", "false");
      window.localStorage.setItem("channels-id-sort", "false");
      window.localStorage.setItem("channel-advanced-settings-expanded", "false");
    }, user);

    await page.goto("/channels");

    await page.getByRole("button", { name: "Create Channel" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Channel" })
    ).toBeVisible();
    await expect(page.getByLabel("Remark")).toBeHidden();

    await page.getByRole("button", { name: "Advanced Settings" }).click();
    await expect(page.getByLabel("Remark")).toBeVisible();
    await page.getByLabel("Remark").fill("x".repeat(256));
    await page.getByRole("button", { name: "Advanced Settings" }).click();
    await expect(page.getByLabel("Remark")).toBeHidden();

    await page.getByLabel("Name *").fill("smoke-hidden-advanced-error");
    await page.getByLabel("API Key *").fill("sk-hidden-advanced-error");
    await page
      .getByPlaceholder("Add custom model(s), comma-separated")
      .fill("gpt-4o-mini");
    await page
      .getByPlaceholder("Add custom model(s), comma-separated")
      .press("Enter");

    const requestCountBeforeSubmit = requests.length;
    await page.getByRole("button", { name: "Save changes" }).click();

    expect(
      requests
        .slice(requestCountBeforeSubmit)
        .some(
          (request) =>
            request.method === "POST" && request.pathname === "/api/channel"
        )
    ).toBe(false);
    await expect(page.getByLabel("Remark")).toBeVisible();
    await expect(
      page.getByText("Remark must be less than 255 characters")
    ).toBeVisible();
    expect(unhandled).toEqual([]);
  });

  test("blocks Vertex AI create when deployment region is empty", async ({
    page,
  }) => {
    const { requests } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
      window.localStorage.setItem("enable-tag-mode", "false");
      window.localStorage.setItem("channels-id-sort", "false");
    }, user);

    await page.goto("/channels");

    await page.getByRole("button", { name: "Create Channel" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Channel" })
    ).toBeVisible();
    await page.getByLabel("Name *").fill("smoke-vertex-missing-region");
    await page.getByLabel("Type *").click();
    await page.getByLabel("Type *").fill("Vertex");
    await page.getByRole("option", { name: /Vertex/i }).click();
    await expect(page.getByText("Deployment Region *")).toBeVisible();
    await page.getByLabel("API Key *").fill(
      JSON.stringify({
        type: "service_account",
        project_id: "smoke-project",
        client_email: "vertex-smoke@example.test",
      })
    );
    await page
      .getByPlaceholder("Add custom model(s), comma-separated")
      .fill("gemini-1.5-pro");
    await page
      .getByPlaceholder("Add custom model(s), comma-separated")
      .press("Enter");

    const requestCountBeforeSubmit = requests.length;
    await page.getByRole("button", { name: "Save changes" }).click();

    expect(
      requests
        .slice(requestCountBeforeSubmit)
        .some(
          (request) =>
            request.method === "POST" && request.pathname === "/api/channel"
        )
    ).toBe(false);
    await expect(
      page.getByText("This channel type requires additional configuration")
    ).toBeVisible();
  });

  test("blocks Vertex AI create when deployment region JSON lacks default", async ({
    page,
  }) => {
    const { requests } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
      window.localStorage.setItem("enable-tag-mode", "false");
      window.localStorage.setItem("channels-id-sort", "false");
    }, user);

    await page.goto("/channels");

    await page.getByRole("button", { name: "Create Channel" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Channel" })
    ).toBeVisible();
    await page.getByLabel("Name *").fill("smoke-vertex-invalid-region");
    await page.getByLabel("Type *").click();
    await page.getByLabel("Type *").fill("Vertex");
    await page.getByRole("option", { name: /Vertex/i }).click();
    await page.getByLabel("API Key *").fill(
      JSON.stringify({
        type: "service_account",
        project_id: "smoke-project",
        client_email: "vertex-smoke@example.test",
      })
    );
    await page
      .getByLabel("Deployment Region *")
      .fill('{"gemini-1.5-pro": "us-central1"}');
    await page
      .getByPlaceholder("Add custom model(s), comma-separated")
      .fill("gemini-1.5-pro");
    await page
      .getByPlaceholder("Add custom model(s), comma-separated")
      .press("Enter");

    const requestCountBeforeSubmit = requests.length;
    await page.getByRole("button", { name: "Save changes" }).click();

    expect(
      requests
        .slice(requestCountBeforeSubmit)
        .some(
          (request) =>
            request.method === "POST" && request.pathname === "/api/channel"
        )
    ).toBe(false);
    await expect(
      page.getByText("Deployment Region must be JSON with a default region")
    ).toBeVisible();
  });
});
