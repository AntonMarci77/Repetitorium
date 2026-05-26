#!/usr/bin/env node
// scripts/release.mjs
// Skombinuje sync + git add/commit/push + Vercel deploy.
//
// Použitie:
//   npm run release                       — sync zo zdroja, commit "content: sync", push, deploy
//   npm run release -- "vlastná správa"   — vlastný commit message

import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const c = { reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m", red: "\x1b[31m", green: "\x1b[32m", cyan: "\x1b[36m" };
const msg = process.argv[2] || `content: sync zo zdroja (${new Date().toISOString().slice(0, 10)})`;

function run(cmd, args, opts = {}) {
  console.log(`${c.cyan}▶${c.reset} ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: REPO, shell: true, ...opts });
  if (r.status !== 0) {
    console.error(`${c.red}✕ Príkaz zlyhal s exit kódom ${r.status}${c.reset}`);
    process.exit(r.status || 1);
  }
}

function runCapture(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: REPO, shell: true, encoding: "utf-8" });
  return { code: r.status, out: (r.stdout || "").trim() };
}

console.log(`${c.bold}▌ Repetitórium — release${c.reset}\n`);

// 1) Sync
run("node", ["scripts/sync-content.mjs"]);

// 2) Pozri zmeny
const st = runCapture("git", ["status", "--porcelain", "public/"]);
if (!st.out) {
  console.log(`\n${c.dim}Žiadne zmeny v /public — preskakujem commit, idem rovno deployovať.${c.reset}\n`);
} else {
  console.log(`\n${c.bold}Zmeny v /public:${c.reset}\n${st.out}\n`);
  run("git", ["add", "public"]);
  run("git", ["commit", "-m", `"${msg}"`]);
  run("git", ["push"]);
}

// 3) Deploy
console.log(`\n${c.bold}Deploy na Vercel:${c.reset}`);
run("npx", ["vercel", "--prod", "--yes"]);

console.log(`\n${c.green}${c.bold}✓ Hotovo${c.reset}`);
