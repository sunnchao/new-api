import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const contactPagePath = join(
  import.meta.dir,
  '../../src/features/contact/index.tsx'
)

test('omits the temporary-disabled Telegram contact method', () => {
  const source = readFileSync(contactPagePath, 'utf8')

  expect(source).not.toContain("title: 'Telegram'")
  expect(source).not.toContain('@chirou_api')
  expect(source).not.toContain('https://t.me/chirou_api')
})

test('shows a QR code dialog trigger for the QQ group', () => {
  const source = readFileSync(contactPagePath, 'utf8')

  expect(source).toContain("qqGroupQrCode from '@/assets/qq-group-qrcode.jpg'")
  expect(source).toContain('qrCodeSrc: qqGroupQrCode')
  expect(source).toContain("t('View QR code')")
  expect(source).toContain("t('QQ group QR code')")
  expect(source).toContain('<Dialog')
  expect(source).toContain('<img')
})
