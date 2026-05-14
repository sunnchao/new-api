# web/next Full Parity Design

Date: 2026-05-14

## Goal

Bring `web/next` to full functional and interaction parity with `web/default` while keeping the implementation native to the Next.js app.

The default frontend remains the behavioral source of truth. The Next.js frontend should preserve every user-visible feature and interaction from `web/default`, but the code should fit the existing `web/next` structure: App Router routes, route groups, client component boundaries, providers, stores, API client, i18n setup, and current visual tokens.

This work must not modify, delete, rename, or replace protected project identifiers or attributions.

## Current State

`web/default` has 24 feature domains:

- `about`
- `admin-tokens`
- `auth`
- `channels`
- `chat`
- `dashboard`
- `errors`
- `home`
- `invoices`
- `keys`
- `legal`
- `models`
- `performance-metrics`
- `playground`
- `pricing`
- `profile`
- `rankings`
- `redemption-codes`
- `setup`
- `subscriptions`
- `system-settings`
- `usage-logs`
- `users`
- `wallet`

`web/next` already has matching top-level routes for these domains. The parity audit shows that endpoint coverage is broadly present: the existing script found 208 unique default API endpoints and 235 unique next API endpoints, with no missing default endpoints at that level.

The remaining gap is not route existence or API endpoint presence. The gap is feature depth: many `web/next` pages are simplified implementations that do not yet include the full component trees, table actions, drawers, dialogs, filters, charts, visual editors, hooks, and supporting libraries from `web/default`.

## Primary Gaps

### System Settings

This is the largest gap. `web/default` has a full sectioned system settings workspace with rich editors and feature-specific interactions. `web/next` currently has a generic option form with a few enhancement components.

The Next.js version must cover:

- Site and branding settings
- Header navigation modules
- Sidebar module configuration
- Authentication settings
- OAuth settings
- Custom OAuth provider management and discovery
- Passkey settings
- Bot protection settings
- Billing, quota, currency, and payment settings
- Payment method visual editors
- Amount options and amount discount editors
- Creem product configuration
- Waffo, Waffo Pancake, worker, email, monitoring, and IONet deployment settings
- Model ratio and group ratio editors
- Tiered and dynamic pricing editors
- Tool price settings
- Upstream ratio sync
- Claude, Gemini, Grok, and global model setting cards
- Channel affinity rules and cache stats
- Rate limit, sensitive words, and SSRF settings
- Content settings for announcements, FAQ, dashboard, API info, chat, drawing, JSON toggles, and Uptime Kuma
- Maintenance settings for notice, logs, performance, update checking, header navigation, and sidebar modules
- Dirty form protection, reset behavior, safe JSON editing, accordion state, and settings form hooks

### High-Interaction Admin Domains

The following domains need their default table and dialog interactions restored in Next.js:

- `channels`: table columns, filters, create/edit drawer, bulk actions, row actions, channel testing, balance queries, model fetching, copy channel, tags, multi-key management, Ollama model management, Codex OAuth, status code risk guard, param override editor, upstream update flow, model mapping validation.
- `models`: metadata table, deployments table, model and vendor dialogs, deployment create/extend/rename/update flows, upstream conflict handling, prefill group management, deployment access guard, query keys, model actions, vendor actions.
- `users`: users table, user form drawer, delete flow, quota dialog, binding dialog, bulk and row actions.
- `redemption-codes`: redemption table, create drawer, created-code dialog, delete flow, bulk and row actions.
- `admin-tokens`: admin token drawer, delete and multi-delete flows, bulk and row actions.
- `keys`: API key table, create/edit drawer, delete and multi-delete flows, group combobox, CC switch dialog, row and bulk actions.
- `subscriptions`: plan table, plan form drawer, purchase dialog, status toggle dialog, user subscriptions dialog, quota display cells.

### User-Facing Product Domains

The following domains need the full default experience restored:

- `pricing`: grouped pricing, dynamic billing expression display, model cards, model detail page, modality/capability/performance/API/app sections, uptime sparkline, filters, toolbar, sidebar, pricing table, price and tier expression helpers.
- `wallet`: wallet stats, recharge form, subscription plan card, affiliate rewards, transfer dialog, billing history dialog, payment confirmation flows, Creem products, Waffo payment flows, top-up information hooks.
- `profile`: profile header, profile settings, language preferences, sidebar modules, check-in calendar, passkey card, 2FA flows, access token dialog, change password, delete account, email/Telegram/WeChat binding dialogs, notification tab.
- `dashboard`: overview cards, announcements, API info, FAQ, Uptime Kuma, performance health, model analytics charts, user charts, status hooks, dashboard configuration hooks.
- `usage-logs`: common, drawing, and task log sections; filter bars; stats; columns; prompt, fail reason, details, image, audio, and user info dialogs.
- `playground`: streaming chat, message actions, error display, payload builder, storage, chat handler, stream request hook, action guard.
- `rankings`: hero, model leaderboard, market share, pulse section, growth text, entity links, ranking hooks.
- `invoices`: profile panel, request form, eligible records, invoice records, verification status, admin invoice table, submit confirmation, admin dialogs.
- `home`: landing sections, hero buttons, terminal demo, scrolling icons, gateway cards, stat items, icon mapping.
- `setup`: multi-step setup wizard with database, admin, usage mode, navigation, and completion steps.

### Shared UI And Infrastructure

`web/next` needs the shared pieces required by the restored features:

- Section page layout or equivalent page shell for dense admin pages
- Workspace-aware system settings navigation adapted to Next.js
- Top navigation and dynamic backend navigation support
- Mobile drawer behavior
- Notification dialog
- Sign-out dialog
- Theme quick switcher
- Model group selector
- Long text display
- Date and datetime picker compatibility
- Data table page wrapper
- Missing UI primitives such as combobox, input group, native select, field, item, markdown, chart, carousel, sidebar, titled card, and button group where required by migrated features
- Chart theme and VChart helpers where default chart components depend on them
- Time, currency, dayjs, HTTP status rule, motion, nav module, theme customization, radius, submitted data, controllable state, and server error helpers where required
- Missing brand icons and custom layout/theme icons needed by navigation and profile controls

### i18n

New or restored text must be internationalized for the frontend locales:

- `en`
- `zh`
- `fr`
- `ja`
- `ru`
- `vi`

The current default convention is flat JSON under `translation`, with English strings as keys. The Next.js frontend should keep its local `web/next/src/i18n` setup, but all restored `t()` keys must exist in every locale file.

## Design Direction

Use `web/default` as the acceptance baseline, not as a direct copy target.

Preferred approach: migrate default feature components, hooks, and libraries domain by domain, then adapt them to Next.js:

- Keep `web/next/src/app` as the route source.
- Keep current Next.js route groups, especially `src/app/(app)`.
- Keep the current `web/next` API client and stores unless a default helper is needed for parity.
- Convert TanStack Router assumptions to Next.js `next/link`, `usePathname`, `useRouter`, `useSearchParams`, route params, or route segment pages.
- Keep client components explicit with `"use client"` where hooks, local state, browser APIs, or React Query are used.
- Prefer shared components over page-local monoliths once a domain becomes complex.
- Preserve current Next.js CSS tokens and Tailwind setup.
- Keep dense operational UI patterns from default: compact tables, explicit row actions, predictable dialogs, and scan-friendly forms.

## Visual System

- Color palette: keep `web/next` CSS variables and existing neutral/admin palette.
- Typography: keep the existing Next.js global typography setup.
- Spacing: preserve dense dashboard/admin spacing from `web/default`.
- Radius: use the current shadcn/Radix-style small radius strategy.
- Elevation: prefer borders and surface color over heavy shadows.
- Motion: keep light transitions for dialog, drawer, loading, and streaming feedback only.
- Icons: use the icon libraries already present in the project; prefer existing lucide icons for buttons and controls.

## Architecture

### Route Layer

The route layer stays in `web/next/src/app`.

Each route page should be thin:

- Resolve route params and section IDs.
- Render the relevant feature component.
- Preserve redirects or default-section behavior with Next-compatible logic.

Sectioned pages should use path segments already present in Next.js, such as:

- `/dashboard/[section]`
- `/models/[section]`
- `/usage-logs/[section]`
- `/system-settings/<category>/[section]`

### Feature Layer

Each feature domain owns its migrated components, hooks, and libraries under `web/next/src/features/<domain>`.

Complex domains should follow the default shape where practical:

- `components/`
- `components/dialogs/`
- `components/drawers/`
- `hooks/`
- `lib/`
- `types.ts`
- `api.ts`
- `constants.ts`
- optional `i18n.ts`

The implementation should avoid reintroducing one-file pages for complex admin features. The current simplified Next pages can be replaced incrementally with feature-level composition.

### Shared Layer

Shared pieces should live in:

- `web/next/src/components`
- `web/next/src/components/ui`
- `web/next/src/hooks`
- `web/next/src/lib`
- `web/next/src/context`
- `web/next/src/assets`

Only migrate shared files that are required by restored features. Do not bulk-copy unused abstractions.

### State And Data Flow

Use the existing `web/next` stores for auth, system config, and notifications.

Use React Query for server state where the domain needs cache invalidation, list refresh, or mutations. For simpler pages that already use direct API calls safely, keep them until the domain is migrated.

Mutation flows should follow this pattern:

1. Open dialog or drawer from table/page action.
2. Validate form data.
3. Call feature API.
4. Show success/error toast.
5. Invalidate or refetch affected data.
6. Close dialog only after successful mutation unless default behavior differs.

### Error Handling

User-visible errors should use existing toast and error-state components.

API errors should prefer the shared server-error handling helper once migrated. Dialogs should show specific backend messages where available.

### i18n

Any restored hardcoded UI text should be wrapped in `t()` unless it is an identifier, brand name, endpoint, model name, or code-like value. Locale files must be synchronized after each migration batch that adds keys.

## Implementation Order

The work should be implemented in vertical slices so each stage leaves a usable application.

1. Shared foundation
   - Fill missing shared UI primitives and utilities required by the first feature batches.
   - Add a Next-compatible section page layout and workspace-aware settings navigation.
   - Normalize i18n and route helper patterns.

2. System settings
   - Replace the generic option-only settings experience with the full default section architecture adapted to Next.js.
   - This unlocks many shared editors and admin-only flows.

3. Admin data management
   - Channels
   - Models
   - Users
   - Keys
   - Redemption codes
   - Admin tokens
   - Subscriptions

4. Observability and analytics
   - Dashboard
   - Usage logs
   - Performance metrics formatting
   - Rankings

5. User account and billing
   - Wallet
   - Profile
   - Invoices
   - My subscriptions

6. Public and interactive pages
   - Pricing
   - Playground
   - Home
   - Setup
   - Chat helpers and presets

7. Final parity audit
   - Run strict parity scripts.
   - Typecheck and build `web/next`.
   - Run i18n sync/checks.
   - Browser-verify representative routes across public, user, admin, settings, tables, dialogs, and mobile layouts.

## Verification

Minimum verification before claiming completion:

- `cd web/next && bun run typecheck`
- `cd web/next && bun run build`
- `cd web/next && bun run parity:audit:strict`
- i18n key completeness check for `web/next/src/i18n/locales`
- Browser verification for representative routes:
  - `/`
  - `/pricing`
  - `/sign-in`
  - `/playground`
  - `/dashboard`
  - `/channels`
  - `/models`
  - `/usage-logs`
  - `/wallet`
  - `/profile`
  - `/system-settings`
  - one route under each system settings category

For interactive domains, verification must include at least one table action menu, one create/edit drawer, one confirmation dialog, one filter/search flow, and one mobile viewport check.

## Risks And Mitigations

- Risk: default components assume TanStack Router.
  - Mitigation: adapt route and search-param usage during migration, keeping route pages thin.

- Risk: bulk-copying creates unused or incompatible code.
  - Mitigation: migrate by feature slice and typecheck after each batch.

- Risk: system settings is too broad for one pass.
  - Mitigation: implement by category while keeping the category navigation available.

- Risk: i18n gaps appear late.
  - Mitigation: run locale checks after each migrated feature domain.

- Risk: existing user changes in `web/default` are accidentally touched.
  - Mitigation: work only in `web/next` and shared docs unless explicitly required. Do not revert or edit unrelated dirty files.

## Acceptance Criteria

- Every `web/default` route has an equivalent `web/next` route or an intentional Next.js path equivalent.
- Every `web/default` feature domain has equivalent user-visible behavior in `web/next`.
- Admin tables include default-equivalent columns, filters, row actions, bulk actions, dialogs, and drawers.
- System settings includes default-equivalent categories, sections, editors, validation, save flows, and navigation.
- Public pages, user pages, billing pages, analytics pages, and playground preserve default-equivalent interactions.
- All new or restored UI text is covered in all Next.js locale files.
- `web/next` typecheck, build, and strict parity audit pass.
- Representative desktop and mobile browser checks show no obvious layout breakage.
