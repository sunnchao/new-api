/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const user = {
  id: 9370,
  username: "playground-smoke-user",
  display_name: "Playground Smoke User",
  email: "playground-smoke@example.com",
  role: 1,
  status: 1,
  group: "default",
  quota: 250000,
  used_quota: 0,
  request_count: 0,
  permissions: {
    sidebar_settings: false,
  },
  setting: JSON.stringify({ language: "en" }),
};

function buildChatChunk(delta, finishReason = null) {
  return {
    id: "chatcmpl-playground-smoke",
    object: "chat.completion.chunk",
    created: 1760000000,
    model: "gpt-smoke",
    choices: [
      {
        index: 0,
        delta,
        finish_reason: finishReason,
      },
    ],
  };
}

function encodeSse(messages) {
  return messages.map((message) => `data: ${message}\n\n`).join("");
}

async function mockApi(page) {
  const requests = [];
  const chatRequests = [];
  const unhandled = [];

  const fulfillJson = (route, body, status = 200) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });

  await page.route("**/api/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    requests.push({ method, pathname: url.pathname });

    if (method === "GET" && url.pathname === "/api/setup") {
      await fulfillJson(route, { success: true, data: { required: false } });
      return;
    }

    if (method === "GET" && url.pathname === "/api/status") {
      await fulfillJson(route, {
        success: true,
        data: {
          system_name: "new-api playground smoke",
          server_address: "https://gateway.example.com",
          display_in_currency: false,
          quota_display_type: "TOKENS",
          quota_per_unit: 500000,
          usd_exchange_rate: 1,
          custom_currency_symbol: "$",
          custom_currency_exchange_rate: 1,
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfillJson(route, { success: true, data: user });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/models") {
      await fulfillJson(route, {
        success: true,
        data: ["gpt-smoke", "gpt-hidden"],
        model_groups: {
          "gpt-smoke": ["default"],
          "gpt-hidden": ["pro"],
        },
        auto_groups: ["default"],
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self/groups") {
      await fulfillJson(route, {
        success: true,
        data: {
          default: { desc: "Default smoke group", ratio: 1 },
          pro: { desc: "Pro smoke group", ratio: 2 },
        },
      });
      return;
    }

    unhandled.push(`${method} ${url.pathname}`);
    await fulfillJson(
      route,
      { success: false, message: `Unhandled ${method} ${url.pathname}` },
      404
    );
  });

  await page.route("**/pg/**", async (route, request) => {
    const url = new URL(request.url());
    const method = request.method();
    requests.push({ method, pathname: url.pathname });

    if (method === "POST" && url.pathname === "/pg/chat/completions") {
      const body = request.postDataJSON();
      chatRequests.push(body);
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: {
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
        body: encodeSse([
          JSON.stringify(
            buildChatChunk({ reasoning_content: "Smoke reasoning" })
          ),
          JSON.stringify(buildChatChunk({ content: "Smoke response" })),
          "[DONE]",
        ]),
      });
      return;
    }

    unhandled.push(`${method} ${url.pathname}`);
    await fulfillJson(
      route,
      { success: false, message: `Unhandled ${method} ${url.pathname}` },
      404
    );
  });

  return { requests, chatRequests, unhandled };
}

async function seedAuthenticatedPlayground(page) {
  await page.addInitScript((storedUser) => {
    window.localStorage.setItem("i18nextLng", "en");
    window.localStorage.setItem("user", JSON.stringify(storedUser));
    window.localStorage.setItem("uid", String(storedUser.id));
    window.localStorage.setItem("setup_required", "false");
    window.localStorage.removeItem("playground_config");
    window.localStorage.removeItem("playground_messages");
    window.localStorage.removeItem("playground_parameter_enabled");
  }, user);
}

test.describe("playground production smoke", () => {
  test("streams a chat completion from the playground", async ({ page }) => {
    const { requests, chatRequests, unhandled } = await mockApi(page);
    await seedAuthenticatedPlayground(page);

    await page.goto("/playground");

    const promptInput = page.getByPlaceholder("Ask anything");
    await expect(promptInput).toBeVisible();

    await expect(page.getByText("gpt-smoke").first()).toBeVisible();
    await promptInput.fill("Hello from the playground smoke");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByText("Smoke response")).toBeVisible();

    expect(chatRequests).toHaveLength(1);
    expect(chatRequests[0]).toMatchObject({
      model: "gpt-smoke",
      group: "default",
      stream: true,
      temperature: 0.7,
    });
    expect(chatRequests[0].messages).toEqual([
      {
        role: "user",
        content: "Hello from the playground smoke",
      },
    ]);
    expect(
      requests.some(
        (request) =>
          request.method === "GET" && request.pathname === "/api/user/models"
      )
    ).toBeTruthy();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/user/self/groups"
      )
    ).toBeTruthy();
    expect(
      requests.some(
        (request) =>
          request.method === "POST" &&
          request.pathname === "/pg/chat/completions"
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
