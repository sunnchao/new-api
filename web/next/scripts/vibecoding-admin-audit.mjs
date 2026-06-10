import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const checks = [
  {
    name: 'VibeCoding admin list uses backend subscription overview endpoint',
    file: 'src/features/vibecoding/api.ts',
    test(content) {
      return (
        /getClaudeCodeAdminSubscriptions[\s\S]*\/api\/subscription\/admin\/all/.test(
          content
        ) && !/\/api\/vibecoding\/subscriptions/.test(content)
      )
    },
  },
  {
    name: 'VibeCoding admin grant uses backend user subscription endpoint',
    file: 'src/features/vibecoding/api.ts',
    test(content) {
      return (
        /grantClaudeCodeSubscription[\s\S]*\/api\/subscription\/admin\/users\/\$\{data\.user_id\}\/subscriptions/.test(
          content
        ) &&
        /plan_id:\s*data\.plan_id/.test(content) &&
        !/\/api\/vibecoding\/subscription\/grant/.test(content)
      )
    },
  },
  {
    name: 'VibeCoding admin cancel uses backend invalidate endpoint',
    file: 'src/features/vibecoding/api.ts',
    test(content) {
      return (
        /cancelClaudeCodeSubscription[\s\S]*\/api\/subscription\/admin\/user_subscriptions\/\$\{id\}\/invalidate/.test(
          content
        ) && !/\/api\/vibecoding\/subscription\/\$\{id\}\/cancel/.test(content)
      )
    },
  },
  {
    name: 'VibeCoding admin page enforces admin role before rendering',
    file: 'src/app/(app)/vibecoding/admin/page.tsx',
    test(content) {
      return (
        /useIsAdmin/.test(content) &&
        /router\.replace\(['"]\/403['"]\)/.test(content) &&
        /if\s*\(!isAdmin\)/.test(content)
      )
    },
  },
  {
    name: 'Next auth-store role constants match backend role values',
    file: 'src/stores/auth-store.ts',
    test(content) {
      return (
        /GUEST:\s*0/.test(content) &&
        /USER:\s*1/.test(content) &&
        /ADMIN:\s*10/.test(content) &&
        /ROOT:\s*100/.test(content) &&
        !/ADMIN:\s*100/.test(content) &&
        !/ROOT:\s*1000/.test(content)
      )
    },
  },
]

export function auditVibeCodingAdmin() {
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
  const report = auditVibeCodingAdmin()

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
