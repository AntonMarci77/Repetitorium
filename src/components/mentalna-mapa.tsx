"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadMapa } from "@/lib/loaders";
import type { MapNode, MentalnaMapa } from "@/lib/types";
import { WithAbbr } from "./abbr-inline";

export function MentalnaMapaView({ id }: { id: string }) {
  const [mapa, setMapa] = useState<MentalnaMapa | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadMapa(id).then((m) => {
      if (!m) setErr("Pre túto tézu nie je k dispozícii mapa.");
      else setMapa(m);
    });
  }, [id]);

  if (err) return <div className="rp-section">{err}</div>;
  if (!mapa) return <div className="rp-section">Načítavam…</div>;

  return (
    <article className="space-y-4">
      <header>
        <div className="text-xs text-[var(--rp-muted)]">
          {mapa.program} · Okruh {mapa.okruh} · Téza {mapa.cislo}
        </div>
        <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white">{mapa.nazov}</h1>
        <p className="text-sm text-[var(--rp-muted)]">Mentálna mapa — štruktúra ústnej odpovede.</p>
      </header>

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
