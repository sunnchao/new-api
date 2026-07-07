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

export const INTERFACE_LANGUAGE_OPTIONS = [
  { code: 'zhCN', label: '简体中文' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ru', label: 'Русский' },
  { code: 'ja', label: '日本語' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zhTW', label: '繁體中文' }
] as const

export type InterfaceLanguageCode =
  (typeof INTERFACE_LANGUAGE_OPTIONS)[number]['code']

export function normalizeInterfaceLanguage(value?: string | null): string {
  if (!value) return 'en'

  const normalized = value.trim().replaceAll('_', '-').toLowerCase()
  if (value === 'zh-TW' || value === 'zh-HK' || value === 'zh-MO' || value === 'zhTW') {
    return 'zhTW'
  }
  if (value === 'zh-CN' || value === 'zh-Hans' || value === 'zhCN') {
    return 'zhCN'
  }

  return INTERFACE_LANGUAGE_OPTIONS.some((lang) => lang.code === normalized)
    ? normalized
    : 'en'
}

const INTL_LOCALE_MAP: Record<string, string> = {
  zhCN: 'zh-CN',
  zhTW: 'zh-TW',
  en: 'en',
  fr: 'fr',
  ru: 'ru',
  ja: 'ja',
  vi: 'vi',
}

export function toIntlLocale(language?: string | null): string {
  if (!language) return 'en'
  return INTL_LOCALE_MAP[language] ?? language
}
