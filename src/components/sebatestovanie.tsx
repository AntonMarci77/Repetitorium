"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadTeza } from "@/lib/loaders";
import { applyRating, getProfile } from "@/lib/storage";
import type { Profile, Teza } from "@/lib/types";
import { WithAbbr } from "./abbr-inline";

type CardKind = "doplnujuca" | "mc" | "otvorena" | "priklad" | "celok";

type Card =
  | { kind: "doplnujuca"; otazka: string; odpoved: string }
  | { kind: "mc"; otazka: string; moznosti: string[]; spravna_index: number; vysvetlenie?: string }
  | { kind: "otvorena"; otazka: string; vzorova_odpoved: string }
  | { kind: "priklad"; zadanie: string; riesenie: string }
  | { kind: "celok"; nazov: string; jadro: string };

export function Sebatestovanie({ tezaId }: { tezaId: string }) {
  const [teza, setTeza] = useState<Teza | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => { loadTeza(tezaId).then(setTeza); }, [tezaId]);
  useEffect(() => { setProfile(getProfile()); }, []);

  const cards = useMemo<Card[]>(() => {
    if (!teza) return [];
    const out: Card[] = [];
    out.push({
      kind: "celok",
      nazov: teza.nazov,
      jadro: teza.jadro_odpovede_10min.uvod,
    });
    teza.caste_doplnujuce_otazky?.forEach((q) => out.push({ kind: "doplnujuca", otazka: q.otazka, odpoved: q.odpoved }));
    teza.test?.vyber_z_moznosti?.forEach((q) => out.push({ kind: "mc", otazka: q.otazka, moznosti: q.moznosti, spravna_index: q.spravna_index, vysvetlenie: q.vysvetlenie }));
    teza.test?.otvorene?.forEach((q) => out.push({ kind: "otvorena", otazka: q.otazka, vzorova_odpoved: q.vzorova_odpoved }));
    teza.test?.priklad?.forEach((q) => out.push({ kind: "priklad", zadanie: q.zadanie, riesenie: q.riesenie }));
    return out;
  }, [teza]);

  if (!teza) return <div className="rp-section">Načítavam…</div>;
  if (!cards.length) return <div className="rp-section">K tejto téze nie sú zatiaľ otázky.</div>;

  const finished = idx >= cards.length;
  const card = cards[Math.min(idx, cards.length - 1)];

  const rate = (r: "nevedel" | "ciastocne" | "vedel") => {
    applyRating(tezaId, r, profile?.exam_date);
    setRevealed(false);
    setChosen(null);
    setIdx((i) => i + 1);
  };

  if (finished) {
    return (
      <div className="rp-section text-center space-y-4">
        <h2 className="font-heading text-2xl">Hotovo</h2>
        <p className="text-[var(--rp-muted)]">Prešiel si {cards.length} otázok pre túto tézu.</p>
        <div className="flex justify-center gap-2 flex-wrap">
          <Link href={`/tezy/${tezaId}`} className="rp-btn-ghost">← Detail</Link>
          <Link href={`/tezy`} className="rp-btn-primary">Zoznam téz</Link>
          <Link href={`/test?mode=dnes`} className="rp-btn-accent">Pokračovať v dnes splatných</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between text-sm text-[var(--rp-muted)]">
        <Link href={`/tezy/${tezaId}`} className="rp-link">{teza.id} · {teza.nazov}</Link>
        <span>Otázka {idx + 1} / {cards.length}</span>
      </header>

      <div className="rp-section space-y-4">
        <KindBadge kind={card.kind} />
        {card.kind === "celok" && (
          <>
            <div className="font-heading text-xl">{card.nazov}</div>
            <p className="text-[var(--rp-muted)] text-sm">Povedz nahlas celé jadro odpovede (~10 min). Potom si zobraz vzorové znenie a ohodnoť sa.</p>
            <Reveal hidden={!revealed} onReveal={() => setRevealed(true)}>
              <p className="italic"><WithAbbr text={card.jadro} /></p>
            </Reveal>
          </>
        )}

        {card.kind === "doplnujuca" && (
          <>
            <p className="font-medium text-lg"><WithAbbr text={card.otazka} /></p>
            <Reveal hidden={!revealed} onReveal={() => setRevealed(true)}>
              <p><WithAbbr text={card.odpoved} /></p>
            </Reveal>
          </>
        )}

        {card.kind === "mc" && (
          <>
            <p className="font-medium text-lg"><WithAbbr text={card.otazka} /></p>
            <ul className="space-y-2">
              {card.moznosti.map((m, i) => {
                const isChosen = chosen === i;
                const isCorrect = revealed && i === card.spravna_index;
                const isWrong = revealed && isChosen && i !== card.spravna_index;
                return (
                  <li key={i}>
                    <button
                      onClick={() => { setChosen(i); setRevealed(true); }}
                      disabled={revealed}
                      className={
                        "w-full text-left rp-btn-ghost justify-start " +
                        (isCorrect ? "!border-euba-green !bg-euba-green/10" : "") +
                        (isWrong ? "!border-euba-red !bg-euba-red/10" : "")
                      }
                    >
                      <span className="font-mono mr-2">{String.fromCharCode(65 + i)}</span>
                      <WithAbbr text={m} />
                    </button>
                  </li>
                );
              })}
            </ul>
            {revealed && card.vysvetlenie && (
              <p className="text-sm rounded-xl bg-euba-accent/10 border border-euba-accent/30 p-3">
                <strong>Vysvetlenie:</strong> <WithAbbr text={card.vysvetlenie} />
              </p>
            )}
          </>
        )}

        {card.kind === "otvorena" && (
          <>
            <p className="font-medium text-lg"><WithAbbr text={card.otazka} /></p>
            <Reveal hidden={!revealed} onReveal={() => setRevealed(true)} label="Vzorová odpoveď">
              <p><WithAbbr text={card.vzorova_odpoved} /></p>
            </Reveal>
          </>
        )}

        {card.kind === "priklad" && (
          <>
            <p className="font-medium"><strong>Príklad:</strong> <WithAbbr text={card.zadanie} /></p>
            <Reveal hidden={!revealed} onReveal={() => setRevealed(true)} label="Riešenie">
              <p><WithAbbr text={card.riesenie} /></p>
            </Reveal>
          </>
        )}
      </div>

      {revealed && (
        <div className="rp-section">
          <p className="text-sm text-[var(--rp-muted)] mb-2">Ako si na tom?</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => rate("nevedel")} className="rp-btn h-12 bg-euba-red/10 text-euba-red hover:bg-euba-red/20">
              Nevedel
            </button>
            <button onClick={() => rate("ciastocne")} className="rp-btn h-12 bg-euba-orange/10 text-euba-orange hover:bg-euba-orange/20">
              Čiastočne
            </button>
            <button onClick={() => rate("vedel")} className="rp-btn h-12 bg-euba-green/10 text-euba-green hover:bg-euba-green/20">
              Vedel
            </button>
          </div>
        </div>
      )}

      <nav className="flex flex-wrap gap-2">
        <Link href={`/tezy/${tezaId}`} className="rp-btn-ghost">← Späť na tézu</Link>
        <button
          type="button"
          onClick={() => { setRevealed(false); setChosen(null); setIdx((i) => Math.min(cards.length, i + 1)); }}
          className="rp-btn-ghost"
        >Preskočiť →</button>
      </nav>
    </div>
  );
}

function Reveal({ hidden, onReveal, children, label = "Zobraziť odpoveď" }: { hidden: boolean; onReveal: () => void; children: React.ReactNode; label?: string }) {
  if (hidden) return <button type="button" onClick={onReveal} className="rp-btn-primary">{label}</button>;
  return <div className="rp-prose">{children}</div>;
}

function KindBadge({ kind }: { kind: CardKind }) {
  const cfg: Record<CardKind, { l: string; c: string }> = {
    celok: { l: "Celá téza (hovor nahlas)", c: "bg-euba-ink/10 text-euba-ink dark:text-white" },
    doplnujuca: { l: "Doplňujúca otázka", c: "bg-euba-accent/10 text-euba-accent" },
    mc: { l: "Výber z možností", c: "bg-euba-purple/10 text-euba-purple" },
    otvorena: { l: "Otvorená otázka", c: "bg-euba-orange/10 text-euba-orange" },
    priklad: { l: "Príklad", c: "bg-euba-green/10 text-euba-green" },
  };
  const k = cfg[kind];
  return <span className={"rp-chip " + k.c}>{k.l}</span>;
}
