/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 7070,
  username: "model-deployments-smoke",
  display_name: "Model Deployments Smoke",
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

const deployment = {
  id: "dep-smoke-001",
  deployment_name: "smoke-llama-runtime",
  container_name: "smoke-container",
  name: "smoke-llama-runtime",
  status: "running",
  provider: "io.net",
  time_remaining: "2 hours",
  compute_minutes_remaining: 120,
  completed_percent: 40,
  hardware_name: "NVIDIA A100",
  brand_name: "NVIDIA",
  hardware_id: 101,
  hardware_quantity: 1,
  gpus_per_container: 1,
  total_containers: 1,
  created_at: 1717200000,
  locations: [{ id: 17, name: "United States", iso2: "US" }],
  total_gpus: 1,
  container_config: {
    image_url: "ollama/ollama:latest",
    traffic_port: 11434,
    entrypoint: ["ollama", "serve"],
    env_variables: {
      EXISTING: "1",
    },
  },
};

const containers = [
  {
    container_id: "container-smoke-001",
    status: "running",
    public_url: "https://example.test/container-smoke-001",
  },
];

function parseJsonBody(request) {
  try {
    return request.postDataJSON();
  } catch {
    return request.postData();
  }
}

function waitForApiRequest(page, pathname, predicate = () => true) {
  return page.waitForRequest((request) => {
    const url = new URL(request.url());
    const params = Object.fromEntries(url.searchParams.entries());
    return url.pathname === pathname && predicate(params, request);
  });
}

async function mockApi(page) {
  const requests = [];
  const unhandled = [];

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    const params = Object.fromEntries(url.searchParams.entries());
    const body = parseJsonBody(request);
    requests.push({ method, pathname: url.pathname, params, body });

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
          system_name: "new-api model deployments smoke",
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

    if (method === "GET" && url.pathname === "/api/deployments/settings") {
      await fulfill({ success: true, data: { enabled: true } });
      return;
    }

    if (
      method === "POST" &&
      url.pathname === "/api/deployments/settings/test-connection"
    ) {
      await fulfill({ success: true, message: "connected" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/deployments/") {
      await fulfill({
        success: true,
        data: {
          items: [deployment],
          total: 1,
          page: Number(params.p || 1),
          page_size: Number(params.page_size || 10),
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/deployments/search") {
      await fulfill({
        success: true,
        data: {
          items: [deployment],
          total: 1,
          page: Number(params.p || 1),
          page_size: Number(params.page_size || 10),
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === `/api/deployments/${deployment.id}`) {
      await fulfill({ success: true, data: deployment });
      return;
    }

    if (
      method === "GET" &&
      url.pathname === `/api/deployments/${deployment.id}/containers`
    ) {
      await fulfill({ success: true, data: { total: 1, containers } });
      return;
    }

    if (
      method === "GET" &&
      url.pathname === `/api/deployments/${deployment.id}/logs`
    ) {
      await fulfill({
        success: true,
        data: "smoke boot complete\nsmoke model ready",
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/deployments/hardware-types") {
      await fulfill({
        success: true,
        data: {
          hardware_types: [
            {
              id: 101,
              brand_name: "NVIDIA",
              name: "H100",
              max_gpus: 8,
            },
          ],
        },
      });
      return;
    }

    if (
      method === "GET" &&
      url.pathname === "/api/deployments/available-replicas"
    ) {
      await fulfill({
        success: true,
        data: {
          replicas: [
            {
              location_id: 17,
              location_name: "United States",
              available_replicas: 4,
            },
          ],
        },
      });
      return;
    }

    if (
      method === "POST" &&
      url.pathname === "/api/deployments/price-estimation"
    ) {
      await fulfill({
        success: true,
        data: {
          total_cost: 12.5,
          currency: "usdc",
          price_breakdown: {
            total_cost: 12.5,
          },
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/deployments/check-name") {
      await fulfill({
        success: true,
        data: {
          available: true,
          name: params.name,
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/deployments/") {
      await fulfill({
        success: true,
        data: {
          id: "dep-smoke-created",
        },
      });
      return;
    }

    if (method === "PUT" && url.pathname === `/api/deployments/${deployment.id}`) {
      await fulfill({ success: true, data: { id: deployment.id } });
      return;
    }

    if (
      method === "PUT" &&
      url.pathname === `/api/deployments/${deployment.id}/name`
    ) {
      await fulfill({ success: true, data: { id: deployment.id } });
      return;
    }

    if (
      method === "POST" &&
      url.pathname === `/api/deployments/${deployment.id}/extend`
    ) {
      await fulfill({ success: true, data: { id: deployment.id } });
      return;
    }

    if (
      method === "DELETE" &&
      url.pathname === `/api/deployments/${deployment.id}`
    ) {
      await fulfill({ success: true });
      return;
    }

    unhandled.push(`${method} ${url.pathname}`);
    await fulfill({ success: true, data: null });
  });

  return { requests, unhandled };
}

test.describe("model deployments runtime surface", () => {
  test("creates and mutates deployments through runtime actions", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/models/deployments");

    await expect(page.getByRole("heading", { name: "Deployments" })).toBeVisible();
    await expect(page.getByText("smoke-container")).toBeVisible();

    await page.getByRole("button", { name: "Create deployment" }).click();
    const createDialog = page.getByRole("dialog", { name: "Create deployment" });
    await expect(createDialog).toBeVisible();
    await expect(createDialog.locator('textarea[name="secret_env_json"]')).toHaveValue(
      /"OLLAMA_API_KEY": "ionet-[a-z0-9]+"/i
    );
    await createDialog.getByLabel("Container name").fill("created-smoke-runtime");
    await createDialog.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "NVIDIA H100" }).click();
    await createDialog.getByRole("combobox").nth(1).click();
    await page.getByText("United States").click();
    await createDialog.getByLabel("GPU count").fill("2");
    await createDialog.getByLabel("Replica count").fill("2");
    await createDialog.getByLabel("Duration (hours)").fill("3");
    await createDialog.getByLabel("Port").fill("8080");
    await createDialog
      .locator('textarea[name="env_json"]')
      .fill('{"MODEL":"smoke"}');
    await createDialog
      .locator('textarea[name="secret_env_json"]')
      .fill('{"TOKEN":"secret"}');
    const createRequest = waitForApiRequest(
      page,
      "/api/deployments/",
      (_params, request) => request.method() === "POST"
    );
    await createDialog.getByRole("button", { name: "Create" }).click();
    await createRequest;

    await page.locator('button[title="Update configuration"]').click();
    const updateDialog = page.getByRole("dialog", {
      name: /Update configuration/,
    });
    await expect(updateDialog).toBeVisible();
    await updateDialog.getByLabel("Image").fill("ghcr.io/smoke/updated:latest");
    await updateDialog.getByLabel("Port").fill("9090");
    await updateDialog.getByLabel("Entrypoint (space separated)").fill("bash -lc");
    await updateDialog.getByLabel("Args (space separated)").fill("--serve smoke");
    await updateDialog.getByLabel("Command").fill("echo smoke");
    const updateRequest = waitForApiRequest(
      page,
      `/api/deployments/${deployment.id}`,
      (_params, request) => request.method() === "PUT"
    );
    await updateDialog.getByRole("button", { name: "Update" }).click();
    await updateRequest;

    await page.locator('button[title="Rename deployment"]').click();
    const renameDialog = page.getByRole("dialog", { name: "Rename deployment" });
    await expect(renameDialog).toBeVisible();
    await renameDialog.getByPlaceholder("Enter a new name").fill("renamed-smoke-runtime");
    const renameRequest = waitForApiRequest(
      page,
      `/api/deployments/${deployment.id}/name`,
      (_params, request) => request.method() === "PUT"
    );
    await renameDialog.getByRole("button", { name: "Rename" }).click();
    await renameRequest;

    await page.locator('button[title="Extend deployment"]').click();
    const extendDialog = page.getByRole("dialog", { name: "Extend deployment" });
    await expect(extendDialog).toBeVisible();
    await extendDialog.getByRole("spinbutton").fill("5");
    const extendRequest = waitForApiRequest(
      page,
      `/api/deployments/${deployment.id}/extend`,
      (_params, request) => request.method() === "POST"
    );
    await extendDialog.getByRole("button", { name: "Extend" }).click();
    await extendRequest;

    await page.locator('button[title="Delete"]').click();
    const deleteDialog = page.getByRole("alertdialog");
    await expect(
      deleteDialog.getByRole("heading", { name: "Confirm delete" })
    ).toBeVisible();
    const deleteRequest = waitForApiRequest(
      page,
      `/api/deployments/${deployment.id}`,
      (_params, request) => request.method() === "DELETE"
    );
    await deleteDialog.getByRole("button", { name: "Delete" }).click();
    await deleteRequest;

    const createCall = requests.find(
      (request) =>
        request.method === "POST" && request.pathname === "/api/deployments/"
    );
    const updateCall = requests.find(
      (request) =>
        request.method === "PUT" &&
        request.pathname === `/api/deployments/${deployment.id}`
    );
    const renameCall = requests.find(
      (request) =>
        request.method === "PUT" &&
        request.pathname === `/api/deployments/${deployment.id}/name`
    );
    const extendCall = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === `/api/deployments/${deployment.id}/extend`
    );
    const deleteCall = requests.find(
      (request) =>
        request.method === "DELETE" &&
        request.pathname === `/api/deployments/${deployment.id}`
    );

    expect(createCall?.body).toEqual(
      expect.objectContaining({
        resource_private_name: "created-smoke-runtime",
        duration_hours: 3,
        gpus_per_container: 2,
        hardware_id: 101,
        location_ids: [17],
        container_config: expect.objectContaining({
          replica_count: 2,
          traffic_port: 8080,
          env_variables: { MODEL: "smoke" },
          secret_env_variables: {
            TOKEN: "secret",
            OLLAMA_API_KEY: expect.stringMatching(/^ionet-[a-z0-9]+$/i),
          },
        }),
        registry_config: expect.objectContaining({
          image_url: "ollama/ollama:latest",
        }),
      })
    );
    expect(updateCall?.body).toEqual(
      expect.objectContaining({
        image_url: "ghcr.io/smoke/updated:latest",
        traffic_port: 9090,
        entrypoint: ["bash", "-lc"],
        args: ["--serve", "smoke"],
        command: "echo smoke",
      })
    );
    expect(renameCall?.body).toEqual({ name: "renamed-smoke-runtime" });
    expect(extendCall?.body).toEqual({ duration_hours: 5 });
    expect(deleteCall).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("loads deployments, searches, filters, and opens read-only dialogs", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);

    await page.addInitScript((storedUser) => {
      window.localStorage.setItem("i18nextLng", "en");
      window.localStorage.setItem("user", JSON.stringify(storedUser));
      window.localStorage.setItem("uid", String(storedUser.id));
      window.localStorage.setItem("setup_required", "false");
    }, user);

    await page.goto("/models/deployments");

    await expect(page.getByRole("heading", { name: "Deployments" })).toBeVisible();
    await expect(page.getByText("smoke-container")).toBeVisible();
    await expect(page.getByText("NVIDIA A100")).toBeVisible();

    await page.getByPlaceholder("Search deployments...").fill("smoke");
    await expect(page).toHaveURL(/dFilter=smoke/);
    await expect(page.getByText("smoke-container")).toBeVisible();

    await page.getByRole("button", { name: "Status" }).click();
    await page.getByRole("option", { name: "Running" }).click();
    await expect(page).toHaveURL(/dStatus=running/);

    await page.locator('button[title="View details"]').click();
    const detailsDialog = page.getByRole("dialog");
    await expect(detailsDialog.getByRole("heading", { name: "Deployment details" })).toBeVisible();
    await expect(detailsDialog.getByText("dep-smoke-001")).toBeVisible();
    await expect(detailsDialog.getByText("container-smoke-001")).toBeVisible();
    await detailsDialog.getByRole("button", { name: "Close" }).click();

    await page.locator('button[title="View logs"]').click();
    const logsDialog = page.getByRole("dialog");
    await expect(logsDialog.getByRole("heading", { name: "Deployment logs" })).toBeVisible();
    await expect(logsDialog.getByText("smoke boot complete")).toBeVisible();
    await expect(logsDialog.getByText("smoke model ready")).toBeVisible();

    const listRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/deployments/" &&
        request.params.p === "1" &&
        request.params.page_size === "10"
    );
    const searchRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/deployments/search" &&
        request.params.keyword === "smoke"
    );
    const detailsRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === `/api/deployments/${deployment.id}`
    );
    const logsRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === `/api/deployments/${deployment.id}/logs` &&
        request.params.container_id === "container-smoke-001" &&
        request.params.stream === "stdout"
    );

    expect(listRequest).toBeTruthy();
    expect(searchRequest).toBeTruthy();
    expect(detailsRequest).toBeTruthy();
    expect(logsRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
