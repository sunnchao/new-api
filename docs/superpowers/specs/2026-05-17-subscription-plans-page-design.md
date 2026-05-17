# Subscription Plans Public Page Design

## Context

The default web frontend currently has a public model catalog at `/pricing` and
an authenticated personal subscription page at `/my-subscriptions`. The route
`/subscriptions` is already used by the authenticated admin subscription
management page, so the new public catalog must not reuse that path or the admin
feature.

The new page should let anonymous visitors view every enabled subscription
plan. It should remain independent from user subscription state and payment
dialogs so the page can later be optimized for static generation.

## Goals

- Add a top navigation item named `Subscription Plans` after `Model Square`.
- Add an independent public route at `/subscription-plans`.
- Show all enabled subscription plans to anonymous and authenticated visitors.
- Keep the page separate from `/subscriptions` and `/my-subscriptions`.
- Use a simple public Go API endpoint instead of adding a BFF layer.
- Preserve the existing subscription admin and personal subscription behavior.

## Non-Goals

- Do not move or rename the existing admin `/subscriptions` route.
- Do not reuse the personal `SubscriptionPlansCard` as the public page body,
  because it is coupled to login state, payment settings, active subscriptions,
  renewal, and billing preferences.
- Do not open payment dialogs directly from the public page in the first
  iteration.
- Do not add Cloudflare Pages Functions or another BFF layer for this feature.

## Backend API

Add a public endpoint:

```text
GET /api/subscription/public/plans
```

Behavior:

- Does not require authentication.
- Returns all subscription plans where `enabled = true`.
- Does not filter by `show_on_home`.
- Sorts by `sort_order desc, id desc`, matching existing plan list behavior.
- If payment compliance is not confirmed, returns an empty list.
- Uses the existing response shape:

```json
{
  "success": true,
  "data": [
    {
      "plan": {
        "id": 1,
        "title": "Basic Plan"
      }
    }
  ]
}
```

Implementation should be close to the existing subscription controller patterns
and use GORM rather than raw SQL. No database schema changes are needed.

## Frontend Route

Create a new route:

```text
web/default/src/routes/subscription-plans/index.tsx
```

Route behavior:

- Uses the same top-navigation module guard pattern as `/pricing` and
  `/rankings`.
- Reads `HeaderNavModules.subscriptions`.
- Redirects to `/` if the module is disabled.
- Redirects anonymous users to `/sign-in?redirect=...` only when
  `requireAuth = true`.
- Defaults to public access because the product requirement is anonymous
  browsing.

## Frontend Feature Boundary

Create an independent feature directory:

```text
web/default/src/features/subscription-plans/
```

Suggested files:

- `index.tsx` for the page composition.
- `api.ts` for the public plan fetcher.
- `components/plan-card.tsx` for public plan cards.
- Optional small helpers only when existing subscription helpers are not enough.

The feature may reuse:

- Existing subscription types from `features/subscriptions/types`.
- Existing formatting helpers from `features/subscriptions/lib`.
- Existing shared format helpers such as `formatQuota` and currency formatting.
- Existing UI components.

The feature must not depend on:

- `SubscriptionPlansCard`.
- Self subscription APIs.
- Wallet or top-up APIs.
- Payment dialogs.
- Admin subscription providers or tables.

This keeps the page suitable for later SSG work: it has one public data source
and no user-state dependency.

## Page Content

The public page should show a focused catalog experience, not a dashboard or
admin table.

Display for each enabled plan:

- Plan title and optional subtitle.
- Price amount and currency.
- Duration.
- Billing mode.
- Total quota or total request count.
- Quota reset period when configured.
- Hourly, daily, weekly, and monthly limits when configured.
- Approximate request counts when configured.
- Allowed groups when configured.
- Upgrade group when configured.
- Purchase limit when configured.

Empty state:

- Show a polished empty state when no enabled plans are available.
- Text should be internationalized.

CTA behavior:

- Authenticated users go to `/my-subscriptions`.
- Anonymous users go to `/sign-up`.
- The CTA text should make it clear that purchasing happens after sign-in or
  inside the personal subscription page.

## Top Navigation

Extend header navigation modules with `subscriptions`:

```json
{
  "subscriptions": {
    "enabled": true,
    "requireAuth": false
  }
}
```

Update both runtime parsing and system settings editing:

- `web/default/src/lib/nav-modules.ts`
- `web/default/src/hooks/use-top-nav-links.ts`
- `web/default/src/features/system-settings/maintenance/config.ts`
- `web/default/src/features/system-settings/maintenance/header-navigation-section.tsx`

Menu order:

1. Home
2. Console
3. Model Square
4. Subscription Plans
5. Rankings
6. Docs
7. About

The settings UI should allow admins to hide the menu item or require login,
matching the existing `pricing` and `rankings` controls.

## Internationalization

All new UI strings must use `t(...)` and be present for:

- `en`
- `zh`
- `fr`
- `ja`
- `ru`
- `vi`

Expected new or reused keys include:

- `Subscription Plans`
- `Browse available subscription plans`
- `No subscription plans available`
- `Public subscription plan catalog.`
- `Require login to view subscription plans`
- `Visitors must authenticate before accessing subscription plans.`
- `Sign in to subscribe`

Run the existing i18n sync workflow from `web/default`.

## Testing And Verification

Backend:

- Add or update route tests to confirm anonymous access to
  `/api/subscription/public/plans`.
- Confirm the endpoint only returns enabled plans.
- Confirm `show_on_home = false` plans are still included.
- Confirm payment compliance disabled returns an empty list.

Frontend:

- Run TypeScript/build checks.
- Verify the top nav places `Subscription Plans` after `Model Square`.
- Verify `/subscription-plans` renders for anonymous visitors by default.
- Verify disabling `HeaderNavModules.subscriptions.enabled` redirects to `/`.
- Verify setting `requireAuth = true` redirects anonymous visitors to sign-in.
- Verify empty, loading, and populated states.
- Verify mobile layout does not overflow.

## Open Decisions

The design intentionally routes purchases to the existing personal subscription
page for the first iteration. A future enhancement can deep-link a selected plan
or open a purchase flow after login, but that should be handled as a separate
spec because it changes payment flow behavior.
