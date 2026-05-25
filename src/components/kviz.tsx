"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ensureIndexMeta, loadTeza } from "@/lib/loaders";
import { getProfile } from "@/lib/storage";
import { indexForProgram, programLabel } from "@/lib/thesis-index";
import type { Profile, Program, Teza, TezaIndexItem } from "@/lib/types";
import { WithAbbr } from "./abbr-inline";

type Level = "BC" | "ING" | "OBE";
type Range = { kind: "vsetko" } | { kind: "okruh"; okruh: "I" | "II" } | { kind: "teza"; id: string };
type Count = 10 | 20 | 0; // 0 = všetky
type Source = "dop" | "test" | "obidva";

type MCQ = {
  uid: string;          // stabilný kľúč
  teza_id: string;
  teza_nazov: string;
  src: "dop" | "test";  // odkiaľ pochádza
  otazka: string;
  moznosti: string[];
  spravne: number[];
  vysvetlenie?: string;
};

type Phase =
  | { kind: "setup" }
  | { kind: "loading" }
  | { kind: "run"; items: MCQ[]; idx: number; selected: Set<number>; revealed: boolean; correctCount: number }
  | { kind: "done"; total: number; correct: number };

// ── helper: zostav MCQ z tezy ───────────────────────────────────────────────
function buildMcqs(t: Teza, source: Source): MCQ[] {
  const out: MCQ[] = [];
  if (source !== "test") {
    t.caste_doplnujuce_otazky?.forEach((q, i) => {
      if (!q.moznosti || !q.moznosti.length) return;
      const spravne = Array.isArray(q.spravne_indexy)
        ? q.spravne_indexy
        : typeof q.spravna_index === "number" ? [q.spravna_index] : [];
      if (!spravne.length) return;
      out.push({
        uid: `${t.id}#dop-${i}`,
        teza_id: t.id, teza_nazov: t.nazov, src: "dop",
        otazka: q.otazka, moznosti: q.moznosti, spravne,
        vysvetlenie: q.vysvetlenie ?? q.odpoved,
      });
    });
  }
  if (source !== "dop") {
    t.test?.vyber_z_moznosti?.forEach((q, i) => {
      const spravne = typeof q.spravna_index === "number" ? [q.spravna_index] : [];
      if (!spravne.length || !q.moznosti?.length) return;
      out.push({
        uid: `${t.id}#test-${i}`,
        teza_id: t.id, teza_nazov: t.nazov, src: "test",
        otazka: q.otazka, moznosti: q.moznosti, spravne,
        vysvetlenie: q.vysvetlenie,
      });
    });
  }
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Kviz() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<TezaIndexItem[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: "setup" });

  // Filtre
  const [level, setLevel] = useState<Level>("BC");
  const [range, setRange] = useState<Range>({ kind: "vsetko" });
  const [count, setCount] = useState<Count>(10);
  const [source, setSource] = useState<Source>("obidva");

  useEffect(() => {
    const r = () => setProfile(getProfile());
    r();
    window.addEventListener("rp:profile", r);
    return () => window.removeEventListener("rp:profile", r);
  }, []);

  // Inicializuj úroveň podľa profilu (BC študent → BC, ING → ING, komisia OBE)
  useEffect(() => {
    if (!profile) return;
    setLevel((cur) => {
      if (profile.program === "OBE") return cur; // komisia si vyberá sama
      return profile.program;
    });
  }, [profile]);

  // Načítaj index pre vybranú úroveň (alebo obe ak OBE)
  useEffect(() => {
    if (!profile) return;
    const wantedProgram: Program = level === "OBE" ? "OBE" : level;
    ensureIndexMeta(indexForProgram(wantedProgram)).then((m) => setItems([...m]));
  }, [profile, level]);

  if (!profile) return null;
  const isCommittee = profile.program === "OBE";

  // ── Spustiť kvíz ───────────────────────────────────────────────────────
  const start = async () => {
    setPhase({ kind: "loading" });
    const wantedProgram: Program = level === "OBE" ? "OBE" : level;
    let pool: TezaIndexItem[] = indexForProgram(wantedProgram);
    if (range.kind === "okruh") pool = pool.filter((t) => t.okruh === range.okruh);
    if (range.kind === "teza") pool = pool.filter((t) => t.id === range.id);

    const allMcqs: MCQ[] = [];
    for (const it of pool) {
      try {
        const t = await loadTeza(it.id);
        allMcqs.push(...buildMcqs(t, source));
      } catch { /* ignore */ }
    }
    const shuffled = shuffle(allMcqs);
    const limited = count === 0 ? shuffled : shuffled.slice(0, count);
    if (!limited.length) {
      alert("V tomto výbere nie sú žiadne otázky. Skús zmeniť filter.");
      setPhase({ kind: "setup" });
      return;
    }
    setPhase({ kind: "run", items: limited, idx: 0, selected: new Set(), revealed: false, correctCount: 0 });
  };

  // ── Phase: setup ──────────────────────────────────────────────────────
  if (phase.kind === "setup") {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white">Rýchly MC kvíz</h1>
          <p className="text-sm text-[var(--rp-muted)]">
            Iba testové otázky (ABCD). Bez „hovor nahlas", bez vplyvu na plán opakovaní — len rýchly tréning.
          </p>
        </header>

        <section className="rp-section space-y-4">
          {/* Úroveň */}
          <div>
            <div className="text-sm font-medium mb-2">Úroveň</div>
            <div className="grid grid-cols-3 gap-2">
              {(["BC", "ING", "OBE"] as Level[]).map((l) => {
                const disabled = (l === "OBE" && !isCommittee)
                  || (l !== profile.program && profile.program !== "OBE" && l !== "OBE");
                const active = level === l;
                return (
                  <button
                    type="button"
                    key={l}
                    disabled={disabled}
                    onClick={() => { setLevel(l); setRange({ kind: "vsetko" }); }}
                    aria-pressed={active}
                    className={
                      "rp-btn-ghost text-sm " +
                      (active ? "ring-2 ring-euba-accent border-euba-accent" : "") +
                      (disabled ? " opacity-40 cursor-not-allowed" : "")
                    }
                    title={disabled
                      ? (l === "OBE" ? "Dostupné len pre člena komisie" : "Tvoj profil je nastavený na inú úroveň")
                      : programLabel(l)}
                  >
                    {l === "BC" ? "BC" : l === "ING" ? "ING" : "BC + ING"}
                  </button>
                );
              })}
            </div>
            {!isCommittee && (
              <p className="text-xs text-[var(--rp-muted)] mt-2">
                Úroveň zodpovedá tvojmu profilu ({programLabel(profile.program)}). Komisia ju môže meniť.
              </p>
            )}
          </div>

          {/* Rozsah */}
          <div>
            <div className="text-sm font-medium mb-2">Rozsah</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className={"rp-btn-ghost justify-start cursor-pointer " + (range.kind === "vsetko" ? "ring-2 ring-euba-accent border-euba-accent" : "")}>
                <input type="radio" name="range" className="sr-only" checked={range.kind === "vsetko"} onChange={() => setRange({ kind: "vsetko" })} />
                Všetky tézy ({items.length})
              </label>
              <label className={"rp-btn-ghost justify-start cursor-pointer " + (range.kind === "okruh" && range.okruh === "I" ? "ring-2 ring-euba-accent border-euba-accent" : "")}>
                <input type="radio" name="range" className="sr-only" checked={range.kind === "okruh" && range.okruh === "I"} onChange={() => setRange({ kind: "okruh", okruh: "I" })} />
                Iba Okruh I
              </label>
              <label className={"rp-btn-ghost justify-start cursor-pointer " + (range.kind === "okruh" && range.okruh === "II" ? "ring-2 ring-euba-accent border-euba-accent" : "")}>
                <input type="radio" name="range" className="sr-only" checked={range.kind === "okruh" && range.okruh === "II"} onChange={() => setRange({ kind: "okruh", okruh: "II" })} />
                Iba Okruh II
              </label>
              <select
                className="rp-input"
                value={range.kind === "teza" ? range.id : ""}
                onChange={(e) => { if (e.target.value) setRange({ kind: "teza", id: e.target.value }); }}
              >
                <option value="">Konkrétna téza…</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.program} {it.okruh}.{it.cislo} — {it.nazov || it.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Zdroj otázok */}
          <div>
            <div className="text-sm font-medium mb-2">Zdroj otázok</div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: "obidva", l: "Obidva (odp.)" },
                { v: "dop", l: "Iba doplňujúce" },
                { v: "test", l: "Iba testové" },
              ] as { v: Source; l: string }[]).map((o) => (
                <button
                  type="button"
                  key={o.v}
                  onClick={() => setSource(o.v)}
                  aria-pressed={source === o.v}
                  className={"rp-btn-ghost text-xs " + (source === o.v ? "ring-2 ring-euba-accent border-euba-accent" : "")}
                >{o.l}</button>
              ))}
            </div>
          </div>

          {/* Počet */}
          <div>
            <div className="text-sm font-medium mb-2">Počet otázok</div>
            <div className="grid grid-cols-3 gap-2">
              {([10, 20, 0] as Count[]).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCount(c)}
                  aria-pressed={count === c}
                  className={"rp-btn-ghost text-sm " + (count === c ? "ring-2 ring-euba-accent border-euba-accent" : "")}
                >{c === 0 ? "Všetky" : c}</button>
              ))}
            </div>
          </div>

          <button onClick={start} className="rp-btn-primary w-full md:w-auto">Spustiť kvíz</button>
        </section>
      </div>
    );
  }

  if (phase.kind === "loading") return <div className="rp-section">Pripravujem otázky…</div>;

  // ── Phase: run ────────────────────────────────────────────────────────
  if (phase.kind === "run") {
    const q = phase.items[phase.idx];
    const total = phase.items.length;
    const spravneSet = new Set(q.spravne);
    const multiCorrect = q.spravne.length > 1;
    const allCorrect = phase.revealed
      && phase.selected.size === spravneSet.size
      && [...phase.selected].every((i) => spravneSet.has(i));

    const toggle = (i: number) => {
      if (phase.revealed) return;
      const next = new Set(phase.selected);
      if (next.has(i)) next.delete(i); else next.add(i);
      setPhase({ ...phase, selected: next });
    };
    const reveal = () => {
      const correct = phase.selected.size === spravneSet.size
        && [...phase.selected].every((i) => spravneSet.has(i));
      setPhase({ ...phase, revealed: true, correctCount: phase.correctCount + (correct ? 1 : 0) });
    };
    const next = () => {
      if (phase.idx + 1 >= total) {
        setPhase({ kind: "done", total, correct: phase.correctCount });
      } else {
        setPhase({ ...phase, idx: phase.idx + 1, selected: new Set(), revealed: false });
      }
    };

    return (
      <div className="space-y-4">
        <header className="flex items-center justify-between text-sm text-[var(--rp-muted)]">
          <span>
            Otázka {phase.idx + 1} / {total} · <Link className="rp-link" href={`/tezy/${q.teza_id}`}>{q.teza_id}</Link>
          </span>
          <span className="rp-chip bg-euba-accent/10 text-euba-accent">{phase.correctCount} ✓</span>
        </header>

        <div className="rp-section space-y-4">
          <div className="text-xs text-[var(--rp-muted)]">
            <span className="rp-chip rp-softer-bg">{q.src === "dop" ? "Doplňujúca" : "Testová"}</span>
            <span className="ml-2">{q.teza_nazov}</span>
          </div>
          <p className="font-medium text-lg"><WithAbbr text={q.otazka} /></p>
          <p className="text-xs text-[var(--rp-muted)]">
            {multiCorrect ? "Označ všetky správne (môže byť viac)." : "Označ správnu odpoveď."} Potom potvrď.
          </p>

          <ul className="space-y-2">
            {q.moznosti.map((m, i) => {
              const isSelected = phase.selected.has(i);
              const isCorrect = phase.revealed && spravneSet.has(i);
              const isWrongPick = phase.revealed && isSelected && !spravneSet.has(i);
              const isMissed = phase.revealed && !isSelected && spravneSet.has(i);
              let cls = "w-full text-left rp-btn-ghost justify-start whitespace-normal";
              if (phase.revealed) {
                if (isCorrect) cls += " !border-euba-green !bg-euba-green/15 !text-[var(--rp-fg)]";
                else if (isWrongPick) cls += " !border-euba-red !bg-euba-red/15";
                else cls += " opacity-70";
              } else if (isSelected) {
                cls += " !border-euba-accent !bg-euba-accent/15";
              }
              return (
                <li key={i}>
                  <button type="button" onClick={() => toggle(i)} disabled={phase.revealed} className={cls} aria-pressed={isSelected}>
                    <span className="font-mono w-6 inline-block">{String.fromCharCode(65 + i)}.</span>
                    <span className="flex-1"><WithAbbr text={m} /></span>
                    {phase.revealed && isCorrect && <span aria-hidden className="ml-2 text-euba-green font-bold">✓</span>}
                    {phase.revealed && isWrongPick && <span aria-hidden className="ml-2 text-euba-red font-bold">✕</span>}
                    {phase.revealed && isMissed && <span aria-hidden className="ml-2 text-euba-orange text-xs">(treba bolo)</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          {!phase.revealed ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={reveal} disabled={phase.selected.size === 0} className="rp-btn-primary">Potvrdiť výber</button>
              <button type="button" onClick={reveal} className="rp-btn-ghost">Neviem — ukáž</button>
            </div>
          ) : (
            <>
              <div className={
                "text-sm rounded-xl border p-3 " +
                (allCorrect ? "border-euba-green/40 bg-euba-green/10" : "border-euba-orange/40 bg-euba-orange/10")
              }>
                <strong>{allCorrect ? "Správne!" : "Nie celkom."}</strong>{" "}
                {q.vysvetlenie && <><span className="opacity-80">Vysvetlenie:</span> <WithAbbr text={q.vysvetlenie} /></>}
              </div>
              <button type="button" onClick={next} className="rp-btn-accent">
                {phase.idx + 1 >= total ? "Zobraziť výsledok" : "Ďalšia otázka →"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Phase: done ───────────────────────────────────────────────────────
  if (phase.kind === "done") {
    const pct = phase.total ? Math.round((phase.correct * 100) / phase.total) : 0;
    const tone = pct >= 80 ? "text-euba-green" : pct >= 50 ? "text-euba-orange" : "text-euba-red";
    return (
      <div className="rp-section text-center space-y-4 max-w-xl mx-auto">
        <h2 className="font-heading text-2xl">Hotovo</h2>
        <div className={"font-heading text-5xl " + tone}>{pct} %</div>
        <p className="text-[var(--rp-muted)]">
          Správne: <strong className="text-[var(--rp-fg)]">{phase.correct}</strong> z {phase.total}
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          <button onClick={() => setPhase({ kind: "setup" })} className="rp-btn-primary">Nový kvíz</button>
          <Link href="/test" className="rp-btn-ghost">Späť na test</Link>
        </div>
      </div>
    );
  }

  return null;
}
