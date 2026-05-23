"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ensureIndexMeta, loadTeza } from "@/lib/loaders";
import { applyRating, getProfile } from "@/lib/storage";
import { idsForProgram, indexForProgram } from "@/lib/thesis-index";
import type { Profile, Teza, TezaIndexItem } from "@/lib/types";
import { WithAbbr } from "./abbr-inline";
import { TtsButton } from "./tts-button";

type Filter = { program: "all" | "BC" | "ING"; okruh: "all" | "I" | "II" };

export function Simulacia() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [index, setIndex] = useState<TezaIndexItem[]>([]);
  const [filter, setFilter] = useState<Filter>({ program: "all", okruh: "all" });
  const [active, setActive] = useState<Teza | null>(null);
  const [remaining, setRemaining] = useState<number>(600); // 10 minút
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const tick = useRef<number | null>(null);

  useEffect(() => { setProfile(getProfile()); }, []);
  useEffect(() => {
    if (!profile) return;
    ensureIndexMeta(indexForProgram(profile.program)).then((m) => setIndex([...m]));
  }, [profile]);

  useEffect(() => () => { if (tick.current) window.clearInterval(tick.current); }, []);

  const eligible = useMemo(() => {
    return index.filter((i) => (filter.program === "all" || i.program === filter.program)
      && (filter.okruh === "all" || i.okruh === filter.okruh));
  }, [index, filter]);

  const pickRandom = async () => {
    if (!eligible.length) return;
    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    const t = await loadTeza(pick.id);
    setActive(t);
    setRevealed(false);
    const sec = (t.cas_na_odpoved_min ?? 10) * 60;
    setRemaining(sec);
    setRunning(true);
    if (tick.current) window.clearInterval(tick.current);
    tick.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (tick.current) window.clearInterval(tick.current);
          setRunning(false);
          setRevealed(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000) as unknown as number;
  };

  const stop = () => {
    if (tick.current) window.clearInterval(tick.current);
    setRunning(false);
    setRevealed(true);
  };

  const rate = (r: "nevedel" | "ciastocne" | "vedel") => {
    if (active) applyRating(active.id, r, profile?.exam_date);
    setActive(null);
    setRevealed(false);
    setRemaining(600);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  if (!profile) return null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white">Simulácia štátnice</h1>
        <p className="text-sm text-[var(--rp-muted)]">
          Appka náhodne vytiahne číslo tézy. Hovor odpoveď nahlas. Po čase si ohodnoť výkon.
        </p>
      </header>

      {!active && (
        <section className="rp-section space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {profile.program === "OBE" && (
              <Choice
                label="Program"
                value={filter.program}
                onChange={(v) => setFilter((f) => ({ ...f, program: v as any }))}
                options={[{v:"all",l:"BC + ING"},{v:"BC",l:"Iba BC"},{v:"ING",l:"Iba ING"}]}
              />
            )}
            <Choice
              label="Okruh"
              value={filter.okruh}
              onChange={(v) => setFilter((f) => ({ ...f, okruh: v as any }))}
              options={[{v:"all",l:"Obidva okruhy"},{v:"I",l:"Iba Okruh I"},{v:"II",l:"Iba Okruh II"}]}
            />
          </div>
          <p className="text-sm text-[var(--rp-muted)]">Z {eligible.length} téz.</p>
          <button onClick={pickRandom} className="rp-btn-primary w-full md:w-auto" disabled={!eligible.length}>
            Vytiahnuť tézu (náhodne)
          </button>
        </section>
      )}

      {active && (
        <section className="space-y-4">
          <div className="rp-section flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-[var(--rp-muted)]">{active.program} · Okruh {active.okruh} · Téza {active.cislo}</div>
              <div className="font-heading text-xl text-euba-ink dark:text-white mt-1">{active.nazov}</div>
            </div>
            <div className="font-mono text-3xl text-euba-accent">{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</div>
          </div>

          {!revealed ? (
            <div className="rp-section text-center space-y-3">
              <p className="text-[var(--rp-muted)]">Odpovedaj nahlas. Stlač „Hotovo“, keď skončíš, alebo počkaj na koniec časovača.</p>
              <div className="flex justify-center gap-2 flex-wrap">
                <button onClick={stop} className="rp-btn-primary">Hotovo, ukázať vzor</button>
                <button onClick={() => { setActive(null); if (tick.current) window.clearInterval(tick.current); setRunning(false); }} className="rp-btn-ghost">Zrušiť</button>
              </div>
              <TtsButton text={active.princip_mentalny_model} label="Pripomienka modelu (TTS)" />
            </div>
          ) : (
            <>
              <div className="rp-section rp-prose">
                <h2 className="!mt-0">Vzorové jadro odpovede</h2>
                <p><em><WithAbbr text={active.jadro_odpovede_10min.uvod} /></em></p>
                {active.jadro_odpovede_10min.casti.map((c, i) => (
                  <div key={i}>
                    {c.nadpis && <h3>{c.nadpis}</h3>}
                    {c.text && <p><WithAbbr text={c.text} /></p>}
                    {c.zaver && <p><WithAbbr text={c.zaver} /></p>}
                  </div>
                ))}
              </div>
              {active.caste_doplnujuce_otazky && active.caste_doplnujuce_otazky.length > 0 && (
                <div className="rp-section rp-prose">
                  <h2 className="!mt-0">Doplňujúce otázky komisie</h2>
                  <ul>{active.caste_doplnujuce_otazky.map((q, i) => <li key={i}><strong><WithAbbr text={q.otazka} /></strong> — <WithAbbr text={q.odpoved} /></li>)}</ul>
                </div>
              )}
              {active.pasce_caste_chyby && active.pasce_caste_chyby.length > 0 && (
                <div className="rp-section rp-prose">
                  <h2 className="!mt-0">Pasce</h2>
                  <ul>{active.pasce_caste_chyby.map((p, i) => <li key={i}><WithAbbr text={p} /></li>)}</ul>
                </div>
              )}

              <div className="rp-section">
                <p className="text-sm text-[var(--rp-muted)] mb-2">Ohodnoť svoj výkon:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => rate("nevedel")} className="rp-btn h-12 bg-euba-red/10 text-euba-red hover:bg-euba-red/20">Nevedel</button>
                  <button onClick={() => rate("ciastocne")} className="rp-btn h-12 bg-euba-orange/10 text-euba-orange hover:bg-euba-orange/20">Čiastočne</button>
                  <button onClick={() => rate("vedel")} className="rp-btn h-12 bg-euba-green/10 text-euba-green hover:bg-euba-green/20">Vedel</button>
                </div>
              </div>

              <nav className="flex flex-wrap gap-2">
                <Link href={`/tezy/${active.id}`} className="rp-btn-ghost">Otvoriť detail tézy</Link>
                <button onClick={pickRandom} className="rp-btn-accent">Ďalšia náhodná téza</button>
              </nav>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      <select className="rp-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
