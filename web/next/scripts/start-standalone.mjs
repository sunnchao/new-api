import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const nextRoot = path.resolve(scriptDir, "..");
const argv = process.argv.slice(2);

function getArgValue(name) {
  const prefix = `--${name}=`;
  const withEquals = argv.find((arg) => arg.startsWith(prefix));
  if (withEquals) return withEquals.slice(prefix.length);

  const index = argv.indexOf(`--${name}`);
  if (index >= 0 && argv[index + 1] && !argv[index + 1].startsWith("--")) {
    return argv[index + 1];
  }

  return undefined;
}

function ensureLinkedDir(source, target) {
  if (!fs.existsSync(source) || fs.existsSync(target)) return;

  fs.mkdirSync(path.dirname(target), { recursive: true });

  try {
    fs.symlinkSync(source, target, "dir");
  } catch {
    fs.cpSync(source, target, { recursive: true });
  }
}

const standaloneServer = path.join(
  nextRoot,
  ".next",
  "standalone",
  "next",
  "server.js"
);
const rootStandaloneServer = path.join(
  nextRoot,
  ".next",
  "standalone",
  "server.js"
);

const env = {
  ...process.env,
  NODE_ENV: "production",
};

const hostname = getArgValue("hostname") ?? process.env.HOSTNAME;
const port = getArgValue("port") ?? process.env.PORT;

if (hostname) env.HOSTNAME = hostname;
if (port) env.PORT = port;

let command = "next";
let commandArgs = ["start", ...argv];

if (fs.existsSync(standaloneServer)) {
  const standaloneRoot = path.dirname(standaloneServer);

  ensureLinkedDir(
    path.join(nextRoot, ".next", "static"),
    path.join(standaloneRoot, ".next", "static")
  );
  ensureLinkedDir(
    path.join(nextRoot, "public"),
    path.join(standaloneRoot, "public")
  );

  command = process.execPath;
  commandArgs = [standaloneServer];
} else if (fs.existsSync(rootStandaloneServer)) {
  command = process.execPath;
  commandArgs = [rootStandaloneServer];
}

const child = spawn(command, commandArgs, {
  cwd: nextRoot,
  env,
  stdio: "inherit",
});

let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(0);
    return;
  }

  process.exit(code ?? 1);
});
