/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

function materializeRoutePattern(route) {
  const replacements = {
    id: "7201",
    chatId: "chat-smoke",
  };
  return route.replace(/:([A-Za-z0-9_]+)/g, (_match, name) => {
    return replacements[name] || `${name}-smoke`;
  });
}

function configuredRedirectCases() {
  const configPath = path.resolve(__dirname, "../next.config.ts");
  const text = fs.readFileSync(configPath, "utf8");
  const cases = [];
  const entryRegex =
    /source:\s*["']([^"']+)["'][\s\S]*?destination:\s*["']([^"']+)["'][\s\S]*?permanent:\s*false/g;
  let match;
  while ((match = entryRegex.exec(text))) {
    cases.push({
      source: materializeRoutePattern(match[1]),
      destination: materializeRoutePattern(match[2]),
    });
  }
  return cases;
}

const redirectCases = configuredRedirectCases();

const redirectQueryCases = [
  {
    source: "/console/subscription-overview?tab=plans&plan=7007",
    pathname: "/subscriptions",
    params: {
      tab: "all-subscriptions",
      plan: "7007",
    },
  },
  {
    source: "/console/tickets?status=1&keyword=billing",
    pathname: "/tickets",
    params: {
      legacy_admin: "1",
      status: "1",
      keyword: "billing",
    },
  },
  {
    source: "/console/ticket/7201?from=list",
    pathname: "/tickets/7201",
    params: {
      legacy_admin: "1",
      from: "list",
    },
  },
];

test.describe("legacy route redirect headers", () => {
  for (const { source, destination } of redirectCases) {
    test(`redirects ${source} to ${destination}`, async ({ request }) => {
      const response = await request.get(source, { maxRedirects: 0 });

      expect(response.status()).toBe(307);
      expect(response.headers()["location"]).toBe(destination);
    });
  }

  for (const { source, pathname, params } of redirectQueryCases) {
    test(`preserves query params for ${source}`, async ({ request }) => {
      const response = await request.get(source, { maxRedirects: 0 });
      const location = new URL(
        response.headers()["location"],
        "http://127.0.0.1"
      );

      expect(response.status()).toBe(307);
      expect(location.pathname).toBe(pathname);
      for (const [key, value] of Object.entries(params)) {
        expect(location.searchParams.get(key)).toBe(value);
      }
    });
  }
});
