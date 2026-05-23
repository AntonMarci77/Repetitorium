"use client";
import type { MentalnaMapa, SkratkySubor, Teza, TezaIndexItem } from "./types";
import { THESIS_INDEX } from "./thesis-index";

const tezaCache = new Map<string, Teza>();
const mapaCache = new Map<string, MentalnaMapa>();
let skratkyCache: SkratkySubor | null = null;
let indexMetaLoaded = false;

async function fetchJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "force-cache" });
  if (!r.ok) throw new Error(`Nepodarilo sa načítať ${url} (${r.status})`);
  return (await r.json()) as T;
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
  const r = await fetch(`/changelog.md`, { cache: "force-cache" });
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
