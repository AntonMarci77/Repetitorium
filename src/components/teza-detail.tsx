"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadTeza, mapVisualSrc } from "@/lib/loaders";
import { entry, getProfile, markFirstPassDone, noteSeenVersion } from "@/lib/storage";
import type { Profile, Teza } from "@/lib/types";
import { WithAbbr } from "./abbr-inline";
import { TtsButton } from "./tts-button";
import { VisualLightbox } from "./visual-lightbox";

export function TezaDetail({ id }: { id: string }) {
  const [teza, setTeza] = useState<Teza | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [markedRead, setMarkedRead] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    setError(null);
    setTeza(null);
    loadTeza(id).then((t) => {
      setTeza(t);
      noteSeenVersion(id, t.verzia);
    }).catch((e) => setError(String(e.message || e)));
  }, [id]);

  useEffect(() => {
    const r = () => setProfile(getProfile());
    r();
    window.addEventListener("rp:profile", r);
    return () => window.removeEventListener("rp:profile", r);
  }, []);

  const isCommittee = profile?.program === "OBE";
  const e = useMemo(() => entry(id), [id, markedRead]);

  if (error) return <div className="rp-section text-euba-red">Chyba: {error}</div>;
  if (!teza) return <div className="rp-section">Načítavam…</div>;

  const fullText = (() => {
    const j = teza.jadro_odpovede_10min;
    const parts: string[] = [j.uvod];
    for (const c of j.casti) {
      if (c.nadpis) parts.push(c.nadpis + ".");
      if (c.text) parts.push(c.text);
      if (c.zaver) parts.push(c.zaver);
    }
    return parts.join(" \n\n");
  })();

  return (
    <article className="space-y-5">
      <header className="rp-card p-5 md:p-6">
        <div className="text-xs text-[var(--rp-muted)] flex flex-wrap items-center gap-2">
          <span className="rp-chip rp-softer-bg">{teza.program}</span>
          <span className="rp-chip rp-softer-bg">Okruh {teza.okruh}</span>
          <span className="rp-chip rp-softer-bg">Téza č. {teza.cislo}</span>
          <span className="rp-chip rp-softer-bg">{teza.cas_na_odpoved_min ?? 10} min</span>
          <span className="ml-auto rp-chip bg-euba-accent/10 text-euba-accent">v. {teza.verzia}</span>
        </div>
        <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white mt-2">
          {teza.nazov}
        </h1>
        {teza.stav_legislativy && (
          <p className="text-xs text-[var(--rp-muted)] mt-1">{teza.stav_legislativy}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          <TtsButton text={fullText} label="Počúvať jadro" />
          <Link href={`/tezy/${id}/mapa`} className="rp-btn-primary">Mentálna mapa</Link>
          <Link href={`/tezy/${id}/test`} className="rp-btn-ghost">Otestovať sa</Link>
          <Link href={`/opravy?teza=${encodeURIComponent(id)}&nazov=${encodeURIComponent(teza.nazov)}`} className="rp-btn-ghost">Nahlásiť opravu</Link>
        </div>
        <div className="text-xs text-[var(--rp-muted)] mt-3">
          Stav: <strong className="capitalize text-[var(--rp-fg)]">{e.status}</strong> · Box {e.box} · zobrazené {e.times_seen}×
          {!e.first_pass_done && (
            <button
              onClick={() => { markFirstPassDone(id); setMarkedRead((v) => !v); }}
              className="ml-3 rp-btn-ghost h-7 px-2 text-xs"
            >Označiť ako prečítané</button>
          )}
        </div>
      </header>

      {teza.klucove_pojmy?.length > 0 && (
        <section className="rp-section">
          <h2 className="font-heading text-lg mb-2">Kľúčové pojmy</h2>
          <div className="flex flex-wrap gap-1.5">
            {teza.klucove_pojmy.map((p) => (
              <span key={p} className="rp-chip bg-euba-accent/10 text-euba-accent">
                <WithAbbr text={p} />
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="rp-section rp-prose">
        <h2 className="!mt-0">Mentálny model</h2>
        <p><WithAbbr text={teza.princip_mentalny_model} /></p>
      </section>

      <section className="rp-section rp-prose">
        <h2 className="!mt-0">Jadro odpovede ({teza.cas_na_odpoved_min ?? 10} min)</h2>
        <p><em><WithAbbr text={teza.jadro_odpovede_10min.uvod} /></em></p>
        {teza.jadro_odpovede_10min.casti.map((c, i) => (
          <div key={i}>
            {c.nadpis && <h3>{c.nadpis}</h3>}
            {c.text && <p><WithAbbr text={c.text} /></p>}
            {c.zaver && <p className="rounded-xl bg-euba-accent/10 border border-euba-accent/30 p-3"><strong>Záver:</strong> <WithAbbr text={c.zaver} /></p>}
          </div>
        ))}
      </section>

      {teza.rozsirena_baza && teza.rozsirena_baza.length > 0 && (
        <section className="rp-section rp-prose">
          <h2 className="!mt-0">Rozšírená báza</h2>
          {teza.rozsirena_baza.map((r, i) => (
            <details key={i} className="mb-2 rounded-xl border border-[var(--rp-border)] p-3">
              <summary className="cursor-pointer font-medium">{r.nadpis}</summary>
              <p className="mt-2"><WithAbbr text={r.text} /></p>
            </details>
          ))}
        </section>
      )}

      {teza.priklady && teza.priklady.length > 0 && (
        <section className="rp-section rp-prose">
          <h2 className="!mt-0">Príklady</h2>
          {teza.priklady.map((p, i) => (
            <div key={i} className="rounded-2xl border border-[var(--rp-border)] p-4 mb-4">
              <h3 className="!mt-0">{p.nazov}</h3>
              <p><strong>Zadanie:</strong> <WithAbbr text={p.zadanie} /></p>
              {p.uctovanie && p.uctovanie.length > 0 && (
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>Rok</th><th>MD</th><th>D</th><th className="text-right">Suma</th><th>Popis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.uctovanie.map((r, idx) => (
                        <tr key={idx}>
                          <td className="whitespace-nowrap">{r.rok ?? ""}</td>
                          <td className="whitespace-nowrap font-mono">{r.md}</td>
                          <td className="whitespace-nowrap font-mono">{r.d}</td>
                          <td className="text-right whitespace-nowrap">{typeof r.suma === "number" ? r.suma.toLocaleString("sk-SK") : r.suma}</td>
                          <td>{r.popis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p><strong>Riešenie:</strong> <WithAbbr text={p.riesenie} /></p>
              {p.dopad_na_zd && <p><strong>Dopad na ZD:</strong> <WithAbbr text={p.dopad_na_zd} /></p>}
            </div>
          ))}
        </section>
      )}

      {teza.vizualy && teza.vizualy.length > 0 && (
        <section className="rp-section">
          <h2 className="font-heading text-lg mb-3">Vizuály <span className="text-xs font-normal text-[var(--rp-muted)]">(klik = priblížiť)</span></h2>
          <div className="grid md:grid-cols-2 gap-4">
            {teza.vizualy.map((v, i) => {
              const src = mapVisualSrc(v.subor);
              return (
                <figure key={i} className="rounded-2xl border border-[var(--rp-border)] p-3 bg-white">
                  <button
                    type="button"
                    onClick={() => setLightbox({ src, alt: v.popis })}
                    aria-label={`Priblížiť: ${v.popis}`}
                    className="block w-full group relative"
                  >
                    <img src={src} alt={v.popis} loading="lazy" className="w-full h-auto transition group-hover:opacity-90" />
                    <span aria-hidden className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1.5 opacity-80 group-hover:opacity-100">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg>
                    </span>
                  </button>
                  <figcaption className="text-xs text-[var(--rp-muted)] mt-2 text-left">{v.popis}</figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      )}

      {lightbox && (
        <VisualLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}

      {teza.caste_doplnujuce_otazky && teza.caste_doplnujuce_otazky.length > 0 && (
        <section className={"rp-section rp-prose " + (isCommittee ? "ring-2 ring-euba-purple/40" : "")}>
          <h2 className="!mt-0">Časté doplňujúce otázky {isCommittee && <span className="rp-chip bg-euba-purple/15 text-euba-purple ml-2 text-xs">pre komisiu</span>}</h2>
          {teza.caste_doplnujuce_otazky.map((q, i) => (
            <details key={i} className="mb-2 rounded-xl border border-[var(--rp-border)] p-3">
              <summary className="cursor-pointer font-medium"><WithAbbr text={q.otazka} /></summary>
              <p className="mt-2"><WithAbbr text={q.odpoved} /></p>
            </details>
          ))}
        </section>
      )}

      {teza.pasce_caste_chyby && teza.pasce_caste_chyby.length > 0 && (
        <section className={"rp-section rp-prose " + (isCommittee ? "ring-2 ring-euba-orange/40" : "")}>
          <h2 className="!mt-0">Pasce a časté chyby {isCommittee && <span className="rp-chip bg-euba-orange/15 text-euba-orange ml-2 text-xs">pre komisiu</span>}</h2>
          <ul>
            {teza.pasce_caste_chyby.map((p, i) => (
              <li key={i}><WithAbbr text={p} /></li>
            ))}
          </ul>
        </section>
      )}

      {teza.zdroje && teza.zdroje.length > 0 && (
        <section className="rp-section rp-prose">
          <h2 className="!mt-0">Zdroje</h2>
          <ul>
            {teza.zdroje.map((z, i) => (
              <li key={i}>
                <span><WithAbbr text={z.nazov} /></span>
                {z.typ && <span className="ml-2 rp-chip rp-softer-bg text-xs">{z.typ}</span>}
                {z.kde && z.kde.startsWith("http") && (
                  <a className="rp-link ml-2" href={z.kde} target="_blank" rel="noreferrer">↗ link</a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="flex flex-wrap gap-2">
        <Link href="/tezy" className="rp-btn-ghost">← Späť na zoznam</Link>
        <Link href={`/tezy/${id}/test`} className="rp-btn-primary">Otestovať sa</Link>
      </nav>
    </article>
  );
}
