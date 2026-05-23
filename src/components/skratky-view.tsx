"use client";
import { useEffect, useMemo, useState } from "react";
import { loadSkratky } from "@/lib/loaders";
import type { Skratka, SkratkySubor } from "@/lib/types";

export function SkratkyView() {
  const [data, setData] = useState<SkratkySubor | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => { loadSkratky().then(setData); }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    if (!term) return data.skratky;
    return data.skratky.filter((s) =>
      s.skratka.toLowerCase().includes(term) ||
      s.vyznam.toLowerCase().includes(term) ||
      (s.kategoria?.toLowerCase().includes(term) ?? false)
    );
  }, [data, q]);

  const groups = useMemo(() => {
    const map = new Map<string, Skratka[]>();
    for (const s of filtered) {
      const k = s.kategoria || "Ostatné";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "sk"));
  }, [filtered]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white">Slovník skratiek</h1>
        <p className="text-sm text-[var(--rp-muted)]">
          {data ? `${data.skratky.length} skratiek (verzia ${data.verzia})` : "Načítavam…"}
        </p>
      </header>

      <input
        type="search"
        autoFocus
        placeholder="Hľadať skratku alebo význam…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="rp-input"
      />

      {groups.map(([kat, items]) => (
        <section key={kat} className="rp-section">
          <h2 className="font-heading text-lg mb-2">{kat}</h2>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {items.map((s) => (
              <div key={s.skratka + "-" + s.vyznam} className="grid grid-cols-[5rem_1fr] gap-2 py-1 border-b border-[var(--rp-border)] last:border-b-0">
                <dt className="font-mono font-semibold text-euba-accent">{s.skratka}</dt>
                <dd>
                  {s.vyznam}
                  {s.poznamka && <div className="text-xs text-[var(--rp-muted)]">{s.poznamka}</div>}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
