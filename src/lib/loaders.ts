"use client";
import type { MentalnaMapa, SkratkySubor, Teza, TezaIndexItem } from "./types";
import { THESIS_INDEX } from "./thesis-index";

const tezaCache = new Map<string, Teza>();
const mapaCache = new Map<string, MentalnaMapa>();
let skratkyCache: SkratkySubor | null = null;
let indexMetaLoaded = false;

/**
 * Robustný JSON fetch:
 * - cache: "no-cache" → prehliadač vždy revaliduje s serverom (304 If-None-Match,
 *   lacné). Service worker (NetworkFirst) má prednosť pred HTTP cache.
 *   `force-cache` by mohlo viesť k zobrazovaniu zastaranej verzie obsahu.
 * - ak fetch alebo JSON.parse zlyhá (napr. poškodený cache), retry s `reload`
 *   ktorý obíde service worker aj HTTP cache úplne.
 */
async function fetchJSON<T>(url: string): Promise<T> {
  try {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const txt = await r.text();
    return JSON.parse(txt) as T;
  } catch (e1) {
    // Retry — bypass cache úplne
    try {
      const r2 = await fetch(url, { cache: "reload" });
      if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
      const txt2 = await r2.text();
      return JSON.parse(txt2) as T;
    } catch (e2: any) {
      // Pomôž si — zmaž service-worker cache pre tento URL nech sa to neopakuje
      try {
        if (typeof caches !== "undefined") {
          const names = await caches.keys();
          await Promise.all(names.map(async (n) => {
            const c = await caches.open(n);
            await c.delete(url);
            await c.delete(new URL(url, location.origin).toString());
          }));
        }
      } catch { /* ignore */ }
      throw new Error(`Nepodarilo sa načítať ${url}: ${e2?.message || e1}`);
    }
  }
}

export async function loadTeza(id: string): Promise<Teza> {
  if (tezaCache.has(id)) return tezaCache.get(id)!;
  const item = THESIS_INDEX.find((t) => t.id === id);
  if (!item) throw new Error(`Neznáma téza: ${id}`);
  const t = await fetchJSON<Teza>(`/content/${item.file}`);
  tezaCache.set(id, t);
  return t;
}

export async function loadMapa(id: string): Promise<MentalnaMapa | null> {
  if (mapaCache.has(id)) return mapaCache.get(id)!;
  const item = THESIS_INDEX.find((t) => t.id === id);
  if (!item) return null;
  try {
    const m = await fetchJSON<MentalnaMapa>(`/mapy/${item.file}`);
    mapaCache.set(id, m);
    return m;
  } catch {
    return null;
  }
}

export async function loadSkratky(): Promise<SkratkySubor> {
  if (skratkyCache) return skratkyCache;
  const s = await fetchJSON<SkratkySubor>(`/skratky.json`);
  skratkyCache = s;
  return s;
}

export async function loadChangelog(): Promise<string> {
  const r = await fetch(`/changelog.md`, { cache: "no-cache" });
  if (!r.ok) return "";
  return await r.text();
}

// Doplnenie metadát do indexu (názov, verzia) — leniva, ale paralelne.
export async function ensureIndexMeta(items: TezaIndexItem[]): Promise<TezaIndexItem[]> {
  if (indexMetaLoaded && items.every((i) => i.nazov)) return items;
  await Promise.all(items.map(async (it) => {
    if (it.nazov && it.verzia) return;
    try {
      const t = await loadTeza(it.id);
      it.nazov = t.nazov;
      it.verzia = t.verzia;
    } catch { /* ignore */ }
  }));
  indexMetaLoaded = true;
  return items;
}

// Visual src → /visuals/...  (JSON má napr. "03_Vizualy/BC_I_01_..svg")
export function mapVisualSrc(subor: string): string {
  const m = subor.match(/([^\/\\]+\.svg)$/i);
  return m ? `/visuals/${m[1]}` : subor;
}

// Cesta k SVG mentálnej mapy pre danú tézu. Súbor je rovnaký ako index file
// (napr. BC_I_01.svg) v /public/mapy/.
export function mapSvgPath(id: string): string | null {
  const item = THESIS_INDEX.find((t) => t.id === id);
  if (!item) return null;
  return `/mapy/${item.file.replace(/\.json$/i, ".svg")}`;
}

/**
 * Vyčistí všetky service-worker cache (PWA) a in-memory cache loadery.
 * Použiteľné z UI ("Obnoviť obsah") keď používateľ vidí poškodený / stale obsah.
 * Vráti počet zmazaných cache záznamov.
 */
export async function clearContentCaches(): Promise<{ caches: number; entries: number }> {
  // 1) In-memory cache
  tezaCache.clear();
  mapaCache.clear();
  skratkyCache = null;
  indexMetaLoaded = false;

  // 2) Service worker cache storage
  let cachesDeleted = 0;
  let entriesDeleted = 0;
  if (typeof caches !== "undefined") {
    try {
      const names = await caches.keys();
      for (const name of names) {
        if (!name.startsWith("rp-")) continue; // dotkni sa len našich
        const c = await caches.open(name);
        const keys = await c.keys();
        entriesDeleted += keys.length;
        await caches.delete(name);
        cachesDeleted++;
      }
    } catch { /* ignore */ }
  }
  return { caches: cachesDeleted, entries: entriesDeleted };
}

// Skontroluj či SVG mapa existuje (HEAD request).
export async function svgMapaExists(id: string): Promise<boolean> {
  const url = mapSvgPath(id);
  if (!url) return false;
  try {
    const r = await fetch(url, { method: "HEAD", cache: "no-cache" });
    return r.ok;
  } catch {
    return false;
  }
}
