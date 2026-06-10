import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const featuresRoot = path.join(nextRoot, "src/features");
const manifestPath = path.join(nextRoot, "src/lib/parity/feature-manifest.ts");

function featureDirectories() {
  return fs
    .readdirSync(featuresRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function manifestDomains() {
  const text = fs.readFileSync(manifestPath, "utf8");
  return [...text.matchAll(/"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((domain) => !domain.includes("/"))
    .sort();
}

export function auditFeatureManifest() {
  const features = featureDirectories();
  const manifest = manifestDomains();
  const featureSet = new Set(features);
  const manifestSet = new Set(manifest);

  const missingFromManifest = features.filter((feature) => !manifestSet.has(feature));
  const staleManifestEntries = manifest.filter((feature) => !featureSet.has(feature));

  return {
    featureCount: features.length,
    manifestCount: manifest.length,
    missingFromManifestCount: missingFromManifest.length,
    staleManifestEntryCount: staleManifestEntries.length,
    missingFromManifest,
    staleManifestEntries,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectInvocation = invokedPath === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  const report = auditFeatureManifest();

  console.log(JSON.stringify(report, null, 2));

  if (
    process.argv.includes("--fail-on-gap") &&
    (report.missingFromManifest.length > 0 ||
      report.staleManifestEntries.length > 0)
  ) {
    process.exitCode = 1;
  }
}
