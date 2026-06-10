import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const checks = [
  {
    name: 'getAdminSubscriptions accepts and sends status',
    file: 'src/features/admin-packages/api.ts',
    test(content) {
      return (
        /status\?:\s*string/.test(content) &&
        /searchParams\.set\('status',\s*status\)/.test(content)
      )
    },
  },
  {
    name: 'Subscriptions tab includes status filter in query key',
    file: 'src/features/admin-packages/components/subscriptions-tab.tsx',
    test(content) {
      return /queryKey:\s*\[[^\]]*statusFilter/s.test(content)
    },
  },
  {
    name: 'Subscriptions tab sends status query param',
    file: 'src/features/admin-packages/components/subscriptions-tab.tsx',
    test(content) {
      return /getAdminSubscriptions\(\{[^}]*status:/s.test(content)
    },
  },
  {
    name: 'Subscriptions tab exposes status filter control',
    file: 'src/features/admin-packages/components/subscriptions-tab.tsx',
    test(content) {
      return (
        /setStatusFilter/.test(content) &&
        /SelectItem value='active'/.test(content) &&
        /SelectItem value='cancelled'/.test(content)
      )
    },
  },
  {
    name: 'Admin Packages uses real subscription admin backend routes',
    file: 'src/features/admin-packages/api.ts',
    test(content) {
      return (
        /\/api\/subscription\/admin\/plans/.test(content) &&
        /\/api\/subscription\/admin\/all/.test(content) &&
        /\/api\/subscription\/admin\/bind/.test(content) &&
        /\/api\/subscription\/admin\/user_subscriptions\/\$\{id\}\/invalidate/.test(
          content
        ) &&
        !/\/api\/packages-admin/.test(content)
      )
    },
  },
  {
    name: 'Admin Packages maps backend plan records to package UI rows',
    file: 'src/features/admin-packages/api.ts',
    test(content) {
      return (
        /function mapPlanRecord/.test(content) &&
        /record\.plan/.test(content) &&
        /price_amount/.test(content) &&
        /total_amount/.test(content)
      )
    },
  },
  {
    name: 'Admin Packages maps backend subscription overviews to package UI rows',
    file: 'src/features/admin-packages/api.ts',
    test(content) {
      return (
        /function mapSubscriptionOverview/.test(content) &&
        /user_email/.test(content) &&
        /plan_title/.test(content) &&
        /amount_remaining/.test(content)
      )
    },
  },
  {
    name: 'Admin Packages plan mutations send backend plan wrapper payload',
    file: 'src/features/admin-packages/api.ts',
    test(content) {
      return (
        /function toBackendPlanPayload/.test(content) &&
        /api\.post[\s\S]*'\/api\/subscription\/admin\/plans'[\s\S]*\{ plan: toBackendPlanPayload\(data\) \}/.test(
          content
        ) &&
        /api\.put[\s\S]*`\/api\/subscription\/admin\/plans\/\$\{id\}`[\s\S]*\{ plan: \{ \.\.\.toBackendPlanPayload\(data\), id \} \}/.test(
          content
        )
      )
    },
  },
  {
    name: 'Admin Packages does not expose unsupported legacy reset-limit action',
    file: 'src/features/admin-packages/components/subscriptions-tab.tsx',
    test(content) {
      return !/Update Reset Limit|reset_quota_limit|reset-limit/.test(content)
    },
  },
  {
    name: 'Admin Packages grant subscription uses backend plan_id contract',
    file: 'src/features/admin-packages/components/grant-subscription-dialog.tsx',
    test(content) {
      return (
        /plan_id:\s*Number\(selectedPlanId\)/.test(content) &&
        !/allow_stack|allowStack|Allow Stacking/.test(content)
      )
    },
  },
  {
    name: 'Admin Packages duration units match subscription backend enum',
    file: 'src/features/admin-packages/components/plan-drawer.tsx',
    test(content) {
      return (
        /DURATION_UNITS\s*=\s*\[\s*'day',\s*'month',\s*'year',\s*'hour',\s*'custom'\s*\]\s*as const/.test(
          content
        ) &&
        /duration_unit:\s*z\.enum\(DURATION_UNITS\)/.test(content) &&
        !/['"]week['"]|['"]quarter['"]/.test(content)
      )
    },
  },
  {
    name: 'Admin Packages payload never emits reset-period duration units',
    file: 'src/features/admin-packages/api.ts',
    test(content) {
      return (
        !/duration_unit:\s*data\.is_unlimited_time\s*\?\s*['"]never['"]/.test(
          content
        ) && !/['"]week['"]|['"]quarter['"]/.test(content)
      )
    },
  },
]

export function auditAdminPackages() {
  const results = checks.map((check) => {
    const fullPath = path.join(ROOT, check.file)
    const content = fs.readFileSync(fullPath, 'utf8')
    return {
      name: check.name,
      file: check.file,
      ok: check.test(content),
    }
  })

  return {
    checkCount: results.length,
    failureCount: results.filter((result) => !result.ok).length,
    checks: results,
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
const isDirectInvocation = invokedPath === fileURLToPath(import.meta.url)

if (isDirectInvocation) {
  const report = auditAdminPackages()

  for (const check of report.checks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}`)
  }

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2))
  }

  if (process.argv.includes('--fail-on-gap') && report.failureCount > 0) {
    process.exitCode = 1
  }
}
