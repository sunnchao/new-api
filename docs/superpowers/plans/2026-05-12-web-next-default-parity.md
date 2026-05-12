# Web Next Default Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete `web/next` until it is functionally equivalent to `web/default` across public pages, auth, user console, admin console, system settings, i18n, and verification.

**Architecture:** Keep `web/next` as a Next.js App Router application, but move business logic out of `app/**/page.tsx` into feature modules shaped after `web/default/src/features`. Each route becomes a thin wrapper around a migrated feature entry point, with shared API, URL-state, auth, layout, table, dialog, and i18n foundations.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun, Tailwind CSS v4, Radix/shadcn-style UI primitives, lucide/Hugeicons, TanStack Query, TanStack Table, Zustand, React Hook Form, Zod, axios, i18next, sonner, Playwright/browser verification.

---

## Scope Check

The approved spec spans multiple independent subsystems. This plan is a master execution plan with independently testable slices. Each slice can be implemented by a separate worker, but all workers must treat `web/default` as the source of truth and must not modify `web/default`.

The migration is complete only when every feature domain listed in `docs/superpowers/specs/2026-05-12-web-next-default-parity-design.md` is migrated or intentionally wrapped by a migrated module, `web/next` builds successfully, and representative browser checks pass.

## File Structure

### Shared Foundation Files

- Modify: `web/next/package.json` - add or confirm `typecheck`, i18n, and verification scripts.
- Modify: `web/next/src/lib/api.ts` - align axios behavior with `web/default/src/lib/api.ts`.
- Create: `web/next/src/lib/api-options.ts` - typed request opt-out flags for duplicate/business/error handling.
- Create: `web/next/src/lib/url-state.ts` - Next-compatible query-state helpers.
- Create: `web/next/src/lib/route-validation.ts` - section validation and default redirects.
- Create: `web/next/src/lib/parity/feature-manifest.ts` - static feature domain manifest.
- Create: `web/next/scripts/parity-audit.mjs` - local parity audit for routes, feature directories, and exact API call patterns.
- Modify: `web/next/src/components/layout/sidebar-nav.tsx` - align nav items, route visibility, and labels.
- Modify: `web/next/src/components/layout/authenticated-layout.tsx` - align auth guard, setup guard, shell layout, and mobile behavior.
- Modify: `web/next/src/components/layout/public-layout.tsx` - align public header, footer, title/logo behavior.
- Modify: `web/next/src/app/providers.tsx` - align provider stack.

### Feature Module Files

For each domain below, create or complete `web/next/src/features/<domain>` using the equivalent files in `web/default/src/features/<domain>` as the behavior reference:

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

Each migrated feature should have the same responsibility split where applicable:

```text
web/next/src/features/<domain>/
  api.ts
  types.ts
  constants.ts
  i18n.ts
  index.tsx
  components/
  hooks/
  lib/
```

### Route Wrapper Files

Modify the route pages under `web/next/src/app` so each route imports feature entry points instead of embedding business logic. Route wrappers must remain small and should only handle Next params/search params, layout routing, and redirects.

## Migration Protocol For Each Feature Domain

Use this protocol for every domain task:

1. Read the matching `web/default/src/features/<domain>` directory.
2. Read the matching `web/default/src/routes` files for the route behavior.
3. Read current `web/next/src/app` route pages for existing Next-specific behavior.
4. Port API/types/lib/hooks/components into `web/next/src/features/<domain>`.
5. Replace direct route-page business logic with thin wrappers.
6. Replace TanStack Router APIs with helpers from `web/next/src/lib/url-state.ts` and Next navigation APIs.
7. Replace `@/features` imports only after the target files exist.
8. Add missing i18n keys to all six locale files.
9. Run `bun run typecheck`.
10. Run `bun run build`.
11. Browser-check at least one primary route from the domain.
12. Commit the slice.

Workers must not remove existing user work. If a `web/next` file has existing logic, read it first and merge behavior instead of overwriting blindly.

---

### Task 1: Add Parity Audit And Shared Manifest

**Files:**
- Create: `web/next/scripts/parity-audit.mjs`
- Create: `web/next/src/lib/parity/feature-manifest.ts`
- Modify: `web/next/package.json`

- [ ] **Step 1: Write the failing parity audit script**

Use `apply_patch` to create `web/next/scripts/parity-audit.mjs`:

```javascript
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "../..");
const defaultRoot = path.join(repoRoot, "web/default/src");
const nextRoot = path.join(repoRoot, "web/next/src");

function walk(dir) {
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(full));
    else output.push(full);
  }
  return output;
}

function featureStats(root) {
  const features = path.join(root, "features");
  const rows = [];
  for (const entry of fs.readdirSync(features, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const files = walk(path.join(features, entry.name));
    rows.push({
      feature: entry.name,
      files: files.length,
      api: files.filter((file) => /api\.ts$/.test(file)).length,
      tsx: files.filter((file) => file.endsWith(".tsx")).length,
    });
  }
  return rows.sort((a, b) => a.feature.localeCompare(b.feature));
}

function endpoints(root) {
  const regex = /(?:api|axios)\.(get|post|put|patch|delete)\(\s*([`'"])([^`'"]+)/g;
  const map = new Map();
  for (const file of walk(root).filter((item) => /\.(ts|tsx)$/.test(item))) {
    const text = fs.readFileSync(file, "utf8");
    let match;
    while ((match = regex.exec(text))) {
      const endpoint = match[3];
      if (!endpoint.startsWith("/api") && !endpoint.startsWith("/v1")) continue;
      const key = `${match[1].toUpperCase()} ${endpoint}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(path.relative(root, file));
    }
  }
  return map;
}

const defaultFeatures = featureStats(defaultRoot);
const nextFeatures = featureStats(nextRoot);
const nextFeatureMap = new Map(nextFeatures.map((row) => [row.feature, row]));
const defaultEndpoints = endpoints(defaultRoot);
const nextEndpoints = endpoints(nextRoot);

const missingFeatureModules = defaultFeatures.filter((row) => {
  const next = nextFeatureMap.get(row.feature);
  return !next || next.files === 0;
});

const missingEndpoints = [...defaultEndpoints.keys()]
  .filter((key) => !nextEndpoints.has(key))
  .sort();

const report = {
  defaultFeatureCount: defaultFeatures.length,
  missingFeatureModules,
  defaultEndpointCount: defaultEndpoints.size,
  nextEndpointCount: nextEndpoints.size,
  missingEndpointCount: missingEndpoints.length,
  missingEndpoints,
};

console.log(JSON.stringify(report, null, 2));

if (process.argv.includes("--fail-on-gap")) {
  if (missingFeatureModules.length > 0 || missingEndpoints.length > 0) {
    process.exitCode = 1;
  }
}
```

- [ ] **Step 2: Run the audit and verify it fails on current gaps**

Run:

```bash
cd web/next
node scripts/parity-audit.mjs --fail-on-gap
```

Expected: exits non-zero and prints non-empty `missingFeatureModules` and `missingEndpoints`.

- [ ] **Step 3: Add the feature manifest**

Use `apply_patch` to create `web/next/src/lib/parity/feature-manifest.ts`:

```ts
export const featureDomains = [
  "about",
  "admin-tokens",
  "auth",
  "channels",
  "chat",
  "dashboard",
  "errors",
  "home",
  "invoices",
  "keys",
  "legal",
  "models",
  "performance-metrics",
  "playground",
  "pricing",
  "profile",
  "rankings",
  "redemption-codes",
  "setup",
  "subscriptions",
  "system-settings",
  "usage-logs",
  "users",
  "wallet",
] as const;

export type FeatureDomain = (typeof featureDomains)[number];
```

- [ ] **Step 4: Add scripts to `web/next/package.json`**

Modify `web/next/package.json` scripts so the block contains:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit",
  "parity:audit": "node scripts/parity-audit.mjs",
  "parity:audit:strict": "node scripts/parity-audit.mjs --fail-on-gap"
}
```

- [ ] **Step 5: Run verification for this task**

Run:

```bash
cd web/next
bun run typecheck
node scripts/parity-audit.mjs
```

Expected: typecheck passes or reports only pre-existing application errors unrelated to the new manifest/script. The audit prints a JSON report.

- [ ] **Step 6: Commit the audit foundation**

Run:

```bash
git add web/next/package.json web/next/scripts/parity-audit.mjs web/next/src/lib/parity/feature-manifest.ts
git commit -m "chore(web-next): add parity audit manifest"
```

Expected: commit succeeds with only the three listed files.

---

### Task 2: Normalize Shared API, URL State, Providers, And Layout

**Files:**
- Modify: `web/next/src/lib/api.ts`
- Create: `web/next/src/lib/api-options.ts`
- Create: `web/next/src/lib/url-state.ts`
- Create: `web/next/src/lib/route-validation.ts`
- Modify: `web/next/src/app/providers.tsx`
- Modify: `web/next/src/components/layout/authenticated-layout.tsx`
- Modify: `web/next/src/components/layout/public-layout.tsx`
- Modify: `web/next/src/components/layout/sidebar-nav.tsx`

- [ ] **Step 1: Add typed API option flags**

Use `apply_patch` to create `web/next/src/lib/api-options.ts`:

```ts
import type { AxiosRequestConfig } from "axios";

export type ApiRequestOptions = AxiosRequestConfig & {
  disableDuplicate?: boolean;
  skipBusinessError?: boolean;
  skipErrorHandler?: boolean;
};
```

- [ ] **Step 2: Replace `web/next/src/lib/api.ts` with default-compatible behavior**

Implement the same behavior as `web/default/src/lib/api.ts` adapted to the current `web/next` store exports:

```ts
import axios from "axios";
import i18next from "i18next";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiRequestOptions } from "@/lib/api-options";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: {
    "Cache-Control": "no-store",
  },
});

const inFlightGet = new Map<string, Promise<unknown>>();
const originalGet = api.get.bind(api);

api.get = ((url: string, config: ApiRequestOptions = {}) => {
  if (config.disableDuplicate) return originalGet(url, config);
  const params = config.params ? JSON.stringify(config.params) : "{}";
  const key = `${url}?${params}`;
  if (inFlightGet.has(key)) return inFlightGet.get(key) as ReturnType<typeof api.get>;
  const req = originalGet(url, config).finally(() => inFlightGet.delete(key));
  inFlightGet.set(key, req);
  return req;
}) as typeof api.get;

function getUserId(): string | null {
  try {
    if (typeof window !== "undefined") return window.localStorage.getItem("uid");
  } catch {
    return null;
  }
  return null;
}

export function getCommonHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const uid = getUserId();
  if (uid) headers["New-Api-User"] = uid;
  return headers;
}

api.interceptors.request.use((config) => {
  const uid = getUserId();
  if (uid) config.headers.set("New-Api-User", uid);
  return config;
});

api.interceptors.response.use(
  (response) => {
    const config = response.config as ApiRequestOptions;
    const data = response.data;
    if (!config.skipBusinessError && data && typeof data.success === "boolean" && !data.success) {
      toast.error(data.message || "Request failed");
    }
    return response;
  },
  (error) => {
    const config = error?.config as ApiRequestOptions | undefined;
    if (!config?.skipErrorHandler) {
      if (error?.response?.status === 401) {
        toast.error(i18next.t("Session expired!"));
        try {
          useAuthStore.getState().auth.reset();
        } catch {
          localStorage.removeItem("user");
        }
      } else {
        toast.error(error?.response?.data?.message || error?.message || "Request error");
      }
    }
    return Promise.reject(error);
  }
);

export async function getSelf() {
  const res = await api.get<ApiResponse>("/api/user/self", { skipErrorHandler: true } as ApiRequestOptions);
  return res.data;
}

export async function getUserModels() {
  const res = await api.get<ApiResponse<string[]>>("/api/user/models");
  return res.data;
}

export async function getUserGroups() {
  const res = await api.get<ApiResponse<Record<string, { desc: string; ratio: number | string }>>>("/api/user/self/groups");
  return res.data;
}

export async function getStatus() {
  const res = await api.get<ApiResponse<Record<string, unknown>>>("/api/status");
  return res.data?.data;
}

export async function getNotice() {
  const res = await api.get<ApiResponse<string>>("/api/notice");
  return res.data;
}

export default api;
```

- [ ] **Step 3: Add URL-state helpers**

Use `apply_patch` to create `web/next/src/lib/url-state.ts`:

```ts
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | number | boolean | null | undefined) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === null || value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setParams = useCallback(
    (values: Record<string, string | number | boolean | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(values)) {
        if (value === null || value === undefined || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { searchParams, setParam, setParams };
}

export function readNumberParam(
  params: URLSearchParams,
  key: string,
  fallback: number,
  options: { min?: number; max?: number } = {}
) {
  const raw = params.get(key);
  const parsed = raw == null ? fallback : Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  if (options.min !== undefined && parsed < options.min) return fallback;
  if (options.max !== undefined && parsed > options.max) return fallback;
  return parsed;
}
```

- [ ] **Step 4: Add route validation helpers**

Use `apply_patch` to create `web/next/src/lib/route-validation.ts`:

```ts
export function coerceSection<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  if (value && (allowed as readonly string[]).includes(value)) return value as T;
  return fallback;
}

export function isAllowedSection<T extends string>(
  value: string,
  allowed: readonly T[]
): value is T {
  return (allowed as readonly string[]).includes(value);
}
```

- [ ] **Step 5: Align provider and layout behavior**

Modify `web/next/src/app/providers.tsx`, `web/next/src/components/layout/authenticated-layout.tsx`, `web/next/src/components/layout/public-layout.tsx`, and `web/next/src/components/layout/sidebar-nav.tsx` so they preserve:

```ts
const requiredProviderOrder = [
  "i18n",
  "theme",
  "themeCustomization",
  "reactQuery",
  "authHydration",
  "systemConfig",
  "sonner",
] as const;
```

Use this order while keeping the existing component names and imports that already work in `web/next`.

- [ ] **Step 6: Run verification for this task**

Run:

```bash
cd web/next
bun run typecheck
bun run build
```

Expected: both commands pass. If the build fails from a pre-existing page unrelated to this task, fix that page only when the failure blocks the new shared foundation.

- [ ] **Step 7: Commit shared foundation**

Run:

```bash
git add web/next/src/lib/api.ts web/next/src/lib/api-options.ts web/next/src/lib/url-state.ts web/next/src/lib/route-validation.ts web/next/src/app/providers.tsx web/next/src/components/layout/authenticated-layout.tsx web/next/src/components/layout/public-layout.tsx web/next/src/components/layout/sidebar-nav.tsx
git commit -m "feat(web-next): align shared app foundation"
```

Expected: commit succeeds with only shared foundation files.

---

### Task 3: Migrate Public, Legal, Pricing, Rankings, Setup, And Error Routes

**Files:**
- Create/modify: `web/next/src/features/home/**`
- Create/modify: `web/next/src/features/about/**`
- Create/modify: `web/next/src/features/legal/**`
- Create/modify: `web/next/src/features/pricing/**`
- Create/modify: `web/next/src/features/rankings/**`
- Create/modify: `web/next/src/features/setup/**`
- Create/modify: `web/next/src/features/errors/**`
- Modify: `web/next/src/app/page.tsx`
- Modify: `web/next/src/app/about/page.tsx`
- Modify: `web/next/src/app/pricing/page.tsx`
- Modify: `web/next/src/app/pricing/[modelId]/page.tsx`
- Modify: `web/next/src/app/rankings/page.tsx`
- Modify: `web/next/src/app/privacy-policy/page.tsx`
- Modify: `web/next/src/app/user-agreement/page.tsx`
- Modify: `web/next/src/app/setup/page.tsx`
- Modify: `web/next/src/app/401/page.tsx`
- Modify: `web/next/src/app/403/page.tsx`
- Modify: `web/next/src/app/not-found.tsx`
- Modify: `web/next/src/app/error.tsx`
- Modify: `web/next/src/app/503/page.tsx`
- Modify: `web/next/src/i18n/locales/{en,zh,fr,ja,ru,vi}.json`

- [ ] **Step 1: Port public feature modules**

Use the migration protocol for these source directories:

```text
web/default/src/features/home
web/default/src/features/about
web/default/src/features/legal
web/default/src/features/pricing
web/default/src/features/rankings
web/default/src/features/setup
web/default/src/features/errors
```

Create the matching directories under `web/next/src/features`.

- [ ] **Step 2: Replace public route pages with thin wrappers**

Each route page should use this pattern, changing the imported component name per route:

```tsx
import { HomePage } from "@/features/home";

export default function Page() {
  return <HomePage />;
}
```

For dynamic pricing detail, use:

```tsx
import { ModelDetailsPage } from "@/features/pricing";

export default async function Page({
  params,
}: {
  params: Promise<{ modelId: string }>;
}) {
  const { modelId } = await params;
  return <ModelDetailsPage modelId={modelId} />;
}
```

- [ ] **Step 3: Preserve setup and compatibility redirects**

Confirm `web/next/src/app/setup/page.tsx` uses the migrated setup wizard and preserves setup-required behavior from `web/default/src/routes/setup/index.tsx` and `web/default/src/routes/__root.tsx`.

Confirm `/console/log` and `/console/topup` keep redirect behavior equivalent to:

```tsx
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/usage-logs");
}
```

and the wallet/top-up equivalent for `/console/topup`.

- [ ] **Step 4: Add locale keys**

For every restored public route string, add entries to:

```text
web/next/src/i18n/locales/en.json
web/next/src/i18n/locales/zh.json
web/next/src/i18n/locales/fr.json
web/next/src/i18n/locales/ja.json
web/next/src/i18n/locales/ru.json
web/next/src/i18n/locales/vi.json
```

Use the existing `web/default/src/i18n/locales` values as the translation source when the key already exists.

- [ ] **Step 5: Run public-route verification**

Run:

```bash
cd web/next
bun run typecheck
bun run build
node scripts/parity-audit.mjs
```

Expected: typecheck and build pass. The audit still reports gaps for domains assigned to subsequent tasks.

- [ ] **Step 6: Browser-check public routes**

Start the app:

```bash
cd web/next
bun run dev
```

Open these routes in the browser:

```text
http://localhost:3000/
http://localhost:3000/pricing
http://localhost:3000/rankings
http://localhost:3000/about
http://localhost:3000/setup
```

Expected: pages render without blank screens, layout overlap, or console errors caused by missing imports.

- [ ] **Step 7: Commit public route parity**

Run:

```bash
git add web/next/src/features/home web/next/src/features/about web/next/src/features/legal web/next/src/features/pricing web/next/src/features/rankings web/next/src/features/setup web/next/src/features/errors web/next/src/app web/next/src/i18n/locales
git commit -m "feat(web-next): restore public route parity"
```

Expected: commit succeeds.

---

### Task 4: Migrate Auth, OAuth, Passkey, Secure Verification, And Setup Guards

**Files:**
- Create/modify: `web/next/src/features/auth/**`
- Modify: `web/next/src/app/sign-in/page.tsx`
- Modify: `web/next/src/app/sign-up/page.tsx`
- Modify: `web/next/src/app/forgot-password/page.tsx`
- Modify: `web/next/src/app/reset/page.tsx`
- Modify: `web/next/src/app/otp/page.tsx`
- Modify: `web/next/src/app/oauth/page.tsx`
- Modify: `web/next/src/app/oauth/[provider]/page.tsx`
- Modify: `web/next/src/app/user/reset/page.tsx`
- Modify: `web/next/src/components/auth-guard.tsx`
- Modify: `web/next/src/stores/auth-store.ts`
- Modify: `web/next/src/i18n/locales/{en,zh,fr,ja,ru,vi}.json`

- [ ] **Step 1: Port auth modules**

Use the migration protocol for:

```text
web/default/src/features/auth
web/default/src/routes/(auth)
web/default/src/routes/oauth/$provider.tsx
```

Create matching files under `web/next/src/features/auth`.

- [ ] **Step 2: Replace auth route pages with wrappers**

Use this wrapper shape:

```tsx
import { SignInPage } from "@/features/auth/sign-in";

export default function Page() {
  return <SignInPage />;
}
```

For `/oauth/[provider]`, adapt params:

```tsx
import { ProviderOAuthPage } from "@/features/auth";

export default async function Page({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider } = await params;
  return <ProviderOAuthPage provider={provider} />;
}
```

- [ ] **Step 3: Preserve auth store semantics**

Confirm `web/next/src/stores/auth-store.ts` exposes the same calls required by default auth components:

```ts
type AuthActions = {
  setUser: (user: unknown) => void;
  reset: () => void;
};
```

If the existing store has different names, add adapter actions instead of changing all migrated callers.

- [ ] **Step 4: Verify passkey browser API usage**

Search for passkey calls:

```bash
rg -n "navigator.credentials|PublicKeyCredential|passkey" web/next/src/features/auth web/next/src/app
```

Expected: browser API usage only runs inside client components and event handlers.

- [ ] **Step 5: Run auth verification**

Run:

```bash
cd web/next
bun run typecheck
bun run build
```

Expected: both pass.

- [ ] **Step 6: Browser-check auth routes**

Open:

```text
http://localhost:3000/sign-in
http://localhost:3000/sign-up
http://localhost:3000/forgot-password
http://localhost:3000/otp
```

Expected: forms render, legal consent renders where enabled, and no passkey or Turnstile code runs before user interaction.

- [ ] **Step 7: Commit auth parity**

Run:

```bash
git add web/next/src/features/auth web/next/src/app/sign-in web/next/src/app/sign-up web/next/src/app/forgot-password web/next/src/app/reset web/next/src/app/otp web/next/src/app/oauth web/next/src/app/user/reset web/next/src/components/auth-guard.tsx web/next/src/stores/auth-store.ts web/next/src/i18n/locales
git commit -m "feat(web-next): restore auth flow parity"
```

Expected: commit succeeds.

---

### Task 5: Migrate Shared Data Tables And Simple Admin CRUD Domains

**Files:**
- Create/modify: `web/next/src/components/data-table/**`
- Create/modify: `web/next/src/features/keys/**`
- Create/modify: `web/next/src/features/admin-tokens/**`
- Create/modify: `web/next/src/features/redemption-codes/**`
- Modify: `web/next/src/app/(app)/keys/page.tsx`
- Modify: `web/next/src/app/(app)/admin-tokens/page.tsx`
- Modify: `web/next/src/app/(app)/redemption-codes/page.tsx`
- Modify: `web/next/src/i18n/locales/{en,zh,fr,ja,ru,vi}.json`

- [ ] **Step 1: Port shared table primitives**

Use the migration protocol for:

```text
web/default/src/components/data-table
web/default/src/components/status-badge.tsx
web/default/src/components/group-badge.tsx
web/default/src/components/masked-value-display.tsx
web/default/src/components/copy-button.tsx
```

Merge with the existing `web/next/src/components/data-table` files rather than deleting working Next code.

- [ ] **Step 2: Port keys, admin tokens, and redemption codes**

Use the migration protocol for:

```text
web/default/src/features/keys
web/default/src/features/admin-tokens
web/default/src/features/redemption-codes
```

- [ ] **Step 3: Replace route pages with wrappers**

Use:

```tsx
import { KeysPage } from "@/features/keys";

export default function Page() {
  return <KeysPage />;
}
```

Repeat with `AdminTokensPage` and `RedemptionCodesPage`.

- [ ] **Step 4: Verify CRUD endpoint parity**

Run:

```bash
cd web/next
node scripts/parity-audit.mjs | rg "token|redemption|admin/token" -n
```

Expected: exact endpoint gaps for token, redemption, and admin token APIs are removed or reduced to dynamic string formatting differences that map to the same backend path.

- [ ] **Step 5: Run build verification**

Run:

```bash
cd web/next
bun run typecheck
bun run build
```

Expected: both pass.

- [ ] **Step 6: Browser-check CRUD pages**

Open:

```text
http://localhost:3000/keys
http://localhost:3000/admin-tokens
http://localhost:3000/redemption-codes
```

Expected: unauthenticated users are redirected or blocked according to auth guard behavior. With an admin session, tables render, dialogs open, and destructive actions require confirmation.

- [ ] **Step 7: Commit CRUD parity**

Run:

```bash
git add web/next/src/components/data-table web/next/src/features/keys web/next/src/features/admin-tokens web/next/src/features/redemption-codes web/next/src/app/\\(app\\)/keys web/next/src/app/\\(app\\)/admin-tokens web/next/src/app/\\(app\\)/redemption-codes web/next/src/i18n/locales
git commit -m "feat(web-next): restore key and token management parity"
```

Expected: commit succeeds.

---

### Task 6: Migrate Dashboard, Performance Metrics, Playground, And Chat

**Files:**
- Create/modify: `web/next/src/features/dashboard/**`
- Create/modify: `web/next/src/features/performance-metrics/**`
- Create/modify: `web/next/src/features/playground/**`
- Create/modify: `web/next/src/features/chat/**`
- Create/modify: `web/next/src/components/ai-elements/**`
- Modify: `web/next/src/app/(app)/dashboard/page.tsx`
- Modify: `web/next/src/app/(app)/dashboard/[section]/page.tsx`
- Modify: `web/next/src/app/(app)/performance-metrics/page.tsx`
- Modify: `web/next/src/app/(app)/playground/page.tsx`
- Modify: `web/next/src/app/(app)/chat/[chatId]/page.tsx`
- Modify: `web/next/src/app/(app)/chat2link/page.tsx`
- Modify: `web/next/src/i18n/locales/{en,zh,fr,ja,ru,vi}.json`

- [ ] **Step 1: Port dashboard and performance modules**

Use the migration protocol for:

```text
web/default/src/features/dashboard
web/default/src/features/performance-metrics
```

Preserve dashboard sections `overview`, `models`, and `users` with admin-only gating for `users`.

- [ ] **Step 2: Port playground, chat, and AI elements**

Use the migration protocol for:

```text
web/default/src/features/playground
web/default/src/features/chat
web/default/src/components/ai-elements
```

Ensure streaming calls keep `getCommonHeaders()` and preserve cancellation behavior.

- [ ] **Step 3: Replace route pages with wrappers**

Use wrappers that pass params:

```tsx
import { DashboardSectionPage } from "@/features/dashboard";

export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <DashboardSectionPage section={section} />;
}
```

- [ ] **Step 4: Verify streaming code stays client-only**

Run:

```bash
rg -n "EventSource|SSE|AbortController|fetch\\(\"/v1/chat/completions" web/next/src/features/playground web/next/src/features/chat web/next/src/components/ai-elements
```

Expected: streaming code is in client components or hooks and uses abort/cancel state from the migrated default logic.

- [ ] **Step 5: Run build verification**

Run:

```bash
cd web/next
bun run typecheck
bun run build
```

Expected: both pass.

- [ ] **Step 6: Browser-check console routes**

Open:

```text
http://localhost:3000/dashboard
http://localhost:3000/dashboard/models
http://localhost:3000/playground
http://localhost:3000/performance-metrics
```

Expected: pages render without blank states caused by missing modules. Playground input should be interactive even without sending a message.

- [ ] **Step 7: Commit dashboard and playground parity**

Run:

```bash
git add web/next/src/features/dashboard web/next/src/features/performance-metrics web/next/src/features/playground web/next/src/features/chat web/next/src/components/ai-elements web/next/src/app/\\(app\\)/dashboard web/next/src/app/\\(app\\)/performance-metrics web/next/src/app/\\(app\\)/playground web/next/src/app/\\(app\\)/chat web/next/src/app/\\(app\\)/chat2link web/next/src/i18n/locales
git commit -m "feat(web-next): restore dashboard playground and chat parity"
```

Expected: commit succeeds.

---

### Task 7: Migrate Wallet, Subscriptions, Invoices, And Profile

**Files:**
- Create/modify: `web/next/src/features/wallet/**`
- Create/modify: `web/next/src/features/subscriptions/**`
- Create/modify: `web/next/src/features/invoices/**`
- Create/modify: `web/next/src/features/profile/**`
- Modify: `web/next/src/app/(app)/wallet/page.tsx`
- Modify: `web/next/src/app/(app)/wallet/topup/page.tsx`
- Modify: `web/next/src/app/(app)/wallet/success/page.tsx`
- Modify: `web/next/src/app/(app)/wallet/cancel/page.tsx`
- Modify: `web/next/src/app/(app)/subscriptions/page.tsx`
- Modify: `web/next/src/app/(app)/my-subscriptions/page.tsx`
- Modify: `web/next/src/app/(app)/invoices/page.tsx`
- Modify: `web/next/src/app/(app)/profile/page.tsx`
- Modify: `web/next/src/i18n/locales/{en,zh,fr,ja,ru,vi}.json`

- [ ] **Step 1: Port wallet and payment modules**

Use the migration protocol for:

```text
web/default/src/features/wallet
```

Preserve Epay, Stripe, Creem, Waffo, Waffo Pancake, affiliate, billing history, payment confirm, and URL cleanup behavior.

- [ ] **Step 2: Port subscriptions modules**

Use the migration protocol for:

```text
web/default/src/features/subscriptions
```

Preserve admin plan CRUD, user subscription assignment, self subscriptions, purchase dialogs, billing preference, and payment APIs.

- [ ] **Step 3: Port invoices modules**

Use the migration protocol for:

```text
web/default/src/features/invoices
```

Preserve eligible records, invoice profile, real-name status/session, submit confirmation, user history, and admin approve/reject/issue actions.

- [ ] **Step 4: Port profile modules**

Use the migration protocol for:

```text
web/default/src/features/profile
```

Preserve 2FA, passkeys, access token, check-in calendar, OAuth bindings, language preferences, notification tab, password change, and account deletion.

- [ ] **Step 5: Verify sensitive browser APIs**

Run:

```bash
rg -n "navigator.credentials|window.location|document.createElement\\(\"form\"\\)|localStorage" web/next/src/features/wallet web/next/src/features/profile web/next/src/features/subscriptions web/next/src/features/invoices
```

Expected: browser-only APIs appear only in client components, hooks, or guarded code paths.

- [ ] **Step 6: Run build verification**

Run:

```bash
cd web/next
bun run typecheck
bun run build
```

Expected: both pass.

- [ ] **Step 7: Browser-check user account routes**

Open:

```text
http://localhost:3000/wallet
http://localhost:3000/my-subscriptions
http://localhost:3000/invoices
http://localhost:3000/profile
```

Expected: auth guard works, account pages render, dialogs open, and destructive actions require confirmation.

- [ ] **Step 8: Commit account and billing parity**

Run:

```bash
git add web/next/src/features/wallet web/next/src/features/subscriptions web/next/src/features/invoices web/next/src/features/profile web/next/src/app/\\(app\\)/wallet web/next/src/app/\\(app\\)/subscriptions web/next/src/app/\\(app\\)/my-subscriptions web/next/src/app/\\(app\\)/invoices web/next/src/app/\\(app\\)/profile web/next/src/i18n/locales
git commit -m "feat(web-next): restore account billing parity"
```

Expected: commit succeeds.

---

### Task 8: Migrate Channels

**Files:**
- Create/modify: `web/next/src/features/channels/**`
- Modify: `web/next/src/app/(app)/channels/page.tsx`
- Modify: `web/next/src/app/(app)/channels/codex-oauth-dialog.tsx`
- Modify: `web/next/src/app/(app)/channels/multi-key-dialog.tsx`
- Modify: `web/next/src/app/(app)/channels/ollama-dialog.tsx`
- Modify: `web/next/src/app/(app)/channels/tag-operations-dialog.tsx`
- Modify: `web/next/src/i18n/locales/{en,zh,fr,ja,ru,vi}.json`

- [ ] **Step 1: Port channel modules**

Use the migration protocol for:

```text
web/default/src/features/channels
```

Include channel type config, form validation, upstream updates, status-code risk guard, model mapping, multi-key utilities, Ollama utilities, and all dialogs/drawers.

- [ ] **Step 2: Move app-local dialogs into the feature module**

Move existing Next app-local channel dialogs into:

```text
web/next/src/features/channels/components/dialogs/codex-oauth-dialog.tsx
web/next/src/features/channels/components/dialogs/multi-key-manage-dialog.tsx
web/next/src/features/channels/components/dialogs/ollama-models-dialog.tsx
web/next/src/features/channels/components/dialogs/tag-batch-edit-dialog.tsx
```

Update imports from `web/next/src/app/(app)/channels/page.tsx` to use `@/features/channels`.

- [ ] **Step 3: Replace `/channels` route page with a wrapper**

Use:

```tsx
import { ChannelsPage } from "@/features/channels";

export default function Page() {
  return <ChannelsPage />;
}
```

- [ ] **Step 4: Verify channel endpoint parity**

Run:

```bash
cd web/next
node scripts/parity-audit.mjs | rg "channel" -n
```

Expected: channel endpoint gaps are removed or reduced to equivalent dynamic path formatting.

- [ ] **Step 5: Run build verification**

Run:

```bash
cd web/next
bun run typecheck
bun run build
```

Expected: both pass.

- [ ] **Step 6: Browser-check channel workflows**

Open:

```text
http://localhost:3000/channels
```

Expected: table renders for admins, create/edit drawer opens, tag operations open, multi-key dialog opens, and Ollama dialog opens without missing imports.

- [ ] **Step 7: Commit channel parity**

Run:

```bash
git add web/next/src/features/channels web/next/src/app/\\(app\\)/channels web/next/src/i18n/locales
git commit -m "feat(web-next): restore channel management parity"
```

Expected: commit succeeds.

---

### Task 9: Migrate Models And Deployments

**Files:**
- Create/modify: `web/next/src/features/models/**`
- Modify: `web/next/src/app/(app)/models/page.tsx`
- Modify: `web/next/src/app/(app)/models/[section]/page.tsx`
- Modify: `web/next/src/i18n/locales/{en,zh,fr,ja,ru,vi}.json`

- [ ] **Step 1: Port model modules**

Use the migration protocol for:

```text
web/default/src/features/models
```

Include metadata CRUD, vendors, upstream sync, missing models, prefill groups, deployments, deployment settings, logs, containers, hardware types, locations, replica availability, price estimation, update config, rename, extend, delete, and deployment access guard.

- [ ] **Step 2: Replace model route pages with wrappers**

Use:

```tsx
import { ModelsPage } from "@/features/models";

export default function Page() {
  return <ModelsPage />;
}
```

For dynamic sections:

```tsx
import { ModelsSectionPage } from "@/features/models";

export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <ModelsSectionPage section={section} />;
}
```

- [ ] **Step 3: Validate supported model sections**

Ensure `web/next/src/features/models/section-registry.tsx` accepts:

```ts
export const modelSectionIds = ["metadata", "deployments"] as const;
```

If `vendors`, `prefill-groups`, or `sync` remain separate routes in current Next code, fold them into the default-equivalent model UI instead of creating non-default primary sections.

- [ ] **Step 4: Verify model endpoint parity**

Run:

```bash
cd web/next
node scripts/parity-audit.mjs | rg "models|vendors|deployments|prefill" -n
```

Expected: model, vendor, deployment, and prefill group endpoint gaps are removed or reduced to equivalent dynamic path formatting.

- [ ] **Step 5: Run build verification**

Run:

```bash
cd web/next
bun run typecheck
bun run build
```

Expected: both pass.

- [ ] **Step 6: Browser-check model workflows**

Open:

```text
http://localhost:3000/models
http://localhost:3000/models/deployments
```

Expected: metadata and deployments surfaces render, dialogs open, and no default feature is represented only by a static message.

- [ ] **Step 7: Commit model parity**

Run:

```bash
git add web/next/src/features/models web/next/src/app/\\(app\\)/models web/next/src/i18n/locales
git commit -m "feat(web-next): restore model and deployment parity"
```

Expected: commit succeeds.

---

### Task 10: Migrate Users, Usage Logs, And Log Previews

**Files:**
- Create/modify: `web/next/src/features/users/**`
- Create/modify: `web/next/src/features/usage-logs/**`
- Modify: `web/next/src/app/(app)/users/page.tsx`
- Modify: `web/next/src/app/(app)/usage-logs/page.tsx`
- Modify: `web/next/src/app/(app)/usage-logs/[section]/page.tsx`
- Modify: `web/next/src/i18n/locales/{en,zh,fr,ja,ru,vi}.json`

- [ ] **Step 1: Port users modules**

Use the migration protocol for:

```text
web/default/src/features/users
```

Preserve user search, group filters, create/edit, status/role/quota actions, passkey reset, 2FA reset, OAuth binding cleanup, custom OAuth unbind, and deleted-user state display.

- [ ] **Step 2: Port usage logs modules**

Use the migration protocol for:

```text
web/default/src/features/usage-logs
```

Preserve common logs, drawing logs, task logs, stats, filters, compact date range picker, model badge, image/audio/prompt previews, details, fail reason, user info dialogs, and table columns.

- [ ] **Step 3: Replace route pages with wrappers**

Use:

```tsx
import { UsageLogsPage } from "@/features/usage-logs";

export default function Page() {
  return <UsageLogsPage />;
}
```

For dynamic sections:

```tsx
import { UsageLogsSectionPage } from "@/features/usage-logs";

export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <UsageLogsSectionPage section={section} />;
}
```

- [ ] **Step 4: Remove static coming-soon log messages**

Search:

```bash
rg -n "coming soon|see /usage-logs for full view" web/next/src/app web/next/src/features/usage-logs
```

Expected: no usage-log section is represented by a static coming-soon message.

- [ ] **Step 5: Run build verification**

Run:

```bash
cd web/next
bun run typecheck
bun run build
```

Expected: both pass.

- [ ] **Step 6: Browser-check users and logs**

Open:

```text
http://localhost:3000/users
http://localhost:3000/usage-logs
http://localhost:3000/usage-logs/drawing
http://localhost:3000/usage-logs/task
```

Expected: all log sections render real filters/table states and users page renders admin management actions.

- [ ] **Step 7: Commit users and logs parity**

Run:

```bash
git add web/next/src/features/users web/next/src/features/usage-logs web/next/src/app/\\(app\\)/users web/next/src/app/\\(app\\)/usage-logs web/next/src/i18n/locales
git commit -m "feat(web-next): restore users and usage logs parity"
```

Expected: commit succeeds.

---

### Task 11: Migrate System Settings Shell And Simple Sections

**Files:**
- Create/modify: `web/next/src/features/system-settings/api.ts`
- Create/modify: `web/next/src/features/system-settings/types.ts`
- Create/modify: `web/next/src/features/system-settings/components/**`
- Create/modify: `web/next/src/features/system-settings/hooks/**`
- Create/modify: `web/next/src/features/system-settings/utils/**`
- Create/modify: `web/next/src/features/system-settings/site/**`
- Create/modify: `web/next/src/features/system-settings/auth/**`
- Create/modify: `web/next/src/features/system-settings/content/**`
- Create/modify: `web/next/src/features/system-settings/operations/**`
- Modify: `web/next/src/app/(app)/system-settings/**`
- Modify: `web/next/src/i18n/locales/{en,zh,fr,ja,ru,vi}.json`

- [ ] **Step 1: Port the settings foundation**

Use the migration protocol for:

```text
web/default/src/features/system-settings/api.ts
web/default/src/features/system-settings/types.ts
web/default/src/features/system-settings/components
web/default/src/features/system-settings/hooks
web/default/src/features/system-settings/utils
```

Preserve form dirty indicators, navigation guard, reset behavior, safe JSON state, system options query, and update option mutation.

- [ ] **Step 2: Port site, auth, content, and operations sections**

Use the migration protocol for:

```text
web/default/src/features/system-settings/site
web/default/src/features/system-settings/auth
web/default/src/features/system-settings/content
web/default/src/features/system-settings/operations
web/default/src/features/system-settings/maintenance
web/default/src/features/system-settings/integrations/email-settings-section.tsx
web/default/src/features/system-settings/integrations/monitoring-settings-section.tsx
web/default/src/features/system-settings/integrations/worker-settings-section.tsx
```

Preserve specialized sections for header navigation, sidebar modules, custom OAuth, announcements, API info, FAQ, Uptime Kuma, chat presets, drawing, update checker, performance, logs, SMTP, worker, and monitoring.

- [ ] **Step 3: Replace system settings route pages with wrappers**

Use:

```tsx
import { SystemSettingsSectionPage } from "@/features/system-settings";

export default async function Page({
  params,
}: {
  params: Promise<{ section?: string }>;
}) {
  const { section } = await params;
  return <SystemSettingsSectionPage section={section} />;
}
```

For group routes, pass both group and section:

```tsx
import { SystemSettingsGroupPage } from "@/features/system-settings";

export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <SystemSettingsGroupPage group="auth" section={section} />;
}
```

- [ ] **Step 4: Verify settings route validation**

Run:

```bash
rg -n "SITE_SECTION_IDS|AUTH_SECTION_IDS|CONTENT_SECTION_IDS|OPERATIONS_SECTION_IDS|coerceSection" web/next/src/features/system-settings web/next/src/app/\\(app\\)/system-settings
```

Expected: each group has explicit allowed IDs and invalid IDs route to the default section or not-found behavior matching default.

- [ ] **Step 5: Run build verification**

Run:

```bash
cd web/next
bun run typecheck
bun run build
```

Expected: both pass.

- [ ] **Step 6: Browser-check simple settings groups**

Open:

```text
http://localhost:3000/system-settings/site/system-info
http://localhost:3000/system-settings/auth/basic-auth
http://localhost:3000/system-settings/content/dashboard
http://localhost:3000/system-settings/operations/behavior
```

Expected: settings load, save buttons work with dirty state, and navigation does not drop unsaved changes without the migrated guard.

- [ ] **Step 7: Commit system settings foundation**

Run:

```bash
git add web/next/src/features/system-settings web/next/src/app/\\(app\\)/system-settings web/next/src/i18n/locales
git commit -m "feat(web-next): restore system settings foundation"
```

Expected: commit succeeds.

---

### Task 12: Migrate Billing, Model Routing, Security, And Specialized Settings Editors

**Files:**
- Create/modify: `web/next/src/features/system-settings/billing/**`
- Create/modify: `web/next/src/features/system-settings/general/**`
- Create/modify: `web/next/src/features/system-settings/integrations/**`
- Create/modify: `web/next/src/features/system-settings/models/**`
- Create/modify: `web/next/src/features/system-settings/request-limits/**`
- Create/modify: `web/next/src/features/system-settings/security/**`
- Modify: `web/next/src/app/(app)/system-settings/billing/**`
- Modify: `web/next/src/app/(app)/system-settings/models/**`
- Modify: `web/next/src/app/(app)/system-settings/security/**`
- Modify: `web/next/src/i18n/locales/{en,zh,fr,ja,ru,vi}.json`

- [ ] **Step 1: Read billing expression design**

Run:

```bash
sed -n '1,260p' pkg/billingexpr/expr.md
```

Expected: output describes the billing expression language, token normalization rules, expression versioning, and editor/storage/pre-consume/settlement flow. Keep these rules in mind when migrating tiered billing editors.

- [ ] **Step 2: Port billing settings and visual editors**

Use the migration protocol for:

```text
web/default/src/features/system-settings/billing
web/default/src/features/system-settings/general/checkin-settings-section.tsx
web/default/src/features/system-settings/general/pricing-section.tsx
web/default/src/features/system-settings/general/quota-settings-section.tsx
web/default/src/features/system-settings/integrations/payment-settings-section.tsx
web/default/src/features/system-settings/integrations/amount-discount-dialog.tsx
web/default/src/features/system-settings/integrations/amount-discount-visual-editor.tsx
web/default/src/features/system-settings/integrations/amount-options-visual-editor.tsx
web/default/src/features/system-settings/integrations/creem-product-dialog.tsx
web/default/src/features/system-settings/integrations/creem-products-visual-editor.tsx
web/default/src/features/system-settings/integrations/payment-method-dialog.tsx
web/default/src/features/system-settings/integrations/payment-methods-visual-editor.tsx
web/default/src/features/system-settings/integrations/waffo-settings-section.tsx
web/default/src/features/system-settings/integrations/waffo-pancake-settings-section.tsx
```

- [ ] **Step 3: Port model routing settings**

Use the migration protocol for:

```text
web/default/src/features/system-settings/models
web/default/src/features/system-settings/general/channel-affinity
web/default/src/features/system-settings/integrations/ionet-deployment-settings-section.tsx
```

Preserve model ratio editors, group ratio editors, billing expression editor, model pricing sheet, tool prices, upstream ratio sync, channel selector, conflicts, channel affinity rules, and cache stats.

- [ ] **Step 4: Port security and request limit settings**

Use the migration protocol for:

```text
web/default/src/features/system-settings/security
web/default/src/features/system-settings/request-limits
```

Preserve rate limit visual editor, sensitive words, SSRF settings, domain/IP modes, allowed ports, and model request rate-limit group JSON behavior.

- [ ] **Step 5: Verify specialized editors are not reduced to textarea-only forms**

Run:

```bash
rg -n "VisualEditor|visual-editor|Tiered|tiered|channel-affinity|payment-method|amount-options|rate-limit" web/next/src/features/system-settings
```

Expected: output includes migrated specialized editor components for billing, payment, model routing, channel affinity, and request limits.

- [ ] **Step 6: Run build verification**

Run:

```bash
cd web/next
bun run typecheck
bun run build
```

Expected: both pass.

- [ ] **Step 7: Browser-check specialized settings**

Open:

```text
http://localhost:3000/system-settings/billing/model-pricing
http://localhost:3000/system-settings/billing/payment
http://localhost:3000/system-settings/models/channel-affinity
http://localhost:3000/system-settings/security/rate-limit
```

Expected: visual editors render, dialogs open, JSON validation errors are visible, and save actions preserve the default payload shapes.

- [ ] **Step 8: Commit specialized settings parity**

Run:

```bash
git add web/next/src/features/system-settings web/next/src/app/\\(app\\)/system-settings web/next/src/i18n/locales
git commit -m "feat(web-next): restore specialized settings parity"
```

Expected: commit succeeds.

---

### Task 13: Complete I18n Parity

**Files:**
- Modify: `web/next/src/i18n/locales/en.json`
- Modify: `web/next/src/i18n/locales/zh.json`
- Modify: `web/next/src/i18n/locales/fr.json`
- Modify: `web/next/src/i18n/locales/ja.json`
- Modify: `web/next/src/i18n/locales/ru.json`
- Modify: `web/next/src/i18n/locales/vi.json`
- Create: `web/next/scripts/find-missing-i18n.mjs`

- [ ] **Step 1: Add a missing-key checker for `web/next`**

Use `apply_patch` to create `web/next/scripts/find-missing-i18n.mjs`:

```javascript
import fs from "node:fs/promises";
import path from "node:path";

const srcDir = path.resolve("src");
const localesDir = path.resolve("src/i18n/locales");
const locales = ["en", "zh", "fr", "ja", "ru", "vi"];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "locales"].includes(entry.name)) continue;
      files.push(...(await walk(full)));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const localeMaps = {};
for (const locale of locales) {
  const json = JSON.parse(await fs.readFile(path.join(localesDir, `${locale}.json`), "utf8"));
  localeMaps[locale] = json.translation ?? json;
}

const keys = new Set();
const tCall = /\bt\(\s*["'`]([^"'`\n]+?)["'`]/g;
for (const file of await walk(srcDir)) {
  const text = await fs.readFile(file, "utf8");
  let match;
  while ((match = tCall.exec(text))) {
    if (!match[1].includes("${")) keys.add(match[1]);
  }
}

let missing = 0;
for (const key of [...keys].sort()) {
  for (const locale of locales) {
    if (!(key in localeMaps[locale])) {
      console.log(`${locale}: ${key}`);
      missing += 1;
    }
  }
}

if (missing > 0) process.exitCode = 1;
else console.log("All i18n keys are present.");
```

- [ ] **Step 2: Add script entry**

Modify `web/next/package.json` scripts so it includes:

```json
{
  "i18n:check": "node scripts/find-missing-i18n.mjs"
}
```

- [ ] **Step 3: Run i18n check and fill missing keys**

Run:

```bash
cd web/next
bun run i18n:check
```

Expected: command passes. If it prints missing keys, add those exact keys to all six locale files, using existing translations from `web/default/src/i18n/locales` when available.

- [ ] **Step 4: Verify locale JSON parses**

Run:

```bash
cd web/next
node -e 'for (const l of ["en","zh","fr","ja","ru","vi"]) JSON.parse(require("fs").readFileSync(`src/i18n/locales/${l}.json`, "utf8")); console.log("ok")'
```

Expected: prints `ok`.

- [ ] **Step 5: Commit i18n parity**

Run:

```bash
git add web/next/package.json web/next/scripts/find-missing-i18n.mjs web/next/src/i18n/locales
git commit -m "chore(web-next): complete i18n parity checks"
```

Expected: commit succeeds.

---

### Task 14: Final Parity Hardening And Browser Verification

**Files:**
- Modify only files needed to fix failures found by verification.

- [ ] **Step 1: Run strict parity audit**

Run:

```bash
cd web/next
bun run parity:audit:strict
```

Expected: exits 0. If it exits non-zero, inspect the JSON report and migrate the missing feature module or endpoint before continuing.

- [ ] **Step 2: Run full static verification**

Run:

```bash
cd web/next
bun run typecheck
bun run build
bun run i18n:check
```

Expected: all commands pass.

- [ ] **Step 3: Start the local app**

Run:

```bash
cd web/next
bun run dev
```

Expected: dev server starts and prints a local URL.

- [ ] **Step 4: Browser-check public routes**

Open:

```text
/
/pricing
/rankings
/about
/privacy-policy
/user-agreement
```

Expected: each route renders, navigation works, and there is no layout overlap at desktop and mobile widths.

- [ ] **Step 5: Browser-check auth routes**

Open:

```text
/sign-in
/sign-up
/forgot-password
/otp
/reset
```

Expected: forms render, validation messages show, and redirects preserve `redirect` search params.

- [ ] **Step 6: Browser-check user routes**

Open:

```text
/dashboard
/playground
/keys
/usage-logs
/usage-logs/drawing
/wallet
/my-subscriptions
/invoices
/profile
```

Expected: auth guard behavior is correct, real content renders, dialogs open, and no section shows only static coming-soon text.

- [ ] **Step 7: Browser-check admin routes**

Open with an admin session:

```text
/channels
/models
/models/deployments
/users
/redemption-codes
/subscriptions
/admin-tokens
/performance-metrics
```

Expected: tables render, primary create/edit dialogs open, destructive flows require confirmation, and admin-only routes are inaccessible to non-admin users.

- [ ] **Step 8: Browser-check system settings routes**

Open with an admin session:

```text
/system-settings/site/system-info
/system-settings/auth/oauth
/system-settings/billing/model-pricing
/system-settings/billing/payment
/system-settings/models/channel-affinity
/system-settings/security/rate-limit
/system-settings/content/chat
/system-settings/operations/performance
```

Expected: settings load, dirty guard works, visual editors render, JSON validation works, and save payloads match default feature API modules.

- [ ] **Step 9: Commit final fixes**

Run:

```bash
git status --short
git add web/next
git commit -m "fix(web-next): harden default parity verification"
```

Expected: commit succeeds if final verification produced fixes. If `git status --short` is empty, skip the commit and record that no final fixes were needed.

## Self-Review Checklist

- Spec coverage: tasks cover shared foundation, public routes, auth, user console, admin console, channels, models, users, logs, system settings, i18n, and final verification.
- Protected identifiers: no task asks workers to remove or rename protected project or organization identifiers.
- Billing expression: Task 12 explicitly requires reading `pkg/billingexpr/expr.md` before billing editor work.
- No default edits: every task treats `web/default` as read-only.
- Verification: every slice has typecheck/build plus browser checks for representative routes.
- Commit cadence: every slice ends with an explicit commit.
