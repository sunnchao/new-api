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
