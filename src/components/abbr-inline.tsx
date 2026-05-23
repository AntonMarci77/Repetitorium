"use client";
import { useEffect, useMemo, useState } from "react";
import { loadSkratky } from "@/lib/loaders";
import type { Skratka } from "@/lib/types";

let cached: Skratka[] | null = null;

export function useSkratky() {
  const [list, setList] = useState<Skratka[] | null>(cached);
  useEffect(() => {
    if (cached) return;
    loadSkratky().then((s) => {
      cached = s.skratky;
      setList(cached);
    }).catch(() => setList([]));
  }, []);
  return list ?? [];
}

/** Rozbije text na časti a slová so známymi skratkami obalí tooltipom. */
export function WithAbbr({ text, className }: { text: string; className?: string }) {
  const skratky = useSkratky();
  const map = useMemo(() => {
    const m = new Map<string, Skratka>();
    for (const s of skratky) {
      if (!m.has(s.skratka)) m.set(s.skratka, s);
    }
    return m;
  }, [skratky]);

  const regex = useMemo(() => {
    const keys = [...map.keys()].sort((a, b) => b.length - a.length).map(escapeRegex);
    if (!keys.length) return null;
    // hranice slova – \b nefunguje dobre s diakritikou; použijeme lookaround na non-word chars
    return new RegExp(`(^|[^\\p{L}\\p{N}])(${keys.join("|")})(?=$|[^\\p{L}\\p{N}])`, "gu");
  }, [map]);

  if (!skratky.length || !regex) return <span className={className}>{text}</span>;

  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(regex)) {
    const pre = m[1];
    const abbr = m[2];
    const idx = (m.index ?? 0) + pre.length;
    if (idx > last) out.push(text.slice(last, idx));
    const sk = map.get(abbr)!;
    out.push(
      <abbr
        key={`${idx}-${abbr}`}
        title={sk.vyznam + (sk.poznamka ? ` — ${sk.poznamka}` : "")}
        className="rp-abbr"
      >
        {abbr}
      </abbr>
    );
    last = idx + abbr.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <span className={className}>{out}</span>;
}

function escapeRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
