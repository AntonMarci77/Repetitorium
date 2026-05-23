"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadMapa, loadTeza, mapSvgPath, svgMapaExists } from "@/lib/loaders";
import type { MapNode, MentalnaMapa, Teza } from "@/lib/types";
import { WithAbbr } from "./abbr-inline";
import { VisualLightbox } from "./visual-lightbox";

export function MentalnaMapaView({ id }: { id: string }) {
  const [svgUrl, setSvgUrl] = useState<string | null | undefined>(undefined); // undefined = loading
  const [teza, setTeza] = useState<Teza | null>(null);
  const [mapa, setMapa] = useState<MentalnaMapa | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Najprv skús SVG (grafická mapa). Ak nie je, fallback na JSON tree.
  useEffect(() => {
    let cancel = false;
    (async () => {
      const url = mapSvgPath(id);
      if (url && (await svgMapaExists(id))) {
        if (!cancel) setSvgUrl(url);
      } else {
        if (!cancel) setSvgUrl(null);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  // Načítaj tézu pre nadpis/meta (vždy)
  useEffect(() => { loadTeza(id).then(setTeza).catch(() => {}); }, [id]);

  // JSON tree len ako fallback ak SVG nie je
  useEffect(() => {
    if (svgUrl !== null) return;
    loadMapa(id).then((m) => setMapa(m)).catch(() => setMapa(null));
  }, [id, svgUrl]);

  if (svgUrl === undefined) return <div className="rp-section">Načítavam…</div>;

  const meta = teza ? (
    <header>
      <div className="text-xs text-[var(--rp-muted)]">
        {teza.program} · Okruh {teza.okruh} · Téza {teza.cislo}
      </div>
      <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white">{teza.nazov}</h1>
      <p className="text-sm text-[var(--rp-muted)]">Mentálna mapa — esencia odpovede k bodom tézy.</p>
    </header>
  ) : null;

  // ── SVG verzia (preferovaná) ──────────────────────────────────────────
  if (svgUrl) {
    const alt = teza ? `${teza.nazov} — mentálna mapa` : `Mentálna mapa ${id}`;
    return (
      <article className="space-y-4">
        {meta}

        <figure className="rp-section">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`Priblížiť: ${alt}`}
            className="block w-full group relative bg-[#f7f6f3] rounded-xl overflow-hidden"
          >
            <img
              src={svgUrl}
              alt={alt}
              loading="lazy"
              className="w-full h-auto transition group-hover:opacity-95"
            />
            <span
              aria-hidden
              className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-2 opacity-90 group-hover:opacity-100 shadow-lg"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>
              </svg>
            </span>
          </button>
          <figcaption className="text-xs text-[var(--rp-muted)] mt-2 text-center">
            Klik na mapu = priblížiť · ťahaním pohyb · koliesko zoom
          </figcaption>
        </figure>

        {lightboxOpen && (
          <VisualLightbox src={svgUrl} alt={alt} onClose={() => setLightboxOpen(false)} />
        )}

        <nav className="flex flex-wrap gap-2">
          <Link href={`/tezy/${id}`} className="rp-btn-ghost">← Detail tézy</Link>
          <Link href={`/tezy/${id}/test`} className="rp-btn-primary">Otestovať sa</Link>
        </nav>
      </article>
    );
  }

  // ── Fallback: JSON tree (ak SVG mapa neexistuje) ──────────────────────
  if (!mapa) return <div className="rp-section">Pre túto tézu nie je k dispozícii mapa.</div>;

  return (
    <article className="space-y-4">
      {meta || (
        <header>
          <div className="text-xs text-[var(--rp-muted)]">
            {mapa.program} · Okruh {mapa.okruh} · Téza {mapa.cislo}
          </div>
          <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white">{mapa.nazov}</h1>
          <p className="text-sm text-[var(--rp-muted)]">Mentálna mapa — štruktúra ústnej odpovede.</p>
        </header>
      )}

      <div className="rp-section">
        <Tree node={mapa.koren} root />
      </div>

      <nav className="flex flex-wrap gap-2">
        <Link href={`/tezy/${id}`} className="rp-btn-ghost">← Detail tézy</Link>
        <Link href={`/tezy/${id}/test`} className="rp-btn-primary">Otestovať sa</Link>
      </nav>
    </article>
  );
}

function Tree({ node, root = false, depth = 0 }: { node: MapNode; root?: boolean; depth?: number }) {
  const hasChildren = Array.isArray(node.deti) && node.deti.length > 0;
  if (root) {
    return (
      <div>
        <div className="font-heading text-lg text-euba-ink dark:text-white mb-3">
          <WithAbbr text={node.nazov} />
        </div>
        {hasChildren && (
          <ul className="space-y-1.5">
            {node.deti!.map((c, i) => <li key={i}><Tree node={c} depth={1} /></li>)}
          </ul>
        )}
      </div>
    );
  }
  if (!hasChildren) {
    return (
      <div className="pl-3 border-l border-[var(--rp-border)] py-1">
        <span className="text-sm"><WithAbbr text={node.nazov} /></span>
      </div>
    );
  }
  return (
    <details open={depth <= 1} className="rounded-lg">
      <summary className="cursor-pointer py-1.5 pl-3 border-l border-euba-accent/50 text-sm font-medium">
        <WithAbbr text={node.nazov} />
      </summary>
      <ul className="pl-4 mt-1 space-y-1.5">
        {node.deti!.map((c, i) => <li key={i}><Tree node={c} depth={depth + 1} /></li>)}
      </ul>
    </details>
  );
}
