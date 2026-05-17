# Subscription Plans Public Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independent public `/subscription-plans` catalog page that anonymous users can browse, backed by a new public Go endpoint returning all enabled subscription plans.

**Architecture:** The Go backend exposes a narrowly scoped anonymous endpoint under `/api/subscription/public/plans`. The React frontend adds an independent `subscription-plans` feature and route, with top navigation controlled by a new `HeaderNavModules.subscriptions` module. Existing admin `/subscriptions`, personal `/my-subscriptions`, and payment-dialog flows remain untouched.

**Tech Stack:** Go 1.22+, Gin, GORM, React 19, TypeScript, TanStack Router, React Query, Base UI/shadcn-style components, Tailwind CSS, i18next, Bun.

---

## File Map

Backend:

- Modify `controller/subscription.go`: add `GetPublicSubscriptionPlans`, mirroring `GetSubscriptionPlans` but without auth and without `show_on_home` filtering.
- Modify `router/api-router.go`: register `GET /api/subscription/public/plans` in the anonymous subscription route group.
- Modify `router/api_router_test.go`: add tests for anonymous access, enabled-only filtering, `show_on_home = false` inclusion, and payment-compliance empty response.

Frontend navigation and routing:

- Modify `web/default/src/lib/nav-modules.ts`: add the `subscriptions` access module to runtime parsing and fresh access lookup.
- Modify `web/default/src/hooks/use-top-nav-links.ts`: insert `Subscription Plans` immediately after `Model Square`.
- Modify `web/default/src/features/system-settings/maintenance/config.ts`: add `subscriptions` to header navigation defaults and parsing.
- Modify `web/default/src/features/system-settings/maintenance/header-navigation-section.tsx`: add system-settings controls for enabling and requiring login for subscription plans.
- Modify `web/default/src/i18n/static-keys.ts`: add dynamic navigation/settings strings.
- Create `web/default/src/routes/subscription-plans/index.tsx`: public route with module guard.

Frontend feature:

- Create `web/default/src/features/subscription-plans/api.ts`: fetch `/api/subscription/public/plans`.
- Create `web/default/src/features/subscription-plans/components/plan-card.tsx`: present one plan without user state or payment dialogs.
- Create `web/default/src/features/subscription-plans/index.tsx`: page composition, loading, empty, error, and populated states.

Translations:

- Modify `web/default/src/i18n/locales/en.json`.
- Modify `web/default/src/i18n/locales/zh.json`.
- Modify `web/default/src/i18n/locales/fr.json`.
- Modify `web/default/src/i18n/locales/ja.json`.
- Modify `web/default/src/i18n/locales/ru.json`.
- Modify `web/default/src/i18n/locales/vi.json`.

Generated:

- `web/default/src/routeTree.gen.ts` may be updated by the TanStack Router plugin when running the frontend build/typecheck. Include it only if tooling changes it.

---

### Task 1: Backend Public Plans Endpoint

**Files:**
- Modify: `router/api_router_test.go`
- Modify: `controller/subscription.go`
- Modify: `router/api-router.go`

- [ ] **Step 1: Update the router test fixture with multiple plan states**

Replace the single seed block inside `setupSubscriptionRouteTestDB` in `router/api_router_test.go` with this exact seed data:

```go
	plans := []model.SubscriptionPlan{
		{
			Title:      "Home Plan",
			Enabled:    true,
			ShowOnHome: true,
			SortOrder:  30,
		},
		{
			Title:      "Catalog Only Plan",
			Enabled:    true,
			ShowOnHome: false,
			SortOrder:  20,
		},
		{
			Title:      "Disabled Plan",
			Enabled:    false,
			ShowOnHome: true,
			SortOrder:  10,
		},
	}
	if err := db.Create(&plans).Error; err != nil {
		t.Fatalf("failed to seed subscription plans: %v", err)
	}
```

- [ ] **Step 2: Make the test response type inspect plan titles**

Replace the existing `subscriptionPlansAPIResponse` definition in `router/api_router_test.go` with:

```go
type subscriptionPlansAPIResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    []struct {
		Plan struct {
			Id         int    `json:"id"`
			Title      string `json:"title"`
			Enabled    bool   `json:"enabled"`
			ShowOnHome bool   `json:"show_on_home"`
			SortOrder  int    `json:"sort_order"`
		} `json:"plan"`
	} `json:"data"`
}
```

Remove the now-unused `encoding/json` import from the import block.

- [ ] **Step 3: Add failing tests for the new public endpoint**

Add these tests immediately after `TestSubscriptionHomePlansAllowsAnonymousAccess`:

```go
func TestSubscriptionPublicPlansAllowsAnonymousAccess(t *testing.T) {
	setupSubscriptionRouteTestDB(t)
	server := setupSubscriptionRouteTestServer()

	req := httptest.NewRequest(http.MethodGet, "/api/subscription/public/plans", nil)
	recorder := httptest.NewRecorder()
	server.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200 for anonymous public plans request, got %d", recorder.Code)
	}

	var response subscriptionPlansAPIResponse
	if err := common.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode public plans response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response, got message: %s", response.Message)
	}
	if len(response.Data) != 2 {
		t.Fatalf("expected two enabled plans, got %d", len(response.Data))
	}
	if response.Data[0].Plan.Title != "Home Plan" {
		t.Fatalf("expected highest sort_order plan first, got %q", response.Data[0].Plan.Title)
	}
	if response.Data[1].Plan.Title != "Catalog Only Plan" {
		t.Fatalf("expected show_on_home=false enabled plan to be included, got %q", response.Data[1].Plan.Title)
	}
	for _, item := range response.Data {
		if !item.Plan.Enabled {
			t.Fatalf("disabled plan %q must not be returned", item.Plan.Title)
		}
	}
}

func TestSubscriptionPublicPlansRespectPaymentCompliance(t *testing.T) {
	setupSubscriptionRouteTestDB(t)
	server := setupSubscriptionRouteTestServer()

	previous := common.OptionMap["payment_setting.payment_compliance_confirmed"]
	common.OptionMap["payment_setting.payment_compliance_confirmed"] = "false"
	t.Cleanup(func() {
		common.OptionMap["payment_setting.payment_compliance_confirmed"] = previous
	})

	req := httptest.NewRequest(http.MethodGet, "/api/subscription/public/plans", nil)
	recorder := httptest.NewRecorder()
	server.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200 when compliance is not confirmed, got %d", recorder.Code)
	}

	var response subscriptionPlansAPIResponse
	if err := common.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode public plans response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response, got message: %s", response.Message)
	}
	if len(response.Data) != 0 {
		t.Fatalf("expected no plans when compliance is not confirmed, got %d", len(response.Data))
	}
}
```

- [ ] **Step 4: Run the backend tests and confirm the new route fails**

Run:

```bash
go test ./router -run 'TestSubscription(Public|Home|Plans)' -count=1
```

Expected before implementation: `TestSubscriptionPublicPlansAllowsAnonymousAccess` fails with a non-200 status or missing route.

- [ ] **Step 5: Implement the public controller**

In `controller/subscription.go`, add this function immediately after `GetHomeSubscriptionPlans`:

```go
// GetPublicSubscriptionPlans returns every enabled subscription plan for the public catalog.
func GetPublicSubscriptionPlans(c *gin.Context) {
	if !operation_setting.IsPaymentComplianceConfirmed() {
		common.ApiSuccess(c, []SubscriptionPlanDTO{})
		return
	}

	var plans []model.SubscriptionPlan
	if err := model.DB.Where("enabled = ?", true).Order("sort_order desc, id desc").Find(&plans).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	result := make([]SubscriptionPlanDTO, 0, len(plans))
	for _, p := range plans {
		result = append(result, SubscriptionPlanDTO{
			Plan: p,
		})
	}
	common.ApiSuccess(c, result)
}
```

- [ ] **Step 6: Register the public route**

In `router/api-router.go`, inside the anonymous `subscriptionPublicRoute := apiRouter.Group("/subscription")` block, add:

```go
			subscriptionPublicRoute.GET("/public/plans", controller.GetPublicSubscriptionPlans)
```

The block should contain both anonymous endpoints:

```go
		subscriptionPublicRoute := apiRouter.Group("/subscription")
		{
			subscriptionPublicRoute.GET("/home/plans", controller.GetHomeSubscriptionPlans)
			subscriptionPublicRoute.GET("/public/plans", controller.GetPublicSubscriptionPlans)
		}
```

- [ ] **Step 7: Run backend tests and confirm pass**

Run:

```bash
go test ./router -run 'TestSubscription(Public|Home|Plans)' -count=1
```

Expected: all selected tests pass.

- [ ] **Step 8: Commit backend endpoint**

Run:

```bash
git add controller/subscription.go router/api-router.go router/api_router_test.go
git commit -m "feat: add public subscription plans endpoint"
```

---

### Task 2: Header Navigation Module

**Files:**
- Modify: `web/default/src/lib/nav-modules.ts`
- Modify: `web/default/src/hooks/use-top-nav-links.ts`
- Modify: `web/default/src/features/system-settings/maintenance/config.ts`
- Modify: `web/default/src/features/system-settings/maintenance/header-navigation-section.tsx`
- Modify: `web/default/src/i18n/static-keys.ts`

- [ ] **Step 1: Add the subscriptions module to runtime nav parsing**

In `web/default/src/lib/nav-modules.ts`, update the module type:

```ts
export type HeaderNavModule = 'rankings' | 'pricing' | 'subscriptions'
```

Add `subscriptions` to `HeaderNavModules`:

```ts
  subscriptions: ModuleAccess
```

Add the default after `pricing`:

```ts
  subscriptions: { enabled: true, requireAuth: false },
```

Add cloning support in `cloneHeaderNavDefaults`:

```ts
    subscriptions: { ...DEFAULT_HEADER_NAV_MODULES.subscriptions },
```

Add default access in `DEFAULTS` automatically by keeping it as:

```ts
const DEFAULTS: Record<HeaderNavModule, ModuleAccess> = {
  pricing: DEFAULT_HEADER_NAV_MODULES.pricing,
  subscriptions: DEFAULT_HEADER_NAV_MODULES.subscriptions,
  rankings: DEFAULT_HEADER_NAV_MODULES.rankings,
}
```

Add parse support in `parseHeaderNavModules` after the pricing block:

```ts
    if (key === 'subscriptions') {
      result.subscriptions = parseAccess(value, result.subscriptions)
      return
    }
```

- [ ] **Step 2: Insert the top navigation link after Model Square**

In `web/default/src/hooks/use-top-nav-links.ts`, insert this block immediately after the Pricing block and before Rankings:

```ts
  // Subscription Plans
  const subscriptions = modules?.subscriptions
  if (
    subscriptions &&
    typeof subscriptions === 'object' &&
    subscriptions.enabled
  ) {
    const requiresAuth = subscriptions.requireAuth && !isAuthed
    links.push({
      title: t('Subscription Plans'),
      href: '/subscription-plans',
      requiresAuth,
    })
  }
```

- [ ] **Step 3: Add the module to system settings config parsing**

In `web/default/src/features/system-settings/maintenance/config.ts`, add `subscriptions` to `HeaderNavModulesConfig`:

```ts
  subscriptions: HeaderNavAccessConfig
```

Add the default after `pricing`:

```ts
  subscriptions: {
    enabled: true,
    requireAuth: false,
  },
```

Add clone support:

```ts
  subscriptions: { ...HEADER_NAV_DEFAULT.subscriptions },
```

Add `subscriptions` to the parsed result object:

```ts
      subscriptions: { ...base.subscriptions },
```

Add parse support after the pricing block:

```ts
      if (key === 'subscriptions') {
        result.subscriptions = parseAccessModule(raw, base.subscriptions)
        return
      }
```

- [ ] **Step 4: Add settings form fields for subscriptions**

In `web/default/src/features/system-settings/maintenance/header-navigation-section.tsx`, extend `headerNavSchema` with:

```ts
  subscriptionsEnabled: z.boolean(),
  subscriptionsRequireAuth: z.boolean(),
```

Extend `toFormValues` after the pricing fields:

```ts
  subscriptionsEnabled:
    config.subscriptions?.enabled === undefined
      ? HEADER_NAV_DEFAULT.subscriptions.enabled
      : Boolean(config.subscriptions.enabled),
  subscriptionsRequireAuth:
    config.subscriptions?.requireAuth === undefined
      ? HEADER_NAV_DEFAULT.subscriptions.requireAuth
      : Boolean(config.subscriptions.requireAuth),
```

Extend the `payload` object after `pricing`:

```ts
      subscriptions: {
        ...(config.subscriptions ?? HEADER_NAV_DEFAULT.subscriptions),
        enabled: values.subscriptionsEnabled,
        requireAuth: values.subscriptionsRequireAuth,
      },
```

Update the `requireAuthDependsOn` union:

```ts
    requireAuthDependsOn:
      | 'pricingEnabled'
      | 'subscriptionsEnabled'
      | 'rankingsEnabled'
```

Add this `accessModules` entry between Model Square and Rankings:

```ts
    {
      enabledKey: 'subscriptionsEnabled',
      requireAuthKey: 'subscriptionsRequireAuth',
      requireAuthDependsOn: 'subscriptionsEnabled',
      title: t('Subscription Plans'),
      description: t('Public subscription plan catalog.'),
      requireAuthTitle: t('Require login to view subscription plans'),
      requireAuthDescription: t(
        'Visitors must authenticate before accessing subscription plans.'
      ),
    },
```

- [ ] **Step 5: Add static i18n keys for dynamic nav/settings strings**

In `web/default/src/i18n/static-keys.ts`, add `Subscription Plans` under the Header navigation section after `Model Square`:

```ts
  'Subscription Plans',
```

Add these keys near the existing public navigation settings keys:

```ts
  'Public subscription plan catalog.',
  'Require login to view subscription plans',
  'Visitors must authenticate before accessing subscription plans.',
```

- [ ] **Step 6: Typecheck the navigation changes**

Run:

```bash
cd web/default && bun run typecheck
```

Expected: TypeScript completes without errors from `HeaderNavModule`, `HeaderNavModulesConfig`, or `HeaderNavFormValues`.

- [ ] **Step 7: Commit navigation module changes**

Run:

```bash
git add web/default/src/lib/nav-modules.ts web/default/src/hooks/use-top-nav-links.ts web/default/src/features/system-settings/maintenance/config.ts web/default/src/features/system-settings/maintenance/header-navigation-section.tsx web/default/src/i18n/static-keys.ts
git commit -m "feat: add subscription plans nav module"
```

---

### Task 3: Public Subscription Plans Feature And Route

**Files:**
- Create: `web/default/src/features/subscription-plans/api.ts`
- Create: `web/default/src/features/subscription-plans/components/plan-card.tsx`
- Create: `web/default/src/features/subscription-plans/index.tsx`
- Create: `web/default/src/routes/subscription-plans/index.tsx`
- Generated if changed: `web/default/src/routeTree.gen.ts`

- [ ] **Step 1: Create the public API fetcher**

Create `web/default/src/features/subscription-plans/api.ts`:

```ts
/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { api } from '@/lib/api'
import type { ApiResponse, PlanRecord } from '@/features/subscriptions/types'

export async function getPublicSubscriptionPlans(): Promise<
  ApiResponse<PlanRecord[]>
> {
  const res = await api.get('/api/subscription/public/plans')
  return res.data
}
```

- [ ] **Step 2: Create the plan card component**

Create `web/default/src/features/subscription-plans/components/plan-card.tsx`:

```tsx
/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
import { ArrowRight, Check, Clock, Layers, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrencyUSD, formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import {
  formatBillingMode,
  formatDuration,
  formatResetPeriod,
  formatSubscriptionQuotaLimitSummary,
  formatSubscriptionTotalValue,
} from '@/features/subscriptions/lib'
import type {
  PlanRecord,
  SubscriptionPlan,
} from '@/features/subscriptions/types'

type SubscriptionPlanCardProps = {
  record: PlanRecord
  isAuthenticated: boolean
  featured?: boolean
}

function splitGroups(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getTotalLabel(plan: SubscriptionPlan, t: TFunction) {
  const total = Number(plan.total_amount || 0)
  if (total <= 0) return t('Unlimited')
  return formatSubscriptionTotalValue(total, plan, t, formatQuota, {
    approximateTimes: plan.approximate_times,
  })
}

export function SubscriptionPlanCard({
  record,
  isAuthenticated,
  featured = false,
}: SubscriptionPlanCardProps) {
  const { t } = useTranslation()
  const plan = record.plan
  const allowedGroups = splitGroups(plan.allowed_groups)
  const limitSummary = formatSubscriptionQuotaLimitSummary(
    plan,
    t,
    formatQuota,
    { maxItems: 4, includeMode: false }
  )
  const resetPeriod = formatResetPeriod(plan, t)
  const purchaseLimit = Number(plan.max_purchase_per_user || 0)

  const highlights = [
    {
      icon: Clock,
      label: t('Validity Period'),
      value: formatDuration(plan, t),
    },
    {
      icon: Layers,
      label: t('Billing Mode'),
      value: formatBillingMode(plan.billing_mode, t),
    },
    {
      icon: ShieldCheck,
      label: t('Total Quota'),
      value: getTotalLabel(plan, t),
    },
  ]

  const details = [
    resetPeriod !== t('No Reset')
      ? `${t('Quota Reset')}: ${resetPeriod}`
      : null,
    limitSummary !== t('No Limits') ? `${t('Quota Limits')}: ${limitSummary}` : null,
    allowedGroups.length > 0
      ? `${t('Allowed Groups')}: ${allowedGroups.join(', ')}`
      : null,
    plan.upgrade_group ? `${t('Upgrade Group')}: ${plan.upgrade_group}` : null,
    purchaseLimit > 0 ? `${t('Purchase Limit')}: ${purchaseLimit}` : null,
  ].filter(Boolean) as string[]

  return (
    <Card
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg border-border/70 bg-background/95 shadow-sm transition-shadow hover:shadow-md',
        featured && 'border-primary/50 shadow-md'
      )}
    >
      <CardHeader className='space-y-4'>
        <div className='flex min-w-0 items-start justify-between gap-3'>
          <div className='min-w-0'>
            <CardTitle className='truncate text-xl'>{plan.title}</CardTitle>
            {plan.subtitle ? (
              <p className='text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed'>
                {plan.subtitle}
              </p>
            ) : null}
          </div>
          {featured ? (
            <StatusBadge variant='info' copyable={false}>
              {t('Recommended')}
            </StatusBadge>
          ) : null}
        </div>

        <div className='flex items-end gap-2'>
          <span className='text-3xl font-bold tracking-tight text-primary'>
            {formatCurrencyUSD(Number(plan.price_amount || 0))}
          </span>
          <span className='text-muted-foreground pb-1 text-xs font-medium uppercase'>
            {plan.currency || 'USD'}
          </span>
        </div>
      </CardHeader>

      <CardContent className='flex-1 space-y-5'>
        <div className='grid gap-2.5'>
          {highlights.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className='flex items-start gap-3 rounded-md border bg-muted/20 p-3'
              >
                <Icon className='text-primary mt-0.5 size-4 shrink-0' />
                <div className='min-w-0'>
                  <div className='text-muted-foreground text-xs'>
                    {item.label}
                  </div>
                  <div className='mt-0.5 break-words text-sm font-medium'>
                    {item.value}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {details.length > 0 ? (
          <div className='space-y-2'>
            {details.map((detail) => (
              <div key={detail} className='flex gap-2 text-sm leading-relaxed'>
                <Check className='text-primary mt-0.5 size-4 shrink-0' />
                <span className='break-words text-muted-foreground'>
                  {detail}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Badge variant='outline' className='w-fit'>
            {t('No Limits')}
          </Badge>
        )}
      </CardContent>

      <CardFooter>
        <Button className='w-full' asChild>
          <Link to={isAuthenticated ? '/my-subscriptions' : '/sign-up'}>
            {isAuthenticated ? t('Subscribe Now') : t('Sign in to subscribe')}
            <ArrowRight className='size-4' />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 3: Create the public page component**

Create `web/default/src/features/subscription-plans/index.tsx`:

```tsx
/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useQuery } from '@tanstack/react-query'
import { CreditCard, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import { getPublicSubscriptionPlans } from './api'
import { SubscriptionPlanCard } from './components/plan-card'

function SubscriptionPlansLoading() {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className='h-[420px] rounded-lg' />
      ))}
    </div>
  )
}

export function SubscriptionPlans() {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const isAuthenticated = Boolean(auth.user)

  const plansQuery = useQuery({
    queryKey: ['public-subscription-plans'],
    queryFn: getPublicSubscriptionPlans,
  })

  const plans = (plansQuery.data?.data || []).filter((item) => item?.plan)

  return (
    <PublicLayout showMainContainer={false}>
      <div className='relative'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-20 dark:opacity-[0.10]'
          style={{
            background: [
              'radial-gradient(ellipse 55% 45% at 18% 20%, oklch(0.70 0.16 150 / 70%) 0%, transparent 70%)',
              'radial-gradient(ellipse 50% 40% at 78% 16%, oklch(0.68 0.14 220 / 60%) 0%, transparent 70%)',
              'radial-gradient(ellipse 40% 35% at 52% 70%, oklch(0.72 0.12 95 / 40%) 0%, transparent 70%)',
            ].join(', '),
            maskImage:
              'linear-gradient(to bottom, black 40%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 40%, transparent 100%)',
          }}
        />

        <PageTransition className='relative mx-auto w-full max-w-[1280px] px-3 pt-16 pb-10 sm:px-6 sm:pt-20 sm:pb-12 xl:px-8'>
          <header className='mx-auto mb-8 max-w-3xl pt-5 text-center sm:mb-12 sm:pt-10'>
            <p className='text-muted-foreground mb-3 text-xs font-medium tracking-widest uppercase'>
              {t('Subscription Catalog')}
            </p>
            <h1 className='text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.15] font-bold tracking-tight'>
              {t('Subscription Plans')}
            </h1>
            <p className='text-muted-foreground/70 mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:mt-4 sm:text-base'>
              {t(
                'Browse available subscription plans and choose the access package that fits your usage.'
              )}
            </p>
          </header>

          {plansQuery.isLoading ? (
            <SubscriptionPlansLoading />
          ) : plansQuery.isError ? (
            <EmptyState
              icon={RefreshCw}
              bordered
              title={t('Unable to load subscription plans')}
              description={t('Please refresh the page and try again.')}
            />
          ) : plans.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              bordered
              title={t('No subscription plans available')}
              description={t('There are no enabled subscription plans yet.')}
            />
          ) : (
            <>
              <div className='mb-4 flex items-center justify-between gap-3'>
                <p className='text-muted-foreground text-sm'>
                  {t('{{count}} plan(s) available', { count: plans.length })}
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => plansQuery.refetch()}
                  disabled={plansQuery.isFetching}
                >
                  <RefreshCw
                    className={plansQuery.isFetching ? 'animate-spin' : ''}
                  />
                  {t('Refresh')}
                </Button>
              </div>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                {plans.map((record, index) => (
                  <SubscriptionPlanCard
                    key={record.plan.id}
                    record={record}
                    isAuthenticated={isAuthenticated}
                    featured={index === 0 && plans.length > 1}
                  />
                ))}
              </div>
            </>
          )}
        </PageTransition>
      </div>
    </PublicLayout>
  )
}
```

- [ ] **Step 4: Create the route with module guard**

Create `web/default/src/routes/subscription-plans/index.tsx`:

```tsx
/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { getFreshModuleAccess } from '@/lib/nav-modules'
import { SubscriptionPlans } from '@/features/subscription-plans'

export const Route = createFileRoute('/subscription-plans/')({
  beforeLoad: async ({ location }) => {
    const access = await getFreshModuleAccess('subscriptions')
    if (!access.enabled) {
      throw redirect({ to: '/' })
    }
    if (access.requireAuth) {
      const { auth } = useAuthStore.getState()
      if (!auth.user) {
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.href },
        })
      }
    }
  },
  component: SubscriptionPlans,
})
```

- [ ] **Step 5: Run frontend typecheck to generate/validate route types**

Run:

```bash
cd web/default && bun run typecheck
```

Expected: TypeScript passes. If `routeTree.gen.ts` changes, include it in this task commit.

- [ ] **Step 6: Commit the page feature**

Run:

```bash
git add web/default/src/features/subscription-plans web/default/src/routes/subscription-plans web/default/src/routeTree.gen.ts
git commit -m "feat: add public subscription plans page"
```

If `web/default/src/routeTree.gen.ts` did not change, Git will ignore that path.

---

### Task 4: Frontend Internationalization

**Files:**
- Modify: `web/default/src/i18n/locales/en.json`
- Modify: `web/default/src/i18n/locales/zh.json`
- Modify: `web/default/src/i18n/locales/fr.json`
- Modify: `web/default/src/i18n/locales/ja.json`
- Modify: `web/default/src/i18n/locales/ru.json`
- Modify: `web/default/src/i18n/locales/vi.json`

- [ ] **Step 1: Add missing translations with a temporary script**

Create `web/default/scripts/add-subscription-plans-i18n.mjs` with:

```js
import fs from 'node:fs/promises'
import path from 'node:path'

const LOCALES_DIR = path.resolve('src/i18n/locales')

const translations = {
  en: {
    'Browse available subscription plans': 'Browse available subscription plans',
    'Browse available subscription plans and choose the access package that fits your usage.':
      'Browse available subscription plans and choose the access package that fits your usage.',
    'No subscription plans available': 'No subscription plans available',
    'Public subscription plan catalog.': 'Public subscription plan catalog.',
    'Require login to view subscription plans': 'Require login to view subscription plans',
    'Visitors must authenticate before accessing subscription plans.':
      'Visitors must authenticate before accessing subscription plans.',
    'Sign in to subscribe': 'Sign in to subscribe',
    'Subscription Catalog': 'Subscription Catalog',
    'Unable to load subscription plans': 'Unable to load subscription plans',
    'Please refresh the page and try again.': 'Please refresh the page and try again.',
    'There are no enabled subscription plans yet.': 'There are no enabled subscription plans yet.',
    '{{count}} plan(s) available': '{{count}} plan(s) available',
    Refresh: 'Refresh',
  },
  zh: {
    'Browse available subscription plans': '浏览可用订阅套餐',
    'Browse available subscription plans and choose the access package that fits your usage.':
      '浏览可用订阅套餐，选择适合你使用量的访问方案。',
    'No subscription plans available': '暂无可用订阅套餐',
    'Public subscription plan catalog.': '公开订阅套餐目录。',
    'Require login to view subscription plans': '要求登录才能查看订阅套餐',
    'Visitors must authenticate before accessing subscription plans.':
      '访客必须登录后才能访问订阅套餐。',
    'Sign in to subscribe': '登录后订阅',
    'Subscription Catalog': '订阅目录',
    'Unable to load subscription plans': '无法加载订阅套餐',
    'Please refresh the page and try again.': '请刷新页面后重试。',
    'There are no enabled subscription plans yet.': '目前还没有已启用的订阅套餐。',
    '{{count}} plan(s) available': '共 {{count}} 个套餐可用',
    Refresh: '刷新',
  },
  fr: {
    'Browse available subscription plans': 'Parcourir les abonnements disponibles',
    'Browse available subscription plans and choose the access package that fits your usage.':
      'Parcourez les abonnements disponibles et choisissez l’offre adaptée à votre usage.',
    'No subscription plans available': 'Aucun abonnement disponible',
    'Public subscription plan catalog.': 'Catalogue public des abonnements.',
    'Require login to view subscription plans': 'Exiger la connexion pour voir les abonnements',
    'Visitors must authenticate before accessing subscription plans.':
      'Les visiteurs doivent se connecter avant d’accéder aux abonnements.',
    'Sign in to subscribe': 'Se connecter pour s’abonner',
    'Subscription Catalog': 'Catalogue des abonnements',
    'Unable to load subscription plans': 'Impossible de charger les abonnements',
    'Please refresh the page and try again.': 'Veuillez actualiser la page puis réessayer.',
    'There are no enabled subscription plans yet.': 'Aucun abonnement activé n’est disponible pour le moment.',
    '{{count}} plan(s) available': '{{count}} abonnement(s) disponible(s)',
    Refresh: 'Actualiser',
  },
  ja: {
    'Browse available subscription plans': '利用可能なサブスクリプションプランを表示',
    'Browse available subscription plans and choose the access package that fits your usage.':
      '利用可能なサブスクリプションプランを確認し、利用量に合うアクセスパッケージを選択できます。',
    'No subscription plans available': '利用可能なサブスクリプションプランはありません',
    'Public subscription plan catalog.': '公開サブスクリプションプランカタログ。',
    'Require login to view subscription plans': 'サブスクリプションプランの表示にログインを要求する',
    'Visitors must authenticate before accessing subscription plans.':
      '訪問者はサブスクリプションプランにアクセスする前に認証する必要があります。',
    'Sign in to subscribe': 'ログインして登録',
    'Subscription Catalog': 'サブスクリプションカタログ',
    'Unable to load subscription plans': 'サブスクリプションプランを読み込めません',
    'Please refresh the page and try again.': 'ページを更新してもう一度お試しください。',
    'There are no enabled subscription plans yet.': '有効なサブスクリプションプランはまだありません。',
    '{{count}} plan(s) available': '{{count}} 件のプランが利用可能',
    Refresh: '更新',
  },
  ru: {
    'Browse available subscription plans': 'Просмотреть доступные подписки',
    'Browse available subscription plans and choose the access package that fits your usage.':
      'Просмотрите доступные подписки и выберите пакет доступа под свой сценарий использования.',
    'No subscription plans available': 'Нет доступных подписок',
    'Public subscription plan catalog.': 'Публичный каталог подписок.',
    'Require login to view subscription plans': 'Требовать вход для просмотра подписок',
    'Visitors must authenticate before accessing subscription plans.':
      'Посетители должны войти в систему перед доступом к подпискам.',
    'Sign in to subscribe': 'Войдите, чтобы оформить подписку',
    'Subscription Catalog': 'Каталог подписок',
    'Unable to load subscription plans': 'Не удалось загрузить подписки',
    'Please refresh the page and try again.': 'Обновите страницу и повторите попытку.',
    'There are no enabled subscription plans yet.': 'Пока нет включенных подписок.',
    '{{count}} plan(s) available': 'Доступно планов: {{count}}',
    Refresh: 'Обновить',
  },
  vi: {
    'Browse available subscription plans': 'Xem các gói đăng ký hiện có',
    'Browse available subscription plans and choose the access package that fits your usage.':
      'Xem các gói đăng ký hiện có và chọn gói truy cập phù hợp với nhu cầu sử dụng của bạn.',
    'No subscription plans available': 'Không có gói đăng ký khả dụng',
    'Public subscription plan catalog.': 'Danh mục gói đăng ký công khai.',
    'Require login to view subscription plans': 'Yêu cầu đăng nhập để xem gói đăng ký',
    'Visitors must authenticate before accessing subscription plans.':
      'Khách truy cập phải xác thực trước khi xem các gói đăng ký.',
    'Sign in to subscribe': 'Đăng nhập để đăng ký',
    'Subscription Catalog': 'Danh mục đăng ký',
    'Unable to load subscription plans': 'Không thể tải các gói đăng ký',
    'Please refresh the page and try again.': 'Vui lòng làm mới trang rồi thử lại.',
    'There are no enabled subscription plans yet.': 'Hiện chưa có gói đăng ký nào được bật.',
    '{{count}} plan(s) available': 'Có {{count}} gói khả dụng',
    Refresh: 'Làm mới',
  },
}

for (const [locale, entries] of Object.entries(translations)) {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`)
  const json = JSON.parse(await fs.readFile(filePath, 'utf8'))
  json.translation = {
    ...json.translation,
    ...entries,
  }
  json.translation = Object.fromEntries(
    Object.entries(json.translation).sort(([a], [b]) => a.localeCompare(b))
  )
  await fs.writeFile(filePath, JSON.stringify(json, null, 2) + '\n')
  console.log(`${locale}: applied ${Object.keys(entries).length} keys`)
}
```

- [ ] **Step 2: Apply translations and remove the temporary script**

Run:

```bash
cd web/default
node scripts/add-subscription-plans-i18n.mjs
rm scripts/add-subscription-plans-i18n.mjs
bun run i18n:sync
```

Expected: locale files are updated and sorted; temporary script is removed.

- [ ] **Step 3: Verify i18n sync and frontend typecheck**

Run:

```bash
cd web/default && bun run typecheck
```

Expected: TypeScript passes. If the i18n sync report changes, inspect it and only commit report files if they are normally tracked in this repo.

- [ ] **Step 4: Commit translations**

Run:

```bash
git add web/default/src/i18n/static-keys.ts web/default/src/i18n/locales/en.json web/default/src/i18n/locales/zh.json web/default/src/i18n/locales/fr.json web/default/src/i18n/locales/ja.json web/default/src/i18n/locales/ru.json web/default/src/i18n/locales/vi.json
git commit -m "i18n: add subscription plans page translations"
```

---

### Task 5: Full Verification

**Files:**
- No planned source edits unless verification exposes a defect.

- [ ] **Step 1: Run backend verification**

Run:

```bash
go test ./router -run 'TestSubscription(Public|Home|Plans)' -count=1
```

Expected: pass.

- [ ] **Step 2: Run frontend build check**

Run:

```bash
cd web/default && bun run build:check
```

Expected: TypeScript and Rsbuild production build pass.

- [ ] **Step 3: Start the frontend dev server for browser verification**

Run:

```bash
cd web/default && bun run dev -- --host 0.0.0.0
```

Expected: Rsbuild prints a localhost URL, usually `http://localhost:5173`.

Keep this session running until browser checks are done.

- [ ] **Step 4: Verify the page manually in a browser**

Open the dev URL and check:

```text
http://localhost:5173/subscription-plans
```

Expected:

- The top nav contains `Subscription Plans` after `Model Square`.
- Anonymous users can access `/subscription-plans` by default.
- Loading, empty, and populated states are visually coherent.
- Cards fit at desktop and mobile widths without overlapping text.
- CTA routes to `/sign-up` when anonymous.

- [ ] **Step 5: Stop the dev server**

Stop the running `bun run dev` session with Ctrl-C.

- [ ] **Step 6: Check final git status**

Run:

```bash
git status --short
```

Expected: clean working tree after all task commits, or only intentional uncommitted changes if the implementer is intentionally preparing a final squashed commit.
