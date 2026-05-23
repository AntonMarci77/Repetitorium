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
  | { kind: "mc"; otazka: string; moznosti: string[]; spravne: number[]; vysvetlenie?: string }
  | { kind: "otvorena"; otazka: string; vzorova_odpoved: string }
  | { kind: "priklad"; zadanie: string; riesenie: string }
  | { kind: "celok"; nazov: string; jadro: string };

export function Sebatestovanie({ tezaId }: { tezaId: string }) {
  const [teza, setTeza] = useState<Teza | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [thinking, setThinking] = useState(true); // medzi-krok "premysli najprv"

  useEffect(() => { loadTeza(tezaId).then(setTeza); }, [tezaId]);
  useEffect(() => { setProfile(getProfile()); }, []);

  const cards = useMemo<Card[]>(() => {
    if (!teza) return [];
    const out: Card[] = [];
    out.push({ kind: "celok", nazov: teza.nazov, jadro: teza.jadro_odpovede_10min.uvod });
    teza.caste_doplnujuce_otazky?.forEach((q) =>
      out.push({ kind: "doplnujuca", otazka: q.otazka, odpoved: q.odpoved })
    );
    teza.test?.vyber_z_moznosti?.forEach((q) => {
      const sprAny = (q as any).spravne_indexy as number[] | undefined;
      const spravne = Array.isArray(sprAny) ? sprAny : [q.spravna_index];
      out.push({ kind: "mc", otazka: q.otazka, moznosti: q.moznosti, spravne, vysvetlenie: q.vysvetlenie });
    });
    teza.test?.otvorene?.forEach((q) => out.push({ kind: "otvorena", otazka: q.otazka, vzorova_odpoved: q.vzorova_odpoved }));
    teza.test?.priklad?.forEach((q) => out.push({ kind: "priklad", zadanie: q.zadanie, riesenie: q.riesenie }));
    return out;
  }, [teza]);

  // Reset stavu pri zmene karty
  useEffect(() => {
    setRevealed(false);
    setSelected(new Set());
    setThinking(true);
  }, [idx, tezaId]);

  if (!teza) return <div className="rp-section">Načítavam…</div>;
  if (!cards.length) return <div className="rp-section">K tejto téze nie sú zatiaľ otázky.</div>;

  const finished = idx >= cards.length;
  const card = cards[Math.min(idx, cards.length - 1)];

  const rate = (r: "nevedel" | "ciastocne" | "vedel") => {
    applyRating(tezaId, r, profile?.exam_date);
    setIdx((i) => i + 1);
  };

  const toggleSelect = (i: number) => {
    if (revealed) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  const clearSelect = () => setSelected(new Set());

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
          <CelokCard
            nazov={card.nazov} jadro={card.jadro}
            thinking={thinking} setThinking={setThinking}
            revealed={revealed} setRevealed={setRevealed}
          />
        )}

        {card.kind === "doplnujuca" && (
          <SimpleRevealCard
            otazka={card.otazka} odpoved={card.odpoved}
            thinking={thinking} setThinking={setThinking}
            revealed={revealed} setRevealed={setRevealed}
          />
        )}

        {card.kind === "mc" && (
          <McCard
            card={card}
            thinking={thinking} setThinking={setThinking}
            revealed={revealed} setRevealed={setRevealed}
            selected={selected} toggleSelect={toggleSelect} clearSelect={clearSelect}
          />
        )}

        {card.kind === "otvorena" && (
          <SimpleRevealCard
            otazka={card.otazka} odpoved={card.vzorova_odpoved}
            label="Vzorová odpoveď"
            thinking={thinking} setThinking={setThinking}
            revealed={revealed} setRevealed={setRevealed}
          />
        )}

        {card.kind === "priklad" && (
          <SimpleRevealCard
            otazka={card.zadanie} odpoved={card.riesenie}
            otazkaPrefix="Príklad: " label="Riešenie"
            thinking={thinking} setThinking={setThinking}
            revealed={revealed} setRevealed={setRevealed}
          />
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
          onClick={() => setIdx((i) => Math.min(cards.length, i + 1))}
          className="rp-btn-ghost"
        >Preskočiť →</button>
      </nav>
    </div>
  );
}

// ── „Premysli najprv" krok ────────────────────────────────────────────────
function ThinkingPrompt({ onReady, label = "Som pripravený, ukáž možnosti" }: { onReady: () => void; label?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-euba-accent/40 bg-euba-accent/5 p-4 text-sm">
      <p className="text-[var(--rp-muted)]">
        <strong className="text-[var(--rp-fg)]">Najprv si odpovedz nahlas alebo v duchu.</strong> Až keď si si istý, ukáž si možnosti / vzorovú odpoveď.
      </p>
      <button type="button" onClick={onReady} className="rp-btn-primary mt-3">
        {label}
      </button>
    </div>
  );
}

// ── Karta: Celá téza (hovor nahlas) ───────────────────────────────────────
function CelokCard({ nazov, jadro, thinking, setThinking, revealed, setRevealed }:
  { nazov: string; jadro: string; thinking: boolean; setThinking: (v:boolean)=>void; revealed: boolean; setRevealed: (v:boolean)=>void }) {
  return (
    <>
      <div className="font-heading text-xl">{nazov}</div>
      <p className="text-[var(--rp-muted)] text-sm">Povedz nahlas celé jadro odpovede (~10 min). Potom si zobraz vzorové znenie a ohodnoť sa.</p>
      {thinking ? (
        <ThinkingPrompt onReady={() => { setThinking(false); setRevealed(true); }} label="Hotovo, ukáž vzor" />
      ) : (
        <p className="italic"><WithAbbr text={jadro} /></p>
      )}
    </>
  );
}

// ── Karta: Doplňujúca / Otvorená / Príklad — reveal vzoru ─────────────────
function SimpleRevealCard({
  otazka, odpoved, otazkaPrefix, label = "Zobraziť odpoveď",
  thinking, setThinking, revealed, setRevealed,
}: {
  otazka: string; odpoved: string; otazkaPrefix?: string; label?: string;
  thinking: boolean; setThinking: (v: boolean) => void; revealed: boolean; setRevealed: (v: boolean) => void;
}) {
  return (
    <>
      <p className="font-medium text-lg">
        {otazkaPrefix && <strong>{otazkaPrefix}</strong>}
        <WithAbbr text={otazka} />
      </p>
      {thinking ? (
        <ThinkingPrompt onReady={() => { setThinking(false); setRevealed(true); }} label={label} />
      ) : (
        <div className="rp-prose">
          {label !== "Zobraziť odpoveď" && <h3 className="!mt-0">{label}</h3>}
          <p><WithAbbr text={odpoved} /></p>
        </div>
      )}
    </>
  );
}

// ── Karta: Multiple choice (Korda-style multi-select) ─────────────────────
function McCard({
  card, thinking, setThinking, revealed, setRevealed, selected, toggleSelect, clearSelect,
}: {
  card: { otazka: string; moznosti: string[]; spravne: number[]; vysvetlenie?: string };
  thinking: boolean; setThinking: (v: boolean) => void;
  revealed: boolean; setRevealed: (v: boolean) => void;
  selected: Set<number>; toggleSelect: (i: number) => void; clearSelect: () => void;
}) {
  const spravneSet = useMemo(() => new Set(card.spravne), [card.spravne]);
  const multiCorrect = card.spravne.length > 1;

  const allCorrect = revealed &&
    selected.size === spravneSet.size &&
    [...selected].every((i) => spravneSet.has(i));

  return (
    <>
      <p className="font-medium text-lg"><WithAbbr text={card.otazka} /></p>

      {thinking ? (
        <ThinkingPrompt onReady={() => setThinking(false)} label="Som pripravený, ukáž možnosti" />
      ) : (
        <>
          <p className="text-xs text-[var(--rp-muted)]">
            {multiCorrect
              ? "Označ všetky správne odpovede (môže byť viac)."
              : "Označ správnu odpoveď."} Potom potvrď výber.
          </p>
          <ul className="space-y-2">
            {card.moznosti.map((m, i) => {
              const isSelected = selected.has(i);
              const isCorrect = revealed && spravneSet.has(i);
              const isWrongPick = revealed && isSelected && !spravneSet.has(i);
              const isMissed = revealed && !isSelected && spravneSet.has(i);

              let cls = "w-full text-left rp-btn-ghost justify-start whitespace-normal";
              if (revealed) {
                if (isCorrect) cls += " !border-euba-green !bg-euba-green/15 !text-[var(--rp-fg)]";
                else if (isWrongPick) cls += " !border-euba-red !bg-euba-red/15";
                else cls += " opacity-70";
              } else if (isSelected) {
                cls += " !border-euba-accent !bg-euba-accent/15";
              }

              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => toggleSelect(i)}
                    disabled={revealed}
                    className={cls}
                    aria-pressed={isSelected}
                  >
                    <span className="font-mono w-6 inline-block">{String.fromCharCode(65 + i)}.</span>
                    <span className="flex-1"><WithAbbr text={m} /></span>
                    {revealed && isCorrect && <span aria-hidden className="ml-2 text-euba-green font-bold">✓</span>}
                    {revealed && isWrongPick && <span aria-hidden className="ml-2 text-euba-red font-bold">✕</span>}
                    {revealed && isMissed && <span aria-hidden className="ml-2 text-euba-orange text-xs">(treba bolo)</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          {!revealed ? (
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={() => setRevealed(true)}
                disabled={selected.size === 0}
                className="rp-btn-primary"
              >
                Potvrdiť výber
              </button>
              <button
                type="button"
                onClick={() => { clearSelect(); setRevealed(true); }}
                className="rp-btn-ghost"
              >Neviem — ukáž odpoveď</button>
            </div>
          ) : (
            <div className={
              "text-sm rounded-xl border p-3 mt-2 " +
              (allCorrect
                ? "border-euba-green/40 bg-euba-green/10 text-[var(--rp-fg)]"
                : "border-euba-orange/40 bg-euba-orange/10 text-[var(--rp-fg)]")
            }>
              <strong>{allCorrect ? "Správne!" : "Nie celkom."}</strong>{" "}
              {card.vysvetlenie && <><span className="opacity-80">Vysvetlenie:</span> <WithAbbr text={card.vysvetlenie} /></>}
            </div>
          )}
        </>
      )}
    </>
  );
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
