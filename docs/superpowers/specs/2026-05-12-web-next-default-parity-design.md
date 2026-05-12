# Web Next Default Parity Design

**Date:** 2026-05-12
**Topic:** Complete `web/next` so it reaches functional parity with `web/default`

## Overview

`web/default` remains the reference frontend. It is a React 19, Rsbuild, TanStack Router, TanStack Query, Zustand, i18next, Tailwind CSS, Base UI, and shadcn-style application with a large feature-module structure under `web/default/src/features`.

`web/next` is the new Next.js App Router frontend. It already has many route files and UI dependencies, but most `web/next/src/features` directories are empty and much of the current business logic is implemented directly inside `app/**/page.tsx`. The goal is to complete `web/next` until it is functionally equivalent to `web/default`, while keeping `web/default` intact as the source of truth and rollback reference.

The user explicitly selected full parity as the target, not a reduced or partial migration.

## Current Audit Summary

The audit found these high-level gaps:

- `web/default/src/features` contains 24 feature domains and 583 feature files.
- `web/next/src/features` currently has matching directory names but effectively no feature files.
- `web/default/src/routes` contains 62 route files.
- `web/next/src/app` contains 60 page files, so route count is close, but many pages are simplified and not behaviorally equivalent.
- `web/default` contains about 208 exact API call sites found by static scan.
- `web/next` contains about 122 exact API call sites found by static scan.
- About 145 `web/default` API call patterns do not have an exact `web/next` counterpart. Some `web/next` calls also use different or likely temporary paths.
- `web/default` uses feature modules with API, types, components, hooks, and lib helpers. `web/next` often places API calls, dialogs, table state, and forms directly in route pages.

The route count alone is not a sufficient parity signal. Parity must be measured by user-visible behavior, API semantics, URL state, permissions, validation, loading/error/empty states, mobile behavior, and i18n coverage.

## Goals

1. Make `web/next` fully equivalent to `web/default` for all public, authenticated user, and admin workflows.
2. Preserve the existing `web/next` Next.js App Router application shape.
3. Move business logic out of large `app/**/page.tsx` files into feature modules.
4. Reuse `web/default` as the source of truth for feature behavior, API contracts, validation rules, and UI states.
5. Preserve existing protected project identity, branding, attribution, copyright, package metadata, and related references.
6. Keep `web/default` unchanged unless a parity investigation proves a shared bug or source-of-truth mismatch that the user explicitly wants fixed.
7. Keep added UI text internationalized for all supported `web/next` locales.
8. Verify parity with focused builds, type checks, and browser checks for critical flows.

## Non-Goals

1. Do not redesign the product or introduce a new visual identity.
2. Do not remove, rename, replace, or obscure protected project or organization identifiers.
3. Do not change backend APIs unless a frontend parity requirement exposes a confirmed backend defect and the user approves that broader scope.
4. Do not migrate `web/classic`.
5. Do not remove `web/default`.
6. Do not intentionally reduce feature scope for a faster cutover.
7. Do not rewrite the project into a server-first Next architecture where client-owned auth, streaming, passkeys, local storage, or dialog-heavy workflows would lose behavior.

## Recommended Approach

Use a modular parity migration.

`web/next` route files should become thin wrappers. Feature behavior should live under `web/next/src/features/<domain>` with the same conceptual split used by `web/default`:

```text
web/next/src/features/<domain>/
  api.ts
  types.ts
  constants.ts
  index.tsx
  components/
  hooks/
  lib/
```

Route files should import and render feature entry points. For example, `/keys/page.tsx` should render the keys feature instead of containing the keys table, dialogs, API calls, mutation logic, and utility functions inline.

This approach is preferred over continuing to add code directly into Next route pages because several existing `web/next` pages are already hundreds of lines long, and full parity would make them difficult to verify and maintain.

## Design Decisions

- Color palette: keep the existing `web/next` CSS variable palette and theme presets.
- Typography: keep the current global font setup and operational-console density.
- Spacing system: use the existing Tailwind/shadcn spacing rhythm with compact admin surfaces.
- Border-radius strategy: use existing small to medium radii; avoid landing-page-style large cards in product workflows.
- Shadow hierarchy: prefer borders and surface tokens over heavy shadows.
- Motion style: keep restrained hover, focus, dialog, drawer, and loading transitions.
- Icons: use the existing icon libraries already present in `web/next`; prefer lucide where an existing component already uses it and keep imported project icons where parity requires them.
- Components: use the local `web/next/src/components/ui` primitives and shadcn/Radix composition patterns.

## Feature Inventory

Full parity covers these feature domains from `web/default`:

| Domain | Default file count | Required parity scope |
| --- | ---: | --- |
| `about` | 3 | About page content loading and rendering. |
| `admin-tokens` | 14 | Admin token list, create, edit, status, delete, bulk delete, table actions, provider/dialog state. |
| `auth` | 34 | Sign in, sign up, forgot password, reset, OTP, OAuth, passkey login/management, secure verification, Turnstile, legal consent, storage, redirects. |
| `channels` | 42 | Channel CRUD, provider config, testing, balance, copy, status, batch operations, tags, model mapping, param overrides, Codex OAuth/usage, multi-key, Ollama tools, upstream updates, risk guards. |
| `chat` | 4 | Active key lookup, chat presets, chat links, Fluent send/prefill helpers. |
| `dashboard` | 30 | Overview dashboard, announcements, API info, FAQ, uptime, model analytics, user analytics, charts, preferences, filters. |
| `errors` | 5 | 401, 403, 404, 500/general, and 503/maintenance pages. |
| `home` | 22 | Public homepage, dynamic content, hero, feature sections, stats, pricing, CTA, icon mapping, footer/header integration. |
| `invoices` | 13 | Eligible records, invoice profile, verification status, request form, confirmation, history, admin approve/reject/issue flows. |
| `keys` | 20 | API key table, create/edit drawer, group/model restrictions, token display/reveal, status, delete, bulk delete, generated client links/configs, CC switch. |
| `legal` | 6 | User agreement and privacy policy dynamic documents with fallback/external behavior. |
| `models` | 40 | Model metadata CRUD, vendor CRUD, upstream sync, missing models, prefill groups, deployments, logs/details, hardware/location/replica/price estimation, access guard. |
| `performance-metrics` | 3 | Performance metrics APIs, formatting, and admin views. |
| `playground` | 19 | Chat playground, streaming, SSE cancellation, persisted settings/messages, payload builder, actions, message styles, guard logic. |
| `pricing` | 43 | Public pricing, filters, cards/table/sidebar, model details, capabilities, charts, uptime, dynamic/tiered/group pricing, billing expression helpers. |
| `profile` | 29 | Profile header/settings, language, notifications, security, access token, 2FA, passkeys, check-in calendar, bindings, password change, account deletion. |
| `rankings` | 14 | Rankings hero, model leaderboard, pulse, market share, growth formatting, entity links, period handling. |
| `redemption-codes` | 17 | Admin redemption code table, create/edit, status, delete, bulk delete, delete invalid, form validation. |
| `setup` | 9 | Setup status, setup wizard, validation, retries, initial admin/system creation. |
| `subscriptions` | 21 | Admin plans, status, user assignment/invalidation/deletion, user plans, purchase dialogs, billing preference, payment methods. |
| `system-settings` | 117 | Full settings workspace across site, auth, billing, models, security, content, operations, custom OAuth, channel affinity, visual editors, dirty guards, update checker, performance maintenance. |
| `usage-logs` | 32 | Common, drawing, and task logs; filters, stats, previews, dialogs, status/action/type mappings, user info, table behavior. |
| `users` | 17 | Admin user table, search/filter, create/edit, manage actions, delete, passkey/2FA reset, groups, OAuth binding cleanup. |
| `wallet` | 29 | Wallet balance, top-up, payment flows, Stripe/Creem/Epay/Waffo/Waffo Pancake, affiliate, transfer, billing history, subscriptions entry points. |

## Route Parity

Every `web/default/src/routes` entry needs a `web/next` counterpart with equivalent behavior:

- Public: `/`, `/about`, `/pricing`, `/pricing/[modelId]`, `/rankings`, `/privacy-policy`, `/user-agreement`
- Auth: `/sign-in`, `/sign-up`, `/forgot-password`, `/otp`, `/reset`, `/oauth`, `/oauth/[provider]`, `/user/reset`
- Errors: `/401`, `/403`, `/404`, `/500`, `/503`, and authenticated error preview behavior
- Setup: `/setup`
- Authenticated user/admin: `/dashboard`, `/dashboard/[section]`, `/playground`, `/chat/[chatId]`, `/chat2link`, `/keys`, `/usage-logs`, `/usage-logs/[section]`, `/wallet`, `/profile`, `/invoices`, `/my-subscriptions`
- Admin: `/channels`, `/models`, `/models/[section]`, `/users`, `/redemption-codes`, `/subscriptions`, `/admin-tokens`, `/performance-metrics`, `/system-settings`, and all `/system-settings/<group>/<section>` routes
- Compatibility redirects: `/console/log` to usage logs and `/console/topup` to wallet or top-up behavior, matching `web/default`

Dynamic route validation must match the current default behavior. Invalid section IDs should redirect to the default section or the appropriate error page as `web/default` does.

## System Settings Scope

System settings parity is a high-risk area and must not be treated as generic key/value forms only. Some sections require specialized editors and dialogs.

Required section groups:

- Site: system information, notice, header navigation, sidebar modules
- Auth: basic auth, OAuth integrations, passkey, bot protection, custom OAuth
- Billing: quota, currency/display, model pricing, group pricing, payment gateway, check-in rewards
- Models and routing: global, Gemini, Claude, Grok, channel affinity, model deployment
- Security and limits: rate limiting, sensitive words, SSRF protection
- Console content: dashboard, announcements, API info, FAQ, Uptime Kuma, chat presets, drawing
- Operations: system behavior, monitoring, SMTP email, worker proxy, log maintenance, performance, update checker

Specialized editors that must be preserved include:

- Header navigation editor
- Sidebar modules editor
- Custom OAuth provider management
- Payment methods, amount options, amount discount, Creem products, Waffo, and Waffo Pancake settings
- Model pricing and group pricing visual editors
- Tiered billing expression editor
- Tool price editor
- Upstream ratio sync table
- Channel affinity rules and cache stats
- Rate limit visual editor
- Chat preset visual editor
- JSON validators and safe JSON state handling
- Dirty form indicator and navigation guard

Any implementation touching billing expression or tiered pricing must first read `pkg/billingexpr/expr.md` and follow that design.

## API Parity

The `web/next` API layer must converge toward the `web/default` feature API modules. It should not rely on ad hoc endpoint strings scattered throughout route pages.

Shared client behavior must include:

- same-origin API base URL
- `withCredentials: true`
- `Cache-Control: no-store`
- `New-Api-User` header from local storage where applicable
- consistent business response handling for `{ success, message, data }`
- global error handling compatible with authenticated guards
- GET deduplication without aborting useful callers incorrectly
- explicit opt-outs for guard/preload and special streaming cases

Feature API modules must preserve default endpoint paths, methods, payload shapes, query parameters, and response mappers. If `web/next` currently uses a different endpoint than `web/default`, the default endpoint is presumed correct until backend code proves otherwise.

## Auth And Permissions

Parity requires preserving:

- setup-required redirect behavior before normal navigation
- auth guard behavior for protected pages
- sign-in redirect query handling
- role-gated admin routes
- local user store compatibility
- session validation with `/api/user/self`
- global 401 reset behavior
- 2FA and OTP login flows
- passkey registration/login/management flows
- OAuth login and bind callbacks
- secure verification dialog/hooks
- Turnstile integration
- affiliate code capture and reuse

Admin-only pages and admin-only subsections must not render for non-admin users except through the same forbidden/redirect behavior used by `web/default`.

## URL State

TanStack Router search-state behavior from `web/default` must be replaced with typed Next URL helpers around `useRouter`, `usePathname`, and `useSearchParams`.

The helper layer must cover:

- table page, page size, search, filters, sorting, and selected sections
- pricing filters and detail routes
- rankings periods
- sign-in redirects
- setup redirects
- usage-log sections and filter ranges
- wallet/top-up payment success/cancel states
- OAuth callback params
- model/dashboard/system-setting section params

Invalid URL state should be coerced or redirected in the same way as `web/default`.

## Internationalization

All added or restored user-visible text must use `react-i18next`.

Supported locales in `web/next` are:

- `en`
- `zh`
- `fr`
- `ja`
- `ru`
- `vi`

New `t()` keys must exist in every locale file. English source strings may be used as stable keys where that matches current project style, but missing locale entries are not acceptable for completed work.

## Visual And UX Requirements

`web/next` should feel like a polished operational console:

- dense but readable tables
- clear form sections
- predictable dialogs and drawers
- visible loading, empty, and error states
- mobile table alternatives where `web/default` has them
- accessible dialog titles and labels
- no decorative landing-page treatment inside admin workflows
- no visible explanatory text that only describes how the UI was built

The migration should preserve behavior and ergonomics first. Visual polish should come from matching the existing `web/next` tokens and component primitives, not from redesigning workflows.

## Migration Phases

### Phase 1: Shared Foundation

- Create or complete feature module structure in `web/next/src/features`.
- Fix shared API client behavior.
- Add URL-state helpers.
- Add layout/navigation parity gaps.
- Add shared utilities needed by migrated features.
- Establish i18n and route validation conventions.

### Phase 2: Public And Auth Flows

- Home, pricing, rankings, about, legal, setup, error pages.
- Sign in, sign up, forgot/reset password, OTP, OAuth, passkey, secure verification, Turnstile.

### Phase 3: User Console

- Dashboard, playground, chat/chat2link, keys, usage logs, wallet, subscriptions, invoices, profile.

### Phase 4: Admin Core

- Channels, models, users, redemption codes, admin tokens, performance metrics.

### Phase 5: System Settings

- Restore all settings groups and specialized editors.
- Preserve dirty guards, JSON validation, visual editors, and maintenance actions.

### Phase 6: Parity Hardening

- Compare API calls and route behavior against `web/default`.
- Complete translations.
- Run type checks and build.
- Use browser checks for representative public, user, admin, and settings flows.
- Fix mobile/responsive regressions for high-use pages.

## Testing And Verification

Each implemented batch should include:

- `bun run typecheck` or the nearest available TypeScript check in `web/next`
- `bun run build` in `web/next`
- targeted browser verification for at least one route in the batch
- API smoke checks through the UI where backend availability allows it
- i18n missing-key checks or manual locale-file verification for added keys

High-risk flows need browser verification:

- sign-in and auth guard redirects
- API key create/edit/delete
- channel create/edit/test/batch actions
- model metadata and deployment pages
- usage logs sections
- wallet payment path entry points
- invoice submit/admin review paths
- profile security/passkey/2FA
- system settings specialized editors

## Acceptance Criteria

The migration is complete when:

1. Every `web/default` route has a `web/next` counterpart with equivalent behavior.
2. Every default feature domain listed in this spec has a migrated `web/next/src/features` module or an explicit route wrapper to a migrated module.
3. Route pages are thin wrappers rather than large containers for business logic.
4. API calls use feature API modules and match default endpoint semantics.
5. Public, user, admin, and settings workflows render with loading, empty, error, and success states.
6. Admin-only pages and actions are correctly gated.
7. `web/next` locale files contain keys for all added or restored UI strings.
8. `web/next` type check and production build pass.
9. Representative browser checks pass on desktop and mobile widths.
10. `web/default` remains intact.

## Risks

- Some current `web/next` endpoints differ from default and may be wrong or backend-version-specific. Default remains the source of truth until verified.
- Directly porting components may expose TanStack Router assumptions that need Next URL helper adapters.
- System settings include many JSON editors and visual editors; treating them as textarea-only forms would fail parity.
- Streaming playground and chat flows require careful cancellation and local storage behavior.
- Passkey and OAuth flows depend on browser APIs and redirect semantics and need real browser checks.
- Payment flows cannot be fully validated without configured providers, so entry-point behavior and payload construction must be verified separately from provider callbacks.

## Next Step

There are no remaining scope blockers. The user selected full parity.

Implementation planning should decide the exact batch order and file ownership for each phase.
