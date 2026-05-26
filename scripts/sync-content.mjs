#!/usr/bin/env node
// scripts/sync-content.mjs
// Synchronizuj zdrojový obsah (OneDrive) → /public v repe a validuj.
//
// Použitie:
//   npm run sync             — defaultný zdroj (OneDrive cesta nižšie)
//   npm run sync -- /custom  — vlastný zdrojový priečinok (s 02_Obsah/, 03_Vizualy/, 05_Aplikacia/)
//   RP_SOURCE=...  npm run sync — alternatíva cez env premennú
//
// Exit codes: 0 OK; 1 chyba (zdroj nenájdený, JSON invalid, atď.)

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const DEFAULT_SOURCE = "C:/Users/anton/OneDrive/EUBA - výuka/20252026/Štátnice app";

// ANSI farby pre čitateľný výstup
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", blue: "\x1b[34m", cyan: "\x1b[36m",
};

const SRC = resolve(process.argv[2] || process.env.RP_SOURCE || DEFAULT_SOURCE);
const DST = join(REPO_ROOT, "public");

// ── Definícia mappingov ──────────────────────────────────────────────────
const MAPPINGS = [
  { name: "Tézy",            src: "02_Obsah",            dst: "content",       glob: /\.json$/,         validateJSON: true,  trackVersion: true },
  { name: "Vizuály (SVG)",   src: "03_Vizualy",          dst: "visuals",       glob: /\.svg$/,          validateJSON: false, trackVersion: false },
  { name: "Mapy (JSON)",     src: "05_Aplikacia/mapy",   dst: "mapy",          glob: /\.json$/,         validateJSON: true,  trackVersion: false },
  { name: "Mapy (SVG)",      src: "05_Aplikacia/mapy",   dst: "mapy",          glob: /\.svg$/,          validateJSON: false, trackVersion: false },
  { name: "Esencie máp",     src: "05_Aplikacia/esencie",dst: "mapy-esencie",  glob: /\.json$/,         validateJSON: true,  trackVersion: false, optional: true },
];
const SINGLE_FILES = [
  { src: "05_Aplikacia/skratky.json",  dst: "skratky.json",  validateJSON: true,  name: "Skratky" },
  { src: "05_Aplikacia/changelog.md",  dst: "changelog.md",  validateJSON: false, name: "Changelog" },
];

// ── Helpers ───────────────────────────────────────────────────────────────
async function ensureDir(p) { await mkdir(p, { recursive: true }); }
async function readUTF8(p) { return await readFile(p, "utf-8"); }
async function writeUTF8(p, c) { await writeFile(p, c, "utf-8"); }
function fmt(n) { return new Intl.NumberFormat("sk-SK").format(n); }

async function readDirSafe(p) {
  try { return await readdir(p); } catch { return null; }
}

async function syncMapping(m, summary) {
  const srcDir = join(SRC, m.src);
  if (!existsSync(srcDir)) {
    if (m.optional) {
      console.log(`${c.dim}  (preskakujem ${m.name} — voliteľný priečinok neexistuje: ${m.src})${c.reset}`);
      return;
    }
    throw new Error(`Zdrojový priečinok neexistuje: ${srcDir}`);
  }
  const dstDir = join(DST, m.dst);
  await ensureDir(dstDir);

  const files = (await readdir(srcDir)).filter((f) => m.glob.test(f));
  let copied = 0, changed = 0, sizeBytes = 0;
  const versions = [];

  for (const f of files) {
    const srcPath = join(srcDir, f);
    const dstPath = join(dstDir, f);
    const content = await readFile(srcPath);
    sizeBytes += content.byteLength;

    // Validuj JSON ak treba
    if (m.validateJSON) {
      try {
        const j = JSON.parse(content.toString("utf-8"));
        if (m.trackVersion && j.verzia) {
          versions.push({ id: j.id || f, nazov: j.nazov || "", verzia: j.verzia });
        }
      } catch (e) {
        throw new Error(`${m.name} — neplatný JSON v ${f}: ${e.message}`);
      }
    }

    // Detekuj zmenu
    let didChange = true;
    if (existsSync(dstPath)) {
      const old = await readFile(dstPath);
      didChange = !old.equals(content);
    }
    if (didChange) {
      await writeFile(dstPath, content);
      changed++;
    }
    copied++;
  }

  summary.push({ name: m.name, dst: m.dst, files: copied, changed, sizeBytes });

  console.log(
    `${c.green}✓${c.reset} ${m.name.padEnd(18)} ${c.dim}→ /public/${m.dst}/${c.reset} ` +
    `${c.bold}${copied}${c.reset} súborov` +
    (changed > 0 ? `, ${c.yellow}${changed} zmenených${c.reset}` : `, ${c.dim}beze zmeny${c.reset}`) +
    `  ${c.dim}(${fmt(sizeBytes)} B)${c.reset}`
  );

  if (versions.length && m.trackVersion) {
    versions.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    console.log(`  ${c.dim}verzie:${c.reset}`);
    for (const v of versions) {
      console.log(`  ${c.dim}  ${String(v.id).padEnd(10)} v${v.verzia}  ${v.nazov.slice(0, 60)}${c.reset}`);
    }
  }
}

async function syncSingleFile(s, summary) {
  const srcPath = join(SRC, s.src);
  const dstPath = join(DST, s.dst);
  if (!existsSync(srcPath)) throw new Error(`Zdrojový súbor neexistuje: ${srcPath}`);
  const content = await readFile(srcPath);
  if (s.validateJSON) {
    try { JSON.parse(content.toString("utf-8")); }
    catch (e) { throw new Error(`${s.name} — neplatný JSON: ${e.message}`); }
  }
  let didChange = true;
  if (existsSync(dstPath)) {
    const old = await readFile(dstPath);
    didChange = !old.equals(content);
  }
  if (didChange) await writeFile(dstPath, content);
  summary.push({ name: s.name, dst: s.dst, files: 1, changed: didChange ? 1 : 0, sizeBytes: content.byteLength });
  console.log(`${c.green}✓${c.reset} ${s.name.padEnd(18)} ${c.dim}→ /public/${s.dst}${c.reset} ${didChange ? c.yellow + "zmenené" + c.reset : c.dim + "beze zmeny" + c.reset}`);
  return didChange;
}

// ── Main ─────────────────────────────────────────────────────────────────
(async () => {
  console.log(`${c.bold}${c.blue}▌ Repetitórium — sync obsahu${c.reset}`);
  console.log(`${c.dim}  Zdroj: ${SRC}${c.reset}`);
  console.log(`${c.dim}  Cieľ:  ${DST}${c.reset}`);
  console.log();

  if (!existsSync(SRC)) {
    console.error(`${c.red}✕ Zdrojový priečinok neexistuje: ${SRC}${c.reset}`);
    console.error(`  Skontroluj cestu alebo nastav RP_SOURCE env premennú.`);
    process.exit(1);
  }

  const summary = [];
  try {
    for (const m of MAPPINGS) await syncMapping(m, summary);
    console.log();
    for (const s of SINGLE_FILES) await syncSingleFile(s, summary);

    // Súhrn
    console.log();
    const totalFiles = summary.reduce((s, x) => s + x.files, 0);
    const totalChanged = summary.reduce((s, x) => s + x.changed, 0);
    const totalSize = summary.reduce((s, x) => s + x.sizeBytes, 0);
    console.log(`${c.bold}${c.green}✓ Sync hotový${c.reset}`);
    console.log(`  ${fmt(totalFiles)} súborov spolu · ${c.yellow}${totalChanged} zmenených${c.reset} · ${fmt(totalSize)} B`);

    if (totalChanged > 0) {
      console.log();
      console.log(`${c.cyan}Ďalšie kroky:${c.reset}`);
      console.log(`  ${c.dim}1.${c.reset} ${c.bold}git status${c.reset}                    ${c.dim}# pozri zmeny${c.reset}`);
      console.log(`  ${c.dim}2.${c.reset} ${c.bold}git add public && git commit -m "content: …"${c.reset}`);
      console.log(`  ${c.dim}3.${c.reset} ${c.bold}git push${c.reset}                      ${c.dim}# nahraj na GitHub${c.reset}`);
      console.log(`  ${c.dim}4.${c.reset} ${c.bold}npx vercel --prod --yes${c.reset}       ${c.dim}# deploy na produkciu${c.reset}`);
      console.log(`  ${c.dim}   alebo:${c.reset} ${c.bold}npm run release${c.reset}        ${c.dim}# spraví všetko naraz${c.reset}`);
    } else {
      console.log(`${c.dim}  Nič na deploy — zdroj a /public sú zhodné.${c.reset}`);
    }
  } catch (e) {
    console.error();
    console.error(`${c.red}✕ Chyba pri syncu:${c.reset} ${e.message}`);
    process.exit(1);
  }
})();
