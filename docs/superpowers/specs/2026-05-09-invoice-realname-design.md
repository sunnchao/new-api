# Invoice Application and Real-Name Verification Design

**Date:** 2026-05-09
**Topic:** Add invoice application, invoice profile, and personal/company real-name verification

## Overview

Add an invoice application feature for successful online top-up records, plus personal and company real-name verification to help users maintain reliable invoice information.

The invoice feature must not modify the existing top-up business path. It reads eligible `top_ups` records when the invoice page opens, lets users select one or more records, calculates the combined invoice amount, and stores invoice request state in new invoice tables.

The real-name feature is a separate domain that can feed verified identity or company information into invoice profiles. Invoice requests store a snapshot of the invoice profile at submit time so later profile changes do not rewrite historical requests.

## Goals

1. Let users apply for invoices from successful online top-up records.
2. Let users select multiple top-up records and submit one combined invoice request.
3. Require a second confirmation before invoice submission by typing `确认开具发票`.
4. Support both personal and company invoice profiles.
5. Support both personal and company real-name verification.
6. Give admins a review workflow for approving, rejecting, and marking invoices as issued.
7. Keep invoice state, invoice item ownership, and duplicate prevention in new invoice tables.
8. Preserve current top-up behavior and schema.

## Non-Goals

1. Do not modify the `top_ups` table schema.
2. Do not modify existing top-up creation, payment callback, manual completion, or billing history logic.
3. Do not issue official tax invoices through a tax bureau integration in the first version.
4. Do not include subscription payments, balance payments, redemption codes, manual top-up completion, or quota consumption in the invoiceable scope.
5. Do not expose full identity document numbers or raw provider verification payloads to frontend users or admins.

## Product Scope

### Invoice Application

Users can open the invoice page and see invoiceable online top-up records. They can select multiple records, fill or confirm invoice information, and submit one invoice request for the combined amount.

Eligible records are queried from `top_ups` at page load and must be filtered by the invoice domain. The existing top-up module remains read-only from the invoice feature's perspective.

### Real-Name Verification

Users can verify either:

- `personal`: personal real-name verification
- `company`: company real-name or company qualification verification

Both verification types can coexist for the same user. A personal invoice can use personal verification data. A company invoice can use company verification data.

### Invoice Profiles

Invoice profiles store reusable invoice information for the user. A profile can be manual or verified:

- `manual`: user-entered information, not backed by a successful verification
- `verified`: information created or updated from a successful real-name verification

The invoice submit flow stores invoice profile fields as a snapshot on the invoice request.

## User Experience

### User Invoice Page

Route: `/invoices`

Recommended page sections:

1. Invoice profile and verification status
2. Eligible top-up selector
3. Selected amount summary
4. Invoice request form
5. User invoice request history

The page should be practical and dense. It is a console workflow, not a landing page.

### Selecting Top-Up Records

When the page opens:

1. Frontend calls `GET /api/invoice/eligible-topups`.
2. Backend reads eligible `top_ups` records for the current user.
3. Backend excludes records already present in `invoice_request_items`.
4. Frontend renders a selectable table or mobile card list.
5. User can select one or more records.
6. Frontend calculates the displayed total from selected `money` values.

The displayed total is only for UX. The backend recalculates the total during `POST /api/invoice`.

### Submit Confirmation

When the user clicks submit:

1. Open a second confirmation dialog.
2. Show selected order count, order number summary, invoice title, invoice type, and total amount.
3. Require the user to type exactly `确认开具发票`.
4. Disable the final submit button until the phrase matches exactly.
5. Submit only after the phrase matches.

The confirmation phrase is part of frontend UX. Backend still validates all submitted top-up IDs and invoice fields.

### Admin Invoice Page

Admins can review all invoice requests. Recommended admin placement:

- Same `/invoices` route with an admin-only tab, or
- A separate `/invoice-management` route under the Admin sidebar group.

Recommended first version: same feature module, role-gated admin tab. This keeps user and admin invoice logic close while avoiding a separate workspace.

Admin actions:

- Approve a pending request
- Reject a pending request with a reason
- Mark an approved request as issued
- Add invoice number, invoice URL, issued time, and issue note

## Invoiceable Top-Up Rules

The invoice feature must query `top_ups` as a read-only source.

A `top_ups` record is invoiceable only when all conditions are true:

- `user_id` equals the current user
- `status = 'success'`
- `amount > 0`
- `money > 0`
- `payment_provider` is one of:
  - `epay`
  - `stripe`
  - `creem`
  - `waffo`
  - `waffo_pancake`
- The top-up ID is not already used by any row in `invoice_request_items`

Records are not invoiceable when they are:

- Pending, failed, or expired
- Subscription payment backfill records with `amount = 0`
- Balance payments
- Redemption-code top-ups
- Manual-only invoice entries
- Any record already linked to an invoice request item

## Data Model

### `InvoiceRequest`

Purpose: one invoice request submitted by a user.

Suggested fields:

- `id`
- `user_id`
- `username`
- `invoice_type`: `personal` or `company`
- `profile_source`: `manual` or `verified`
- `realname_verification_id`: optional
- `title`
- `tax_no`
- `email`
- `phone`
- `amount`
- `currency`
- `status`: `pending`, `approved`, `rejected`, `issued`, `cancelled`
- `remark`
- `reject_reason`
- `invoice_no`
- `invoice_url`
- `issue_note`
- `issued_at`
- `reviewed_by`
- `reviewed_at`
- `created_at`
- `updated_at`

Notes:

- `amount` should store the sum of selected top-up `money` values.
- Use the existing top-up money style: `float64` with `gorm:"type:decimal(10,2);default:0"` for invoice money fields.
- Company invoice requests require `tax_no`.
- Personal invoice requests do not require `tax_no`.

### `InvoiceRequestItem`

Purpose: immutable snapshot of a selected top-up record.

Suggested fields:

- `id`
- `invoice_request_id`
- `topup_id`
- `trade_no`
- `money`
- `payment_provider`
- `payment_method`
- `topup_create_time`
- `topup_complete_time`
- `created_at`

Constraints:

- Add a unique index on `topup_id`.
- This prevents duplicate invoice requests for the same top-up without changing `top_ups`.

First-version rule:

- Rejected or cancelled invoice requests do not release their top-up items for a new request.
- Admins should correct or continue processing the existing request instead.
- A future version can add release semantics if there is a clear product need.

### `UserRealNameVerification`

Purpose: store personal or company real-name verification state.

Suggested fields:

- `id`
- `user_id`
- `verify_type`: `personal` or `company`
- `provider`
- `provider_request_id`
- `status`: `unverified`, `pending`, `verified`, `failed`, `expired`
- `verified_name`
- `company_name`
- `id_no_masked`
- `id_no_hash`
- `credit_code`
- `credit_code_hash`
- `legal_person_name_masked`
- `provider_result_code`
- `provider_result_message`
- `raw_payload_encrypted`
- `started_at`
- `verified_at`
- `expired_at`
- `created_at`
- `updated_at`

Sensitive-data rules:

- Never store full identity document numbers in plain text.
- Store masked values for display.
- Store hashes for duplicate/risk checks.
- Encrypt raw provider payloads if retention is required.
- Do not return raw provider payloads through API responses.

### `UserInvoiceProfile`

Purpose: reusable invoice information for a user and invoice type.

Suggested fields:

- `id`
- `user_id`
- `invoice_type`: `personal` or `company`
- `source`: `manual` or `verified`
- `realname_verification_id`: optional
- `title`
- `tax_no`
- `email`
- `phone`
- `bank_name`
- `bank_account`
- `registered_address`
- `registered_phone`
- `is_default`
- `created_at`
- `updated_at`

Profile rules:

- A user can have one default profile per invoice type.
- Verification success can create or update the matching profile.
- Manual edits should not modify the verification record.
- Invoice requests copy profile fields into `InvoiceRequest` at submit time.

## Backend API

### User Invoice APIs

All routes require `UserAuth`.

`GET /api/invoice/eligible-topups`

Query:

- `p`
- `page_size`
- `keyword`

Returns paginated eligible `top_ups` records with only invoice-safe fields:

- `id`
- `trade_no`
- `money`
- `amount`
- `payment_provider`
- `payment_method`
- `create_time`
- `complete_time`

`GET /api/invoice/self`

Query:

- `p`
- `page_size`
- `status`

Returns the current user's invoice requests.

`GET /api/invoice/:id`

Returns one invoice request with items. Users can only read their own request.

`POST /api/invoice`

Request:

- `topup_ids`: array of integer IDs
- `invoice_type`
- `title`
- `tax_no`
- `email`
- `phone`
- `remark`

Validation:

- `topup_ids` must be non-empty.
- Maximum selected item count: 50.
- All top-up IDs must belong to the current user.
- All selected top-ups must satisfy invoiceable rules.
- None of the selected top-ups may exist in `invoice_request_items`.
- `invoice_type` must be `personal` or `company`.
- `title` must be non-empty.
- Company requests require `tax_no`.
- Email must be syntactically valid enough for product use.
- The backend must recalculate `amount`.
- The backend should load the current default invoice profile for `invoice_type` when present and store the submitted fields as a request snapshot.
- Create request and items inside one transaction.

`POST /api/invoice/:id/cancel`

Optional first-version endpoint. Only `pending` requests can be cancelled by the owner. Cancellation does not release top-up items in the first version.

### Admin Invoice APIs

All routes require `AdminAuth`.

`GET /api/invoice/admin`

Query:

- `p`
- `page_size`
- `status`
- `keyword`

Search keyword can match:

- invoice ID
- username
- title
- tax number
- trade number

`GET /api/invoice/admin/:id`

Returns any invoice request with items.

`POST /api/invoice/admin/:id/approve`

Allowed transition:

- `pending` -> `approved`

`POST /api/invoice/admin/:id/reject`

Request:

- `reject_reason`

Allowed transition:

- `pending` -> `rejected`

`POST /api/invoice/admin/:id/issue`

Request:

- `invoice_no`
- `invoice_url`
- `issued_at`
- `issue_note`

Allowed transition:

- `approved` -> `issued`

### Real-Name APIs

All user-facing routes require `UserAuth`.

`GET /api/realname/status`

Returns current personal and company verification status.

`POST /api/realname/session`

Request:

- `verify_type`: `personal` or `company`
- `provider`

Behavior:

- Create a verification record with `pending` status.
- Call the provider adapter to create a verification session.
- Return redirect URL, QR code URL, or provider-specific session metadata.

`POST /api/realname/callback/:provider`

No user auth. Must verify provider signature.

Behavior:

- Parse provider callback.
- Find verification by provider request ID.
- Update verification status.
- On success, create or update the matching invoice profile.

`GET /api/invoice/profile`

Returns current user's personal and company invoice profiles.

`PUT /api/invoice/profile`

Allows users to save manual invoice profile fields. Manual profile updates must not change verification status.

## Provider Abstraction

Create a real-name provider abstraction instead of binding controllers directly to one vendor.

Suggested interface:

- `CreateSession(ctx, request) (session, error)`
- `VerifyCallback(ctx, request) (result, error)`
- `ProviderName() string`

The first implementation can support one provider. The interface keeps later providers isolated.

## State Machines

### Invoice Request

Allowed statuses:

- `pending`
- `approved`
- `rejected`
- `issued`
- `cancelled`

Allowed transitions:

- `pending` -> `approved`
- `pending` -> `rejected`
- `pending` -> `cancelled`
- `approved` -> `issued`

Rejected, cancelled, and issued are terminal in the first version.

### Real-Name Verification

Allowed statuses:

- `unverified`
- `pending`
- `verified`
- `failed`
- `expired`

Allowed transitions:

- `unverified` -> `pending`
- `pending` -> `verified`
- `pending` -> `failed`
- `pending` -> `expired`
- `failed` -> `pending`
- `expired` -> `pending`

## Frontend Design

### Files

Recommended new feature modules:

- `web/default/src/features/invoices/`
- `web/default/src/features/realname/`

Recommended invoice files:

- `api.ts`
- `types.ts`
- `index.tsx`
- `components/eligible-topups-table.tsx`
- `components/invoice-request-form.tsx`
- `components/invoice-submit-confirm-dialog.tsx`
- `components/invoice-records-table.tsx`
- `components/admin-invoice-table.tsx`
- `components/admin-invoice-dialogs.tsx`

Recommended real-name files:

- `api.ts`
- `types.ts`
- `components/verification-status-card.tsx`
- `components/verification-start-dialog.tsx`

Route:

- `web/default/src/routes/_authenticated/invoices/index.tsx`

### UI Rules

- Use existing `SectionPageLayout`.
- Use existing table, dialog, form, button, badge, and status components.
- Use lucide icons for actions.
- Keep controls compact and console-oriented.
- Do not put cards inside cards.
- Do not use in-app instructional text for obvious controls.
- Mobile must render selected top-up records without horizontal overflow.

### Navigation

Add user navigation:

- Personal group: `Invoices` -> `/invoices`

Add admin navigation only if using a separate admin route:

- Admin group: `Invoice Management`

If using an admin-only tab inside `/invoices`, the Personal navigation item is enough. Admin users can access the admin tab from the same page.

Sidebar config must include a module switch for invoices so backend sidebar configuration can hide or show it consistently.

### i18n

All new UI strings must use `t('English source key')`.

Locale files:

- `web/default/src/i18n/locales/en.json`
- `web/default/src/i18n/locales/zh.json`
- `web/default/src/i18n/locales/fr.json`
- `web/default/src/i18n/locales/ja.json`
- `web/default/src/i18n/locales/ru.json`
- `web/default/src/i18n/locales/vi.json`

Run from `web/default`:

- `bun run i18n:sync`

The confirmation phrase displayed to Chinese users is `确认开具发票`. Other locales can show translated explanatory text, but the required typed phrase for this product flow remains exactly `确认开具发票` unless a later product decision changes it.

## Database Compatibility

The implementation must support SQLite, MySQL 5.7.8+, and PostgreSQL 9.6+.

Rules:

- Prefer GORM APIs over raw SQL.
- Add new models to `AutoMigrate`.
- Use `TEXT` for JSON or payload storage, not database-specific JSON types.
- Use database-specific branches only if unavoidable.
- Avoid partial unique indexes because cross-database behavior differs.
- Use a simple unique index on `invoice_request_items.topup_id` for first-version duplicate prevention.

## Security and Privacy

1. Do not return full identity document numbers.
2. Mask identity fields in all frontend-visible responses.
3. Encrypt raw provider payloads if retained.
4. Verify real-name provider callback signatures.
5. Treat frontend selected amount as untrusted.
6. Recalculate invoice amount server-side inside the transaction.
7. Limit invoice request item count to reduce abuse.
8. Use existing auth middleware and role checks.
9. Admin actions should record operator ID and timestamps.

## Error Handling

User-facing invoice errors:

- No eligible top-up selected
- Selected top-up does not exist
- Selected top-up is not invoiceable
- Selected top-up has already been used in another invoice request
- Company invoice requires tax number
- Invoice request status cannot transition to the target state

Real-name errors:

- Unsupported provider
- Unsupported verification type
- Provider session creation failed
- Callback signature verification failed
- Verification record not found
- Verification expired

## Testing Strategy

### Backend Tests

Model-level tests:

- Eligible top-up query includes successful online top-ups.
- Eligible top-up query excludes pending, failed, expired, `amount = 0`, `money = 0`, balance provider, and already-used top-ups.
- Creating an invoice request writes one request plus item snapshots.
- Duplicate `topup_id` is rejected.
- User cannot invoice another user's top-up.
- Company invoice without tax number is rejected.
- Admin state transitions enforce allowed transitions.

Controller-level tests:

- User can list eligible top-ups.
- User can create an invoice request.
- User can list and view only their own invoice requests.
- Admin can list all invoice requests.
- Admin can approve, reject, and issue according to state rules.
- Non-admin cannot call admin invoice endpoints.

Real-name tests:

- Create personal verification session.
- Create company verification session.
- Callback updates verification status.
- Successful personal callback updates personal invoice profile.
- Successful company callback updates company invoice profile.
- Callback rejects invalid signatures.

### Frontend Verification

Run from `web/default`:

- `bun run typecheck`
- `bun run build`
- `bun run i18n:sync`

Browser checks:

- `/invoices` desktop layout
- `/invoices` mobile layout
- Top-up multi-select and amount summary
- Submit confirmation phrase behavior
- Admin tab visibility for admin users only

## Open Decisions Resolved

1. Invoiceable source: successful online top-up records only.
2. Existing top-up module: read-only; do not modify `top_ups` or related top-up code paths.
3. Multi-record invoice: supported.
4. Submit confirmation: require exact phrase `确认开具发票`.
5. Real-name verification: support both personal and company verification.

## Implementation Boundary

This design is ready for an implementation plan. The implementation plan should split work into:

1. Invoice backend models and tests
2. Invoice backend controllers and routes
3. Real-name backend abstraction, models, and tests
4. Invoice profile APIs
5. Frontend invoice page
6. Frontend real-name status/profile integration
7. Admin review UI
8. Navigation and i18n
9. Final verification
