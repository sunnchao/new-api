export function addCfAsyncToModuleScripts(html) {
  return html.replace(
    /<script((?:(?!data-cfasync=)[^>])*)\stype="module"([^>]*)><\/script>/g,
    '<script$1 data-cfasync="false" type="module"$2></script>',
  );
}

export function addCfAsyncToScripts(html) {
  return html.replace(
    /<script((?:(?!data-cfasync=)[^>])*)>/g,
    '<script$1 data-cfasync="false">',
  );
}

export function cloudflareRocketLoaderGuard() {
  return {
    name: 'cloudflare-rocket-loader-guard',
    apply: 'build',
    transformIndexHtml(html) {
      return addCfAsyncToModuleScripts(html);
    },
  };
}
