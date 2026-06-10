/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const CONFIRM_PHRASE = "确认开具发票";

const adminUser = {
  id: 8001,
  username: "invoices-admin-smoke",
  display_name: "Invoices Admin Smoke",
  email: "invoices-admin-smoke@example.com",
  role: 100,
  status: 1,
  group: "default",
  quota: 500000,
  used_quota: 10000,
  request_count: 24,
  permissions: {
    sidebar_settings: false,
  },
};

const eligibleRecords = [
  {
    source_type: "topup",
    source_id: 6101,
    id: 6101,
    user_id: adminUser.id,
    amount: 100000,
    money: 12.5,
    trade_no: "TRADE-TOPUP-001",
    payment_method: "stripe",
    payment_provider: "Stripe",
    create_time: 1717200000,
    complete_time: 1717203600,
    status: "success",
  },
  {
    source_type: "subscription_order",
    source_id: 6102,
    id: 6102,
    user_id: adminUser.id,
    amount: 0,
    money: 24,
    trade_no: "TRADE-SUBSCRIPTION-002",
    payment_method: "balance",
    payment_provider: "Balance",
    create_time: 1717300000,
    complete_time: 1717303600,
    status: "paid",
    plan_id: 8801,
  },
];

const baseSelfInvoices = [
  {
    id: 8101,
    user_id: adminUser.id,
    username: adminUser.username,
    invoice_type: "personal",
    profile_source: "manual",
    realname_verification_id: null,
    title: "Existing Personal",
    tax_no: "",
    email: "invoice@example.com",
    phone: "13800000000",
    amount: 18,
    currency: "USD",
    status: "pending",
    remark: "",
    reject_reason: "",
    invoice_no: "",
    invoice_url: "",
    issue_note: "",
    issued_at: 0,
    reviewed_by: 0,
    reviewed_at: 0,
    created_at: 1717400000,
    updated_at: 1717400000,
  },
];

const baseAdminInvoices = [
  {
    id: 8201,
    user_id: 9001,
    username: "pending-user",
    invoice_type: "company",
    profile_source: "manual",
    realname_verification_id: null,
    title: "Pending Corp",
    tax_no: "TAX-PENDING",
    email: "pending@example.com",
    phone: "13900000001",
    amount: 42,
    currency: "USD",
    status: "pending",
    remark: "",
    reject_reason: "",
    invoice_no: "",
    invoice_url: "",
    issue_note: "",
    issued_at: 0,
    reviewed_by: 0,
    reviewed_at: 0,
    created_at: 1717500000,
    updated_at: 1717500000,
  },
  {
    id: 8202,
    user_id: 9002,
    username: "approved-user",
    invoice_type: "company",
    profile_source: "manual",
    realname_verification_id: null,
    title: "Approved Corp",
    tax_no: "TAX-APPROVED",
    email: "approved@example.com",
    phone: "13900000002",
    amount: 64,
    currency: "USD",
    status: "approved",
    remark: "",
    reject_reason: "",
    invoice_no: "",
    invoice_url: "",
    issue_note: "",
    issued_at: 0,
    reviewed_by: 0,
    reviewed_at: 0,
    created_at: 1717600000,
    updated_at: 1717600000,
  },
  {
    id: 8203,
    user_id: 9003,
    username: "reject-user",
    invoice_type: "personal",
    profile_source: "manual",
    realname_verification_id: null,
    title: "Reject Me",
    tax_no: "",
    email: "reject@example.com",
    phone: "13900000003",
    amount: 15,
    currency: "USD",
    status: "pending",
    remark: "",
    reject_reason: "",
    invoice_no: "",
    invoice_url: "",
    issue_note: "",
    issued_at: 0,
    reviewed_by: 0,
    reviewed_at: 0,
    created_at: 1717700000,
    updated_at: 1717700000,
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseJsonBody(request) {
  const body = request.postData();
  return body ? JSON.parse(body) : undefined;
}

function pageResponse(items, params, defaultPageSize) {
  const page = Number(params.p || 1);
  const pageSize = Number(params.page_size || defaultPageSize);
  const start = (page - 1) * pageSize;
  return {
    success: true,
    data: {
      items: clone(items.slice(start, start + pageSize)),
      total: items.length,
      page,
      page_size: pageSize,
    },
  };
}

async function mockApi(page) {
  const requests = [];
  const unhandled = [];
  const selfInvoices = clone(baseSelfInvoices);
  const adminInvoices = clone(baseAdminInvoices);
  let nextInvoiceId = 8300;

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
          system_name: "new-api invoices smoke",
          display_in_currency: true,
          quota_display_type: "TOKENS",
          quota_per_unit: 1,
          realname_provider: "mockpay",
          realname_providers: ["mockpay"],
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/user/self") {
      await fulfill({ success: true, data: adminUser });
      return;
    }

    if (method === "GET" && url.pathname === "/api/invoice/eligible-records") {
      await fulfill(pageResponse(eligibleRecords, params, 50));
      return;
    }

    if (method === "GET" && url.pathname === "/api/invoice/profile") {
      await fulfill({
        success: true,
        data: {
          personal: {
            id: 5001,
            user_id: adminUser.id,
            invoice_type: "personal",
            source: "manual",
            realname_verification_id: null,
            title: "Smoke Personal",
            tax_no: "",
            email: "invoice-smoke@example.com",
            phone: "13800000000",
            bank_name: "",
            bank_account: "",
            registered_address: "",
            registered_phone: "",
            is_default: true,
            created_at: 1717000000,
            updated_at: 1717000000,
          },
          company: {
            id: 5002,
            user_id: adminUser.id,
            invoice_type: "company",
            source: "manual",
            realname_verification_id: null,
            title: "Smoke Corp",
            tax_no: "TAX-SMOKE",
            email: "corp-smoke@example.com",
            phone: "13800000001",
            bank_name: "Smoke Bank",
            bank_account: "6222000000000000",
            registered_address: "Smoke Road",
            registered_phone: "010-10000000",
            is_default: true,
            created_at: 1717000000,
            updated_at: 1717000000,
          },
        },
      });
      return;
    }

    if (method === "PUT" && url.pathname === "/api/invoice/profile") {
      await fulfill({ success: true, data: body, message: "saved" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/realname/status") {
      await fulfill({
        success: true,
        data: {
          realname_provider: "mockpay",
          realname_providers: ["mockpay"],
          personal: null,
          company: null,
        },
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/realname/session") {
      await fulfill({
        success: true,
        data: {
          verification: {
            id: 7001,
            user_id: adminUser.id,
            verify_type: body.verify_type,
            provider: body.provider,
            provider_request_id: "verify-7001",
            status: "pending",
            verified_name: "",
            company_name: "",
            id_no_masked: "",
            credit_code: "",
            legal_person_name_masked: "",
            provider_result_code: "",
            provider_result_message: "",
            started_at: 1717800000,
            verified_at: 0,
            expired_at: 0,
            created_at: 1717800000,
            updated_at: 1717800000,
          },
          session: {
            provider: body.provider,
            provider_request_id: "verify-7001",
            redirect_url: "https://example.com/verify",
            qr_code_url: "",
          },
        },
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/invoice/self") {
      await fulfill(pageResponse(selfInvoices, params, 20));
      return;
    }

    if (method === "POST" && url.pathname === "/api/invoice") {
      const created = {
        id: nextInvoiceId++,
        user_id: adminUser.id,
        username: adminUser.username,
        invoice_type: body.invoice_type,
        profile_source: "manual",
        realname_verification_id: null,
        title: body.title,
        tax_no: body.tax_no || "",
        email: body.email || "",
        phone: body.phone || "",
        amount: 12.5,
        currency: "USD",
        status: "pending",
        remark: body.remark || "",
        reject_reason: "",
        invoice_no: "",
        invoice_url: "",
        issue_note: "",
        issued_at: 0,
        reviewed_by: 0,
        reviewed_at: 0,
        created_at: 1717900000,
        updated_at: 1717900000,
      };
      selfInvoices.unshift(created);
      await fulfill({ success: true, data: clone(created), message: "created" });
      return;
    }

    const cancelMatch = url.pathname.match(/^\/api\/invoice\/(\d+)\/cancel$/);
    if (cancelMatch && method === "POST") {
      const id = Number(cancelMatch[1]);
      const invoice = selfInvoices.find((item) => item.id === id);
      if (invoice) invoice.status = "cancelled";
      await fulfill({ success: true, message: "cancelled" });
      return;
    }

    if (method === "GET" && url.pathname === "/api/invoice/admin") {
      await fulfill(pageResponse(adminInvoices, params, 20));
      return;
    }

    const approveMatch = url.pathname.match(/^\/api\/invoice\/admin\/(\d+)\/approve$/);
    if (approveMatch && method === "POST") {
      const id = Number(approveMatch[1]);
      const invoice = adminInvoices.find((item) => item.id === id);
      if (invoice) {
        invoice.status = "approved";
        invoice.reviewed_by = adminUser.id;
        invoice.reviewed_at = 1718000000;
      }
      await fulfill({ success: true, message: "approved" });
      return;
    }

    const rejectMatch = url.pathname.match(/^\/api\/invoice\/admin\/(\d+)\/reject$/);
    if (rejectMatch && method === "POST") {
      const id = Number(rejectMatch[1]);
      const invoice = adminInvoices.find((item) => item.id === id);
      if (invoice) {
        invoice.status = "rejected";
        invoice.reject_reason = body.reject_reason;
        invoice.reviewed_by = adminUser.id;
        invoice.reviewed_at = 1718000000;
      }
      await fulfill({ success: true, message: "rejected" });
      return;
    }

    const issueMatch = url.pathname.match(/^\/api\/invoice\/admin\/(\d+)\/issue$/);
    if (issueMatch && method === "POST") {
      const id = Number(issueMatch[1]);
      const invoice = adminInvoices.find((item) => item.id === id);
      if (invoice) {
        invoice.status = "issued";
        invoice.invoice_no = body.invoice_no;
        invoice.invoice_url = body.invoice_url || "";
        invoice.issue_note = body.issue_note || "";
        invoice.issued_at = 1718100000;
      }
      await fulfill({ success: true, message: "issued" });
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

function rowByText(page, rowText) {
  return page.getByRole("row", { name: new RegExp(rowText) });
}

function verificationPanel(page, title) {
  return page
    .locator(
      "div.flex.flex-wrap.items-center.justify-between.gap-3.rounded-lg.border.p-4"
    )
    .filter({ has: page.getByText(title, { exact: true }) })
    .filter({
      has: page.getByRole("button", { name: "Start verification" }),
    })
    .first();
}

test.describe("invoices runtime surface", () => {
  test("creates real-name verification session with provider redirect", async ({
    page,
  }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/invoices");
    await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();

    await page.getByRole("tab", { name: "Invoice profiles" }).click();
    const personalPanel = verificationPanel(page, "Personal verification");
    await expect(personalPanel).toBeVisible();
    await expect(personalPanel.getByText("Unverified")).toBeVisible();

    const popupPromise = page.waitForEvent("popup");
    await personalPanel
      .getByRole("button", { name: "Start verification" })
      .click();
    const popup = await popupPromise;
    await expect(page.getByText("Verification session created")).toBeVisible();
    expect(popup.url()).toBe("https://example.com/verify");
    await popup.close();

    const sessionRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/realname/session"
    );
    expect(sessionRequest).toBeTruthy();
    expect(sessionRequest.body).toMatchObject({
      verify_type: "personal",
      provider: "mockpay",
    });
    expect(unhandled).toEqual([]);
  });

  test("submits a user invoice request and exercises admin review actions", async ({ page }) => {
    const { requests, unhandled } = await mockApi(page);
    await authenticate(page);

    await page.goto("/invoices");
    await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();
    await expect(page.getByText("TRADE-TOPUP-001")).toBeVisible();

    await page.getByRole("checkbox", { name: "Select order" }).first().check();
    await expect(page.getByText("Selected records: 1")).toBeVisible();

    const submitButton = page.getByRole("button", {
      name: "Submit invoice request",
    });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    await expect(
      page.getByRole("heading", { name: "Confirm invoice issuance" })
    ).toBeVisible();
    await page.getByPlaceholder(CONFIRM_PHRASE).fill(CONFIRM_PHRASE);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Submit invoice request" })
      .click();
    await expect(page.getByText("Invoice request submitted")).toBeVisible();
    await expect(rowByText(page, "Smoke Personal")).toBeVisible();

    const createRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/invoice" &&
        request.body?.title === "Smoke Personal"
    );
    expect(createRequest).toBeTruthy();
    expect(createRequest.body).toMatchObject({
      invoice_type: "personal",
      title: "Smoke Personal",
      email: "invoice-smoke@example.com",
      phone: "13800000000",
      items: [{ source_type: "topup", source_id: 6101 }],
    });

    await page.getByRole("tab", { name: "Admin review" }).click();
    await expect(rowByText(page, "Pending Corp")).toBeVisible();
    await expect(rowByText(page, "Approved Corp")).toBeVisible();
    await expect(rowByText(page, "Reject Me")).toBeVisible();

    await rowByText(page, "Pending Corp").locator('button[title="Approve"]').click();
    await expect(page.getByRole("heading", { name: "Approve invoice request" })).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Approve" })
      .click();
    await expect(page.getByText("Invoice request approved")).toBeVisible();

    const approveRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/invoice/admin/8201/approve"
    );
    expect(approveRequest).toBeTruthy();

    await rowByText(page, "Reject Me").locator('button[title="Reject"]').click();
    await expect(page.getByRole("heading", { name: "Reject invoice request" })).toBeVisible();
    await page.getByPlaceholder("Reject reason").fill("Missing invoice profile details");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Reject" })
      .click();
    await expect(page.getByText("Invoice request rejected")).toBeVisible();

    const rejectRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/invoice/admin/8203/reject" &&
        request.body?.reject_reason === "Missing invoice profile details"
    );
    expect(rejectRequest).toBeTruthy();

    await rowByText(page, "Approved Corp")
      .locator('button[title="Mark as issued"]')
      .click();
    await expect(page.getByRole("heading", { name: "Mark invoice as issued" })).toBeVisible();
    await page.getByPlaceholder("Invoice number").fill("INV-2026-0001");
    await page.getByPlaceholder("Invoice URL").fill("https://example.com/invoices/INV-2026-0001.pdf");
    await page.getByPlaceholder("Issue note").fill("Issued during smoke test");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Mark as issued" })
      .click();
    await expect(page.getByText("Invoice marked as issued")).toBeVisible();

    const issueRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.pathname === "/api/invoice/admin/8202/issue" &&
        request.body?.invoice_no === "INV-2026-0001"
    );
    expect(issueRequest).toBeTruthy();
    expect(issueRequest.body).toMatchObject({
      invoice_url: "https://example.com/invoices/INV-2026-0001.pdf",
      issue_note: "Issued during smoke test",
    });

    expect(unhandled).toEqual([]);
  });
});
