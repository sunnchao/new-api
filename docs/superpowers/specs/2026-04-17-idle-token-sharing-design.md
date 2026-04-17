# Idle Token Sharing Design

**Date:** 2026-04-17
**Topic:** Add an idle token sharing business domain to `new-api`

## Overview

Add a new top-level business module, `闲置 Token 共享`, to `new-api`.

This is not a cosmetic extension of the existing subscription system. It is a new business domain that lives inside the same product shell and reuses the current account, balance, gateway, and logging foundations.

The MVP goal is a full business loop:

- Sellers submit idle supply
- Platform reviews and hosts the supply
- Buyers purchase access using site balance
- Buyers continue to call through the unified `new-api` entry
- The system records usage, seller earnings, freezes, and manual settlements

The MVP must support both of these supply types:

- API key based supply
- Auth credential based supply, executed through an abstract authorization executor

The design intentionally does **not** bind the auth path to a specific external system name such as `sub2api`.

## Goals

1. Add `闲置 Token 共享` as a first-class top navigation module.
2. Keep buyer usage inside the existing `new-api` unified entry instead of issuing an external standalone access flow.
3. Support both seller-specific plans and platform-aggregated plans.
4. Let the platform host original credentials securely, while ensuring humans cannot read them back after submission.
5. Reuse site balance for purchases and manual settlement for seller payouts in the MVP.
6. Keep the new business domain isolated from the current subscription plan semantics.

## Non-Goals

1. Do not turn the existing subscription domain into a seller marketplace.
2. Do not add automated withdrawal or payout in the MVP.
3. Do not add recommendation ranking, community features, bidding, or multi-level distribution.
4. Do not hardcode the auth execution flow to any single external integration name.
5. Do not expose raw seller credentials to buyers, sellers after submission, or operators.

## Product Placement

### Top Navigation

Add a new first-level navigation item:

- `闲置 Token 共享`

This module should be visible alongside existing top-level modules such as Home, Console, Pricing, Docs, and About. It should not be hidden inside Console because the feature serves both buyers and sellers as a standalone business surface.

### User-Facing Module Shape

The new module should land on a shared entry page rather than a single table page.

Recommended structure:

- `/sharing`
  - Buyer entry: `我要购买`
  - Seller entry: `我要共享`

This keeps both sides of the marketplace in one business domain while preserving separate operational flows behind it.

### Admin Placement

Operator workflows remain under the existing admin console.

Recommended admin routes:

- `/console/sharing/review`
- `/console/sharing/plans`
- `/console/sharing/risk`
- `/console/sharing/settlements`

This preserves a clean boundary:

- `sharing` for buyer and seller workflows
- `console/sharing/*` for platform operations

## Domain Boundary

### Reuse Existing `new-api` Capabilities

The new domain should reuse:

- User accounts, login, and permissions
- Site balance
- Unified API gateway entry
- Existing request log foundation
- Existing UI shell, routing, and top navigation configuration

### Add a New Business Domain

The following concerns must be added as a separate domain instead of being folded into current subscription entities:

- Seller supply hosting
- Shared plan marketplace
- Purchase-based access grants
- Sharing-specific usage ledgers
- Sharing-specific settlement ledgers
- Risk events for seller supply and auth failures

This boundary is important because the existing subscription domain models platform-authored plan templates, while idle token sharing models seller-provided hosted supply. They are not the same business object.

## User Roles and Entry Paths

### Buyer

Recommended buyer routes:

- `/sharing`
- `/sharing/market`
- `/sharing/plans/:id`
- `/sharing/my-access`

Buyer responsibilities:

- Browse plans
- Purchase with site balance
- View active sharing access
- Continue using the unified `new-api` entry
- View consumption and file after-sales issues

### Seller

Recommended seller routes:

- `/sharing`
- `/sharing/seller/new`
- `/sharing/seller/plans`
- `/sharing/seller/revenue`

Seller responsibilities:

- Submit hosted supply
- Accept platform credential hosting terms
- Track review status
- Manage plan visibility and status
- View revenue, freezes, and manual settlement records

### Operator

Recommended operator routes:

- `/console/sharing/review`
- `/console/sharing/plans`
- `/console/sharing/risk`
- `/console/sharing/settlements`

Operator responsibilities:

- Review and approve supply
- Pause or reject risky plans
- Handle disputes and freezes
- Record manual settlement actions

## Core Concepts

### Supply Types

The MVP supports two supply modes:

1. `api_key`
2. `auth`

The difference is execution strategy, not product positioning.

- `api_key` supply executes directly against the upstream using a platform-hosted key
- `auth` supply executes through a generic authorization executor that converts stored credentials into a callable upstream context

### Market Shapes

The marketplace must support both:

1. Seller-specific plans
2. Platform-aggregated plans

Seller-specific plans expose the identity or profile of the seller in the product experience when allowed.

Platform-aggregated plans hide individual sellers and let the platform manage source selection internally.

### Access Model

A buyer does not purchase raw credentials.

A buyer purchases a `sharing access grant`, which authorizes continued usage through the unified `new-api` entry for a defined plan, duration, and quota policy.

To avoid introducing a separate external credential surface, the sharing domain should extend the existing user token model with an optional binding to a `SharingAccessGrant`.

Recommended rule:

- buyers continue using standard `new-api` user tokens
- a standard token may optionally bind to one active `SharingAccessGrant`
- if a request arrives with a token that is bound to a sharing access grant, the sharing route takes precedence
- if no sharing binding exists, the current `new-api` billing and routing behavior remains unchanged

This keeps the gateway entry unified without forcing buyers into a second token system.

## Core Entities

The recommended domain model is:

### `SharingSource`

Represents the real seller-provided hosted supply.

Suggested fields:

- `id`
- `owner_user_id`
- `source_type` (`api_key` or `auth`)
- `provider`
- `credential_ciphertext`
- `credential_fingerprint`
- `credential_version`
- `status`
- `review_status`
- `risk_level`
- `health_status`
- `health_checked_at`
- `masked_summary`
- `created_at`
- `updated_at`

Notes:

- `credential_ciphertext` stores the original credential in encrypted form
- `masked_summary` is safe metadata for UI display
- raw credentials must never be returned after submission

### `SharingPlan`

Represents the buyer-facing sellable product.

Suggested fields:

- `id`
- `owner_user_id` nullable for pooled plans
- `plan_mode` (`seller_direct` or `platform_aggregated`)
- `source_type`
- `provider`
- `title`
- `description`
- `price_mode`
- `price_config`
- `visibility`
- `status`
- `risk_label`
- `available_models`
- `duration_policy`
- `quota_policy`
- `purchase_note`
- `after_sales_policy`
- `created_at`
- `updated_at`

### `SharingPlanSourceBinding`

Maps plans to one or more hosted supply sources.

Suggested fields:

- `id`
- `plan_id`
- `source_id`
- `weight`
- `status`
- `created_at`

This supports both direct seller plans and pooled platform plans without overloading the plan table.

### `SharingAccessGrant`

Represents the buyer’s purchased access authorization.

Suggested fields:

- `id`
- `buyer_user_id`
- `plan_id`
- `order_id`
- `status`
- `start_at`
- `end_at`
- `quota_total`
- `quota_used`
- `billing_snapshot`
- `created_at`
- `updated_at`

### `SharingUsageLedger`

Maps a request back to the sharing business domain.

Suggested fields:

- `id`
- `request_id`
- `buyer_user_id`
- `plan_id`
- `source_id`
- `access_grant_id`
- `seller_user_id`
- `usage_amount`
- `buyer_charge_amount`
- `seller_income_delta`
- `platform_fee_delta`
- `status`
- `occurred_at`

### `SharingSettlementLedger`

Tracks seller earnings and manual settlement states.

Suggested fields:

- `id`
- `seller_user_id`
- `plan_id`
- `source_id`
- `gross_income`
- `platform_fee`
- `refund_adjustment`
- `freeze_amount`
- `net_settleable`
- `settlement_status`
- `settled_at`
- `note`

### `SharingRiskEvent`

Tracks supply and business risk signals.

Suggested fields:

- `id`
- `source_id`
- `plan_id`
- `buyer_user_id` nullable
- `seller_user_id`
- `event_type`
- `severity`
- `payload`
- `action_taken`
- `created_at`

## Sensitive Credential Boundary

### Required Rule

The platform stores original credentials, but only system services may decrypt and use them.

### Allowed

- Encrypt and store the original credential on submission
- Decrypt only in server-side execution paths
- Run health checks using decrypted credentials
- Mark a source as paused, invalid, or risky based on execution outcomes

### Forbidden

- Operators reading raw credentials in the admin UI
- Sellers reading raw credentials back after submission
- Buyers seeing source credentials directly or indirectly
- Logging raw credentials or reversible secrets
- Returning raw credentials in API errors, admin notes, or audit events

This is a hard MVP requirement, not a future improvement.

## Frontend Information Architecture

### Buyer Routes

- `/sharing`
- `/sharing/market`
- `/sharing/plans/:id`
- `/sharing/my-access`

### Seller Routes

- `/sharing/seller/new`
- `/sharing/seller/plans`
- `/sharing/seller/revenue`

### Admin Routes

- `/console/sharing/review`
- `/console/sharing/plans`
- `/console/sharing/risk`
- `/console/sharing/settlements`

## Core Business Flows

### Flow 1: Seller Submission and Plan Publishing

1. Seller opens `/sharing/seller/new`
2. Seller chooses supply type: `api_key` or `auth`
3. Seller fills in product information and submits original credentials
4. Backend encrypts the credential immediately and stores only safe display metadata
5. Operator reviews the source and supporting information
6. On approval, the source becomes bindable to one or more `SharingPlan` records
7. The approved plan becomes visible to buyers

### Flow 2: Buyer Purchase

1. Buyer browses `/sharing/market`
2. Buyer opens a plan detail page
3. Buyer pays using site balance
4. Backend creates an order and a `SharingAccessGrant`
5. Buyer sees the purchased plan in `/sharing/my-access`
6. Buyer binds an existing standard user token, or creates a standard user token, for this access grant
7. Buyer continues using the unified `new-api` entry instead of a separate sharing-only token surface

### Flow 3: Unified Entry Request Execution

1. Buyer sends a normal request through the existing gateway entry
2. Gateway checks whether the incoming standard user token is bound to a sharing access grant
3. System checks grant validity, quota, and plan state
4. System resolves the active plan binding to a specific hosted source
5. Request executes using one of two strategies:
   - direct key execution for `api_key`
   - authorization executor for `auth`
6. Response returns through the normal gateway flow
7. Request log, sharing usage ledger, and settlement deltas are written

### Flow 4: After-Sales and Manual Settlement

1. Buyer files a dispute or refund request
2. Operator reviews the request and relevant usage data
3. If needed, seller earnings are frozen or adjusted
4. Operator records manual settlement decisions
5. Seller revenue page reflects freeze, adjustment, and settlement state

## Execution Model

### API Key Supply

Execution path:

- decrypt stored key
- construct upstream request
- execute directly
- record result and update health

### Auth Supply

Execution path:

- decrypt stored auth credential
- hand off to an abstract authorization executor
- obtain request-capable execution context
- execute upstream request
- record result and update health

The design intentionally uses a generic executor abstraction so the implementation can support Claude, Codex, or other auth-driven providers later without renaming the business model.

## Error Handling

### Buyer-Facing Business Errors

The MVP must return clear business-level errors for:

- plan not found
- plan paused
- plan unavailable
- insufficient balance during purchase
- access grant expired
- access grant quota exhausted

### Supply Errors

The MVP must classify and record at least:

- credential invalid
- auth expired
- upstream unavailable
- health check failed
- executor failure

### Operational Actions

The platform must support these actions:

- auto-pause plan after repeated source failures
- write risk events for auth expiry or repeated execution failures
- freeze unsettled seller earnings for disputes
- allow manual recovery and manual settlement notes

The MVP does not need sophisticated self-healing, but it does need traceability and safe pause/freeze behavior.

## Compatibility Constraints

This design must follow the repository constraints:

- preserve `new-api` and `QuantumNous` protected identifiers
- support SQLite, MySQL, and PostgreSQL
- prefer GORM abstractions over DB-specific SQL
- use `common/json.go` wrappers for marshal and unmarshal behavior

Any later implementation plan must respect these constraints when turning the entity model into concrete tables and migrations.

## Verification Strategy

The MVP is not complete unless all of the following can be verified:

1. Sellers can submit both an API-key source and an auth-based source.
2. Submitted raw credentials are encrypted at rest and cannot be read back in UI or API responses.
3. Operators can approve and publish a sharing plan.
4. Buyers can purchase a sharing plan using site balance.
5. Purchase immediately creates valid access that works through the unified `new-api` entry.
6. A request can be traced from buyer to plan to source to seller settlement delta.
7. Source failure can pause a plan and create a risk event.
8. Manual settlement and after-sales adjustments can be recorded.

## MVP Success Criteria

The MVP is successful when:

1. At least one API-key based supply and one auth-based supply can complete the full loop.
2. Buyers can purchase and use sharing access without leaving the existing product shell.
3. The platform can explain every purchase, every access grant, and every seller earning change.
4. Operators can freeze, pause, and manually settle without touching raw credentials.

## Recommended Implementation Direction

Implement this feature as a separate sharing domain inside the existing layered architecture:

- Router -> Controller -> Service -> Model

Keep the sharing domain isolated in naming and code layout, while reusing existing common account, balance, and gateway facilities.

This feature should be built as a new business surface inside `new-api`, not as a visual variant of current subscription plans.
