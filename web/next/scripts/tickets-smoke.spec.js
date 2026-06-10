/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const normalUser = {
  id: 6101,
  username: "ticket-user-smoke",
  display_name: "Ticket User Smoke",
  email: "ticket-user-smoke@example.com",
  role: 1,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 100000,
  request_count: 12,
  permissions: { sidebar_settings: false },
};

const adminUser = {
  ...normalUser,
  id: 6102,
  username: "ticket-admin-smoke",
  display_name: "Ticket Admin Smoke",
  email: "ticket-admin-smoke@example.com",
  role: 10,
};

const categories = [
  { value: "billing", label: "Billing Help" },
  { value: "technical", label: "Technical Support" },
];

const userTickets = [
  {
    id: 7101,
    user_id: normalUser.id,
    title: "Smoke billing question",
    category: "billing",
    priority: 2,
    status: 1,
    description: "Original billing description",
    attachment_urls: "",
    created_at: 1717200000,
    updated_at: 1717200000,
    closed_at: 0,
    assigned_admin_id: 0,
  },
  {
    id: 7102,
    user_id: normalUser.id,
    title: "Smoke technical issue",
    category: "technical",
    priority: 3,
    status: 3,
    description: "Original technical description",
    attachment_urls: "",
    created_at: 1717300000,
    updated_at: 1717300000,
    closed_at: 0,
    assigned_admin_id: 0,
  },
];

const adminTickets = [
  {
    id: 7201,
    user_id: normalUser.id,
    title: "Admin smoke escalation",
    category: "technical",
    priority: 3,
    status: 1,
    description: "Escalated technical description",
    attachment_urls: "",
    created_at: 1717400000,
    updated_at: 1717400000,
    closed_at: 0,
    assigned_admin_id: 0,
  },
  {
    id: 7202,
    user_id: normalUser.id,
    title: "Admin smoke billing",
    category: "billing",
    priority: 1,
    status: 2,
    description: "Admin billing description",
    attachment_urls: "",
    created_at: 1717500000,
    updated_at: 1717500000,
    closed_at: 0,
    assigned_admin_id: 888,
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseJsonBody(request) {
  const body = request.postData();
  return body ? JSON.parse(body) : undefined;
}

function responseForTickets(items) {
  return {
    success: true,
    data: {
      items: clone(items),
      total: items.length,
    },
  };
}

function filterTickets(items, params) {
  let output = [...items];
  if (params.status) {
    output = output.filter((ticket) => String(ticket.status) === params.status);
  }
  if (params.priority) {
    output = output.filter((ticket) => String(ticket.priority) === params.priority);
  }
  if (params.category) {
    output = output.filter((ticket) => ticket.category === params.category);
  }
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    output = output.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(keyword) ||
        ticket.description.toLowerCase().includes(keyword)
    );
  }
  return output;
}

function detailFor(ticket, isAdmin) {
  return {
    success: true,
    data: {
      ticket: clone(ticket),
      messages: [
        {
          id: ticket.id * 10,
          ticket_id: ticket.id,
          user_id: ticket.user_id,
          is_admin: false,
          content: `User message for ${ticket.title}`,
          attachment_urls: "",
          created_at: ticket.created_at + 60,
        },
        {
          id: ticket.id * 10 + 1,
          ticket_id: ticket.id,
          user_id: adminUser.id,
          is_admin: true,
          content: `Admin reply for ${ticket.title}`,
          attachment_urls: "",
          created_at: ticket.created_at + 120,
        },
      ],
      user_context: isAdmin
        ? {
            username: normalUser.username,
            email: normalUser.email,
            quota: normalUser.quota,
            used_quota: normalUser.used_quota,
            request_count: normalUser.request_count,
          }
        : undefined,
    },
  };
}

async function mockApi(page) {
  const requests = [];
  const unhandled = [];
  const mutableAdminTickets = clone(adminTickets);
  const mutableUserTickets = clone(userTickets);

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
          system_name: "new-api tickets smoke",
          display_in_currency: false,
          quota_display_type: "TOKENS",
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      const rawUid = request.headers()["new-api-user"];
      const currentUser = rawUid === String(adminUser.id) ? adminUser : normalUser;
      await fulfill({ success: true, data: currentUser });
      return;
    }

    if (method === "GET" && url.pathname === "/api/ticket/categories") {
      await fulfill({ success: true, data: clone(categories) });
      return;
    }

    if (method === "GET" && url.pathname === "/api/ticket/self") {
      await fulfill(responseForTickets(filterTickets(mutableUserTickets, params)));
      return;
    }

    if (method === "GET" && url.pathname === "/api/ticket/self/search") {
      await fulfill(responseForTickets(filterTickets(mutableUserTickets, params)));
      return;
    }

    if (method === "GET" && url.pathname === "/api/ticket/") {
      await fulfill(responseForTickets(filterTickets(mutableAdminTickets, params)));
      return;
    }

    if (method === "GET" && url.pathname === "/api/ticket/search") {
      await fulfill(responseForTickets(filterTickets(mutableAdminTickets, params)));
      return;
    }

    const messageMatch = url.pathname.match(/^\/api\/ticket\/(\d+)\/message$/);
    if (messageMatch && method === "POST") {
      await fulfill({ success: true, message: "sent" });
      return;
    }

    const assignMatch = url.pathname.match(/^\/api\/ticket\/(\d+)\/assign$/);
    if (assignMatch && method === "PUT") {
      const id = Number(assignMatch[1]);
      const ticket = mutableAdminTickets.find((item) => item.id === id);
      if (ticket) ticket.assigned_admin_id = body.admin_id;
      await fulfill({ success: true, message: "assigned" });
      return;
    }

    const detailMatch = url.pathname.match(/^\/api\/ticket\/(\d+)$/);
    if (detailMatch && method === "GET") {
      const id = Number(detailMatch[1]);
      const adminTicket = mutableAdminTickets.find((item) => item.id === id);
      const userTicket = mutableUserTickets.find((item) => item.id === id);
      const ticket = adminTicket || userTicket;
      await fulfill(
        ticket
          ? detailFor(ticket, !!adminTicket)
          : { success: false, message: "not found" },
        ticket ? 200 : 404
      );
      return;
    }

    unhandled.push(`${method} ${url.pathname}`);
    await fulfill({ success: false, message: `Unhandled ${method} ${url.pathname}` }, 404);
  });

  return { requests, unhandled };
}

async function authenticate(page, storedUser) {
  await page.addInitScript((user) => {
    window.localStorage.setItem("i18nextLng", "en");
    window.localStorage.setItem("user", JSON.stringify(user));
    window.localStorage.setItem("uid", String(user.id));
    window.localStorage.setItem("setup_required", "false");
  }, storedUser);
}

async function openRowMenu(page, rowText) {
  const row = page.getByRole("row", { name: new RegExp(rowText) });
  await expect(row).toBeVisible();
  await row.getByRole("button").last().click();
}

test.describe("tickets runtime surface", () => {
  test("rejects common users from legacy admin ticket list before ticket APIs mount", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page, normalUser);

    await page.goto("/console/tickets");

    await expect(page).toHaveURL(/\/403$/);
    await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
    expect(
      requests.some((request) => request.pathname.startsWith("/api/ticket"))
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });

  test("rejects common users from legacy admin ticket detail before ticket APIs mount", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page, normalUser);

    await page.goto("/console/ticket/7201");

    await expect(page).toHaveURL(/\/403$/);
    await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
    expect(
      requests.some((request) => request.pathname.startsWith("/api/ticket"))
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });

  test("opens admin ticket management from the legacy console list route", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page, adminUser);

    await page.goto("/console/tickets");

    await expect(page).toHaveURL(/\/tickets\?legacy_admin=1$/);
    await expect(page.getByRole("heading", { name: "Ticket Management" })).toBeVisible();
    await expect(page.getByText("Admin smoke escalation")).toBeVisible();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" && request.pathname === "/api/ticket/"
      )
    ).toBeTruthy();
    expect(
      requests.some(
        (request) =>
          request.method === "GET" &&
          request.pathname === "/api/ticket/self"
      )
    ).toBeFalsy();
    expect(unhandled).toEqual([]);
  });

  test("opens admin ticket detail from the legacy console detail route", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page, adminUser);

    await page.goto("/console/ticket/7201");

    await expect(page).toHaveURL(/\/tickets\/7201\?legacy_admin=1$/);
    await expect(page.getByRole("heading", { name: /#7201 Admin smoke escalation/ })).toBeVisible();
    await expect(page.getByText("User Info")).toBeVisible();
    await expect(page.getByText("ticket-user-smoke@example.com")).toBeVisible();
    expect(
      requests.some(
        (request) => request.method === "GET" && request.pathname === "/api/ticket/7201"
      )
    ).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("searches user tickets, opens detail, and sends a reply", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page, normalUser);

    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
    await expect(page.getByText("Smoke billing question")).toBeVisible();
    await expect(page.getByText("Billing Help")).toBeVisible();

    await page.getByPlaceholder("Search tickets").fill("technical");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("Smoke technical issue")).toBeVisible();
    await expect(page.getByText("Technical Support")).toBeVisible();
    await expect(page.getByText("Smoke billing question")).toBeHidden();

    await page.goto("/tickets");
    await expect(page.getByText("Smoke billing question")).toBeVisible();
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Pending" }).click();
    await page.getByPlaceholder("Search tickets").fill("Smoke");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("Smoke billing question")).toBeVisible();
    await expect(page.getByText("Smoke technical issue")).toBeHidden();

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText("Smoke technical issue")).toBeVisible();

    await page.getByRole("row", { name: /Smoke technical issue/ }).click();
    await page.waitForURL(/\/tickets\/7102$/);
    await expect(page.getByRole("heading", { name: /#7102 Smoke technical issue/ })).toBeVisible();
    await expect(page.getByText("Original technical description")).toBeVisible();
    await expect(page.getByText("Admin reply for Smoke technical issue")).toBeVisible();

    await page.getByPlaceholder("Type your reply").fill("Smoke user reply");
    const replyForm = page.locator("form").filter({
      has: page.getByPlaceholder("Type your reply"),
    });
    await replyForm.getByRole("button").first().click();
    await expect(page.getByText("Reply sent successfully")).toBeVisible();

    const searchRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/ticket/self/search" &&
        request.params.keyword === "technical"
    );
    const statusSearchRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/ticket/self/search" &&
        request.params.keyword === "Smoke" &&
        request.params.status === "1"
    );
    const detailRequest = requests.find(
      (request) => request.method === "GET" && request.pathname === "/api/ticket/7102"
    );
    const replyRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/ticket/7102/message" &&
        request.body?.content === "Smoke user reply"
    );

    expect(searchRequest).toBeTruthy();
    expect(statusSearchRequest).toBeTruthy();
    expect(detailRequest).toBeTruthy();
    expect(replyRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });

  test("filters admin tickets, assigns to self, and opens admin detail", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page, adminUser);

    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: "Ticket Management" })).toBeVisible();
    await expect(page.getByText("Admin smoke escalation")).toBeVisible();
    await expect(page.getByText("Technical Support")).toBeVisible();

    await page.getByPlaceholder("Search tickets").fill("billing");
    await expect(page.getByText("Admin smoke billing")).toBeVisible();
    await expect(page.getByText("Admin smoke escalation")).toBeHidden();

    await page.getByPlaceholder("Search tickets").fill("");
    await expect(page.getByText("Admin smoke escalation")).toBeVisible();

    await page.getByRole("combobox").nth(2).click();
    await page.getByRole("option", { name: "Technical Support" }).click();
    await expect(page.getByText("Admin smoke escalation")).toBeVisible();
    await expect(page.getByText("Admin smoke billing")).toBeHidden();

    await openRowMenu(page, "Admin smoke escalation");
    await page.getByRole("menuitem", { name: "Assign to me" }).click();
    await expect(page.getByText("Ticket assigned successfully")).toBeVisible();

    await page.getByText("Admin smoke escalation").click();
    await page.waitForURL(/\/tickets\/7201$/);
    await expect(page.getByRole("heading", { name: /#7201 Admin smoke escalation/ })).toBeVisible();
    await expect(page.getByText("User Info")).toBeVisible();
    await expect(page.getByText("ticket-user-smoke@example.com")).toBeVisible();
    await expect(page.getByText("Escalated technical description")).toBeVisible();

    const categoryRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/ticket/" &&
        request.params.category === "technical"
    );
    const searchRequest = requests.find(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/ticket/search" &&
        request.params.keyword === "billing"
    );
    const assignRequest = requests.find(
      (request) =>
        request.method === "PUT" &&
        request.pathname === "/api/ticket/7201/assign" &&
        request.body?.admin_id === adminUser.id
    );
    const detailRequest = requests.find(
      (request) => request.method === "GET" && request.pathname === "/api/ticket/7201"
    );

    expect(categoryRequest).toBeTruthy();
    expect(searchRequest).toBeTruthy();
    expect(assignRequest).toBeTruthy();
    expect(detailRequest).toBeTruthy();
    expect(unhandled).toEqual([]);
  });
});
