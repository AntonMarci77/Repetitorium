"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FlexSearch from "flexsearch";
import { ensureIndexMeta, loadTeza } from "@/lib/loaders";
import { getProfile } from "@/lib/storage";
import { indexForProgram } from "@/lib/thesis-index";
import type { Profile, Teza, TezaIndexItem } from "@/lib/types";

type Doc = { id: string; teza_id: string; nazov: string; section: string; text: string };

export function Hladanie() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<TezaIndexItem[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Doc[]>([]);

  useEffect(() => { setProfile(getProfile()); }, []);
  useEffect(() => {
    if (!profile) return;
    (async () => {
      const idx = await ensureIndexMeta(indexForProgram(profile.program));
      setItems([...idx]);
      const all: Doc[] = [];
      let n = 0;
      for (const it of idx) {
        try {
          const t = await loadTeza(it.id);
          appendDocs(all, t);
          n++;
          if (n % 6 === 0) setDocs([...all]);
        } catch { /* ignore */ }
      }
      setDocs(all);
      setReady(true);
    })();
  }, [profile]);

  const index = useMemo(() => {
    if (!docs.length) return null;
    const idx = new FlexSearch.Document<Doc, true>({
      tokenize: "forward",
      cache: true,
      document: {
        id: "id",
        index: ["nazov", "text", "section"],
        store: true,
      },
    });
    for (const d of docs) idx.add(d);
    return idx;
  }, [docs]);

  useEffect(() => {
    if (!index || !q.trim()) { setResults([]); return; }
    const out: Doc[] = [];
    const seen = new Set<string>();
    const r = index.search(q, { limit: 30, enrich: true }) as unknown as Array<{ field: string; result: Array<{ doc: Doc }> }>;
    for (const f of r) for (const hit of f.result) {
      if (seen.has(hit.doc.id)) continue;
      seen.add(hit.doc.id);
      out.push(hit.doc);
    }
    setResults(out.slice(0, 40));
  }, [q, index]);

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white">Hľadať v obsahu</h1>
        <p className="text-sm text-[var(--rp-muted)]">Fulltext cez {items.length} téz {ready ? "" : "(indexujem…)"}</p>
      </header>

      <input
        type="search"
        autoFocus
        placeholder="Napr. „verný a pravdivý obraz“, „odpisy“, „IFRS“…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="rp-input"
      />

      {q && (
        <p className="text-sm text-[var(--rp-muted)]">{results.length} zhôd</p>
      )}

      <ul className="space-y-2">
        {results.map((r) => {
          const teza = items.find((i) => i.id === r.teza_id);
          return (
            <li key={r.id}>
              <Link href={`/tezy/${r.teza_id}`} className="rp-card block p-3 hover:shadow">
                <div className="text-xs text-[var(--rp-muted)] flex items-center gap-2">
                  <span className="rp-chip rp-softer-bg">{teza?.program} {teza?.okruh}.{teza?.cislo}</span>
                  <span>{teza?.nazov}</span>
                  <span className="ml-auto rp-chip bg-euba-accent/10 text-euba-accent">{r.section}</span>
                </div>
                <Highlight text={r.text} q={q} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function appendDocs(out: Doc[], t: Teza) {
  out.push({ id: `${t.id}#nazov`, teza_id: t.id, nazov: t.nazov, section: "Názov", text: t.nazov });
  out.push({ id: `${t.id}#model`, teza_id: t.id, nazov: t.nazov, section: "Mentálny model", text: t.princip_mentalny_model });
  out.push({ id: `${t.id}#pojmy`, teza_id: t.id, nazov: t.nazov, section: "Kľúčové pojmy", text: (t.klucove_pojmy || []).join(", ") });
  out.push({ id: `${t.id}#uvod`, teza_id: t.id, nazov: t.nazov, section: "Úvod", text: t.jadro_odpovede_10min?.uvod ?? "" });
  t.jadro_odpovede_10min?.casti?.forEach((c, i) => {
    out.push({ id: `${t.id}#cast-${i}`, teza_id: t.id, nazov: t.nazov, section: c.nadpis || "Časť", text: [c.nadpis, c.text, c.zaver].filter(Boolean).join(" ") });
  });
  t.rozsirena_baza?.forEach((r, i) => out.push({ id: `${t.id}#roz-${i}`, teza_id: t.id, nazov: t.nazov, section: "Rozšírená báza: " + r.nadpis, text: r.text }));
  t.priklady?.forEach((p, i) => out.push({ id: `${t.id}#pr-${i}`, teza_id: t.id, nazov: t.nazov, section: "Príklad: " + p.nazov, text: [p.zadanie, p.riesenie, p.dopad_na_zd].filter(Boolean).join(" ") }));
  t.caste_doplnujuce_otazky?.forEach((q, i) => out.push({ id: `${t.id}#dq-${i}`, teza_id: t.id, nazov: t.nazov, section: "Doplňujúca otázka", text: `${q.otazka} ${q.odpoved}` }));
  t.pasce_caste_chyby?.forEach((p, i) => out.push({ id: `${t.id}#pasca-${i}`, teza_id: t.id, nazov: t.nazov, section: "Pasce", text: p }));
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <p className="text-sm mt-1 line-clamp-2">{text}</p>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return <p className="text-sm mt-1 line-clamp-2">{text}</p>;
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + q.length + 80);
  const head = (start > 0 ? "…" : "") + text.slice(start, idx);
  const hit = text.slice(idx, idx + q.length);
  const tail = text.slice(idx + q.length, end) + (end < text.length ? "…" : "");
  return (
    <p className="text-sm mt-1">
      {head}<mark className="bg-euba-accent/30 px-0.5 rounded">{hit}</mark>{tail}
    </p>
  );
}
