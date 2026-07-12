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

/** Public API host used in vibe-coding tool tutorials. */
export const API_ORIGIN = 'https://api.wochirou.com'

/** API origin used as the New API gateway base in tutorials. */
export function getApiOrigin(): string {
  return API_ORIGIN
}

export function getOpenAiCompatibleBaseUrl(): string {
  return `${getApiOrigin()}/v1`
}

/** Claude Code appends `/v1/messages` itself — pass the API origin only. */
export function getAnthropicCompatibleBaseUrl(): string {
  return getApiOrigin()
}

/** Gemini CLI native path uses `/v1beta/...` under this host. */
export function getGeminiCompatibleBaseUrl(): string {
  return getApiOrigin()
}
