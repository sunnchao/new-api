export function addCfAsyncToModuleScripts(html: string): string
export function addCfAsyncToScripts(html: string): string
export function cloudflareRocketLoaderGuard(): {
  name: string
  apply: string
  transformIndexHtml(html: string): string
}
