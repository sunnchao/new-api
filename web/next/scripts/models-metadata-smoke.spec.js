/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const adminUser = {
  id: 7701,
  username: "models-metadata-smoke",
  display_name: "Models Metadata Smoke",
  email: "models-metadata-smoke@example.com",
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

const baseVendors = [
  {
    id: 1201,
    name: "Smoke OpenAI",
    description: "OpenAI smoke vendor",
    icon: "OpenAI",
    status: 1,
    created_time: 1717200000,
    updated_time: 1717203600,
  },
  {
    id: 1202,
    name: "Smoke Anthropic",
    description: "Anthropic smoke vendor",
    icon: "Anthropic",
    status: 1,
    created_time: 1717300000,
    updated_time: 1717303600,
  },
];

const baseModels = [
  {
    id: 2201,
    model_name: "smoke-gpt-4o",
    description: "Baseline metadata smoke model",
    icon: "OpenAI",
    tags: "chat,vision",
    vendor_id: 1201,
    endpoints: '{"openai":{"path":"/v1/chat/completions","method":"POST"}}',
    status: 1,
    sync_official: 1,
    created_time: 1717200000,
    updated_time: 1717203600,
    name_rule: 0,
    bound_channels: [{ id: 1, name: "smoke-openai-channel", type: 1 }],
    enable_groups: ["default"],
    quota_types: [0],
  },
  {
    id: 2202,
    model_name: "smoke-claude-opus",
    description: "Search target metadata model",
    icon: "Anthropic",
    tags: "chat",
    vendor_id: 1202,
    endpoints: '{"anthropic":{"path":"/v1/messages","method":"POST"}}',
    status: 1,
    sync_official: 1,
    created_time: 1717300000,
    updated_time: 1717303600,
    name_rule: 0,
    bound_channels: [],
    enable_groups: ["default", "pro"],
    quota_types: [0],
  },
  {
    id: 2203,
    model_name: "smoke-disabled-unsynced",
    description: "Disabled unsynced model for URL filter hydration",
    icon: "Anthropic",
    tags: "legacy",
    vendor_id: 1202,
    endpoints: '{"anthropic":{"path":"/v1/messages","method":"POST"}}',
    status: 0,
    sync_official: 0,
    created_time: 1717400000,
    updated_time: 1717403600,
    name_rule: 0,
    bound_channels: [],
    enable_groups: ["pro"],
    quota_types: [0],
  },
];

const systemOptions = [
  { key: "ModelPrice", value: "{}" },
  { key: "ModelRatio", value: "{}" },
  { key: "CacheRatio", value: "{}" },
  { key: "CompletionRatio", value: "{}" },
  { key: "ImageRatio", value: "{}" },
  { key: "AudioRatio", value: "{}" },
  { key: "AudioCompletionRatio", value: "{}" },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseJsonBody(request) {
  const body = request.postData();
  return body ? JSON.parse(body) : undefined;
}

function modelMatchesParams(model, params) {
  const keyword = (params.keyword || "").toLowerCase();
  const vendor = params.vendor;
  const status = params.status;
  const sync = params.sync_official;

  if (keyword && !model.model_name.toLowerCase().includes(keyword)) {
    return false;
  }
  if (vendor && vendor !== "all" && String(model.vendor_id || "") !== vendor) {
    return false;
  }
  if (status === "enabled" && model.status !== 1) {
    return false;
  }
  if (status === "disabled" && model.status === 1) {
    return false;
  }
  if (sync === "yes" && model.sync_official !== 1) {
    return false;
  }
  if (sync === "no" && model.sync_official === 1) {
    return false;
  }

  return true;
}

function vendorCounts(models) {
  const counts = { all: models.length };
  for (const model of models) {
    if (model.vendor_id) {
      counts[String(model.vendor_id)] = (counts[String(model.vendor_id)] || 0) + 1;
    }
  }
  return counts;
}

function paginatedModels(models, params) {
  const page = Number(params.p || 1);
  const pageSize = Number(params.page_size || 20);
  const start = (page - 1) * pageSize;

  return {
    success: true,
    data: {
      items: clone(models.slice(start, start + pageSize)),
      total: models.length,
      page,
      page_size: pageSize,
      vendor_counts: vendorCounts(models),
    },
  };
}

async function mockApi(page) {
  const requests = [];
  const unhandled = [];
  const models = clone(baseModels);
  const vendors = clone(baseVendors);
  let nextModelId = 2300;

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
          system_name: "new-api models metadata smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          quota_per_unit: 1,
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: adminUser });
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

    if (method === "GET" && url.pathname === "/api/group/") {
      await fulfill({ success: true, data: ["default", "pro"] });
      return;
    }

    if (method === "GET" && url.pathname === "/api/option/") {
      await fulfill({ success: true, data: clone(systemOptions) });
      return;
    }

    if (method === "PUT" && url.pathname === "/api/option/") {
      await fulfill({ success: true, message: "updated" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/deployments/settings") {
      await fulfill({ success: true, data: { enabled: false } });
      return;
    }

    if (method === "GET" && url.pathname === "/api/vendors/") {
      await fulfill({
        success: true,
        data: {
          items: clone(vendors),
          total: vendors.length,
          page: Number(params.p || 1),
          page_size: Number(params.page_size || 1000),
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/models/") {
      const filtered = models.filter((model) => modelMatchesParams(model, params));
      await fulfill(paginatedModels(filtered, params));
      return;
    }

    if (method === "GET" && url.pathname === "/api/models/search") {
      const filtered = models.filter((model) => modelMatchesParams(model, params));
      await fulfill(paginatedModels(filtered, params));
      return;
    }

    if (method === "POST" && url.pathname === "/api/models/") {
      const created = {
        id: nextModelId++,
        model_name: body.model_name,
        description: body.description || "",
        icon: body.icon || "",
        tags: body.tags || "",
        vendor_id: body.vendor_id,
        endpoints: body.endpoints || "",
        status: body.status,
        sync_official: body.sync_official,
        created_time: 1719880000,
        updated_time: 1719880000,
        name_rule: body.name_rule,
        bound_channels: [],
        enable_groups: ["default"],
        quota_types: [0],
      };
      models.unshift(created);
      await fulfill({ success: true, data: clone(created), message: "created" });
      return;
    }

    if (
      method === "PUT" &&
      url.pathname === "/api/models/" &&
      params.status_only === "true"
    ) {
      const model = models.find((item) => item.id === body.id);
      if (model) {
        model.status = body.status;
        model.updated_time = 1719883600;
      }
      await fulfill({
        success: Boolean(model),
        data: model ? clone(model) : undefined,
        message: model ? "status updated" : "not found",
      }, model ? 200 : 404);
      return;
    }

    if (method === "PUT" && url.pathname === "/api/models/") {
      const index = models.findIndex((item) => item.id === body.id);
      if (index >= 0) {
        models[index] = {
          ...models[index],
          ...body,
          updated_time: 1719887200,
        };
      }
      await fulfill({
        success: index >= 0,
        data: index >= 0 ? clone(models[index]) : undefined,
        message: index >= 0 ? "updated" : "not found",
      }, index >= 0 ? 200 : 404);
      return;
    }

    const modelMatch = url.pathname.match(/^\/api\/models\/(\d+)$/);
    if (modelMatch && method === "GET") {
      const id = Number(modelMatch[1]);
      const model = models.find((item) => item.id === id);
      await fulfill(
        model
          ? { success: true, data: clone(model) }
          : { success: false, message: "not found" },
        model ? 200 : 404
      );
      return;
    }

    if (modelMatch && method === "DELETE") {
      const id = Number(modelMatch[1]);
      const index = models.findIndex((item) => item.id === id);
      if (index >= 0) models.splice(index, 1);
      await fulfill({ success: true, message: "deleted" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/models/missing") {
      await fulfill({
        success: true,
        data: ["smoke-unconfigured-model", "smoke-unconfigured-vision"],
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/models/sync_upstream/preview") {
      await fulfill({
        success: true,
        data: {
          missing: [{ model_name: "smoke-upstream-new", vendor: "Smoke OpenAI" }],
          conflicts: [],
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/models/sync_upstream") {
      await fulfill({
        success: true,
        data: {
          created_models: 1,
          updated_models: 0,
          created_vendors: 0,
          skipped_models: [],
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
  }, adminUser);
}

async function openPrimaryActionsMenu(page) {
  await page
    .getByRole("button", { name: "Add Model" })
    .locator("xpath=following-sibling::button[1]")
    .click();
}

async function openRowMenu(page, modelName) {
  const row = page.getByRole("row", { name: new RegExp(modelName) });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Open menu" }).click();
}

async function fillModelBasics(scope, values) {
  await scope
    .getByPlaceholder("gpt-4, claude-3-opus, etc.")
    .fill(values.modelName);
  await scope.getByPlaceholder("Describe this model...").fill(values.description);
  await scope.getByPlaceholder("OpenAI, Anthropic, etc.").fill(values.icon);
}

function findRequest(requests, predicate) {
  return requests.find(predicate);
}

test.describe("models metadata admin workflow", () => {
  test("redirects the models root route to metadata", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/models");

    await expect(page).toHaveURL(/\/models\/metadata$/);
    await expect(page.getByRole("heading", { name: "Metadata" })).toBeVisible();
    await expect(page.getByText("smoke-gpt-4o")).toBeVisible();

    const initialListRequest = findRequest(
      requests,
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/models/" &&
        request.params.p === "1" &&
        request.params.page_size === "20"
    );
    expect(initialListRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("canonicalizes invalid model sections to metadata", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/models/not-real");

    await expect(page).toHaveURL(/\/models\/metadata$/);
    await expect(page.getByRole("heading", { name: "Metadata" })).toBeVisible();
    await expect(page.getByText("smoke-gpt-4o")).toBeVisible();

    const initialListRequest = findRequest(
      requests,
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/models/" &&
        request.params.p === "1" &&
        request.params.page_size === "20"
    );
    expect(initialListRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("hydrates metadata table filters from URL search params", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/models/metadata?status=disabled&vendor=1202&sync=no");

    await expect(page.getByRole("heading", { name: "Metadata" })).toBeVisible();
    await expect(page.getByText("smoke-disabled-unsynced")).toBeVisible();
    await expect(page.getByText("smoke-gpt-4o")).toBeHidden();
    await expect(page.getByText("smoke-claude-opus")).toBeHidden();

    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "GET" &&
            request.pathname === "/api/models/search" &&
            request.params.status === "disabled" &&
            request.params.vendor === "1202" &&
            request.params.sync_official === "no"
        )
      )
      .toBe(true);

    expect(unhandled).toEqual([]);
  });

  test("loads, searches, syncs, creates, edits, disables, and deletes model metadata", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/models/metadata");

    await expect(page.getByRole("heading", { name: "Metadata" })).toBeVisible();
    await expect(page.getByText("smoke-gpt-4o")).toBeVisible();
    await expect(page.getByText("smoke-claude-opus")).toBeVisible();

    const initialListRequest = findRequest(
      requests,
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/models/" &&
        request.params.p === "1" &&
        request.params.page_size === "20"
    );
    expect(initialListRequest).toBeTruthy();

    await page.getByPlaceholder("Filter by model name...").fill("opus");
    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "GET" &&
            request.pathname === "/api/models/search" &&
            request.params.keyword === "opus" &&
            request.params.p === "1" &&
            request.params.page_size === "20"
        )
      )
      .toBe(true);
    await expect(page.getByText("smoke-claude-opus")).toBeVisible();
    await expect(page.getByText("smoke-gpt-4o")).toBeHidden();

    await page.getByRole("button", { name: /Reset/ }).click();
    await expect(page.getByText("smoke-gpt-4o")).toBeVisible();

    await openPrimaryActionsMenu(page);
    await page.getByRole("menuitem", { name: "Sync Upstream" }).click();
    const syncDialog = page.getByRole("dialog");
    await expect(
      syncDialog.getByRole("heading", { name: "Sync Upstream Models" })
    ).toBeVisible();
    await syncDialog.getByRole("button", { name: "Sync Now" }).click();
    await expect(syncDialog).toBeHidden();

    const previewRequest = findRequest(
      requests,
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/models/sync_upstream/preview" &&
        request.params.locale === "zh" &&
        request.params.source === "official"
    );
    const syncRequest = findRequest(
      requests,
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/models/sync_upstream" &&
        request.body?.locale === "zh" &&
        request.body?.source === "official"
    );
    expect(previewRequest).toBeTruthy();
    expect(syncRequest).toBeTruthy();

    await page.getByRole("button", { name: "Add Model" }).click();
    const createDrawer = page.getByRole("dialog");
    await expect(
      createDrawer.getByRole("heading", { name: "Create Model" })
    ).toBeVisible();
    await fillModelBasics(createDrawer, {
      modelName: "smoke-runtime-model",
      description: "Created from the metadata smoke test",
      icon: "OpenAI",
    });
    await createDrawer.getByRole("button", { name: "Save changes" }).click();
    await expect(createDrawer).toBeHidden();
    await expect(page.getByText("smoke-runtime-model")).toBeVisible();

    const createRequest = findRequest(
      requests,
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/models/" &&
        request.body?.model_name === "smoke-runtime-model"
    );
    expect(createRequest).toBeTruthy();
    expect(createRequest.body).toMatchObject({
      model_name: "smoke-runtime-model",
      description: "Created from the metadata smoke test",
      icon: "OpenAI",
      tags: "",
      endpoints: "",
      name_rule: 0,
      status: 1,
      sync_official: 1,
    });

    await openRowMenu(page, "smoke-runtime-model");
    await page.getByRole("menuitem", { name: "Edit" }).click();
    const editDrawer = page.getByRole("dialog");
    await expect(editDrawer.getByRole("heading", { name: "Edit Model" })).toBeVisible();
    await fillModelBasics(editDrawer, {
      modelName: "smoke-runtime-model-edited",
      description: "Edited from the metadata smoke test",
      icon: "Anthropic",
    });
    await editDrawer.getByRole("button", { name: "Update Model" }).click();
    await expect(editDrawer).toBeHidden();
    await expect(page.getByText("smoke-runtime-model-edited")).toBeVisible();

    const updateRequest = findRequest(
      requests,
      (request) =>
        request.method === "PUT" &&
        request.pathname === "/api/models/" &&
        request.params.status_only !== "true" &&
        request.body?.model_name === "smoke-runtime-model-edited"
    );
    expect(updateRequest).toBeTruthy();
    expect(updateRequest.body).toMatchObject({
      id: createRequest.body.id || updateRequest.body.id,
      model_name: "smoke-runtime-model-edited",
      description: "Edited from the metadata smoke test",
      icon: "Anthropic",
      status: 1,
      sync_official: 1,
    });

    await openRowMenu(page, "smoke-runtime-model-edited");
    await page.getByRole("menuitem", { name: "Disable" }).click();
    await expect
      .poll(() =>
        requests.some(
          (request) =>
            request.method === "PUT" &&
            request.pathname === "/api/models/" &&
            request.params.status_only === "true" &&
            request.body?.id === updateRequest.body.id &&
            request.body?.status === 0
        )
      )
      .toBe(true);
    await expect(
      page.getByRole("row", { name: /smoke-runtime-model-edited/ }).getByText("Disabled")
    ).toBeVisible();

    await openRowMenu(page, "smoke-runtime-model-edited");
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const deleteDialog = page.getByRole("dialog");
    await expect(deleteDialog.getByRole("heading", { name: "Delete Model" })).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Delete" }).click();
    await expect(deleteDialog).toBeHidden();
    await expect(
      page.getByRole("row", { name: /smoke-runtime-model-edited/ })
    ).toBeHidden();

    const deleteRequest = findRequest(
      requests,
      (request) =>
        request.method === "DELETE" &&
        request.pathname === `/api/models/${updateRequest.body.id}`
    );
    expect(deleteRequest).toBeTruthy();

    expect(unhandled).toEqual([]);
  });
});
