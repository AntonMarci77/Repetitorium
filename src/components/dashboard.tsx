"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computePacing, daysUntil, dueToday, getProfile, getProgress } from "@/lib/storage";
import { idsForProgram, indexForProgram, programLabel } from "@/lib/thesis-index";
import { ensureIndexMeta } from "@/lib/loaders";
import type { Profile, ProgressMap, TezaIndexItem } from "@/lib/types";

export function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [index, setIndex] = useState<TezaIndexItem[]>([]);

  useEffect(() => {
    const refresh = () => {
      setProfile(getProfile());
      setProgress(getProgress());
    };
    refresh();
    window.addEventListener("rp:profile", refresh);
    window.addEventListener("rp:progress", refresh);
    return () => {
      window.removeEventListener("rp:profile", refresh);
      window.removeEventListener("rp:progress", refresh);
    };
  }, []);

  useEffect(() => {
    if (!profile) return;
    const items = indexForProgram(profile.program);
    ensureIndexMeta(items).then((m) => setIndex([...m]));
  }, [profile]);

  const ids = useMemo(() => (profile ? idsForProgram(profile.program) : []), [profile]);

  const counts = useMemo(() => {
    let zvl = 0, roz = 0, nov = 0;
    for (const id of ids) {
      const e = progress[id];
      if (!e || e.status === "nove") nov++;
      else if (e.status === "rozpracovane") roz++;
      else if (e.status === "zvladnute") zvl++;
    }
    return { zvl, roz, nov };
  }, [ids, progress]);

  if (!profile) return null;

  const pacing = computePacing(ids, progress, profile.exam_date);
  const due = dueToday(ids, progress);
  const D = daysUntil(profile.exam_date);
  const progressPct = ids.length ? Math.round((counts.zvl * 100) / ids.length) : 0;
  const todayPack = due.length + pacing.novychZaDen;

  return (
    <div className="space-y-5">
      <header className="rp-card p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white">Dobré ráno!</h1>
            <p className="text-[var(--rp-muted)] text-sm">
              Program: <strong className="text-[var(--rp-fg)]">{programLabel(profile.program)}</strong>
              {" · "}
              Štátnica: <strong className="text-[var(--rp-fg)]">{profile.exam_date}</strong>
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-[var(--rp-muted)]">Dní do termínu</div>
            <div className="font-heading text-4xl text-euba-accent leading-none">{D}</div>
          </div>
        </div>
      </header>

      <section className="grid sm:grid-cols-3 gap-3">
        <Stat label="Zvládnuté" value={counts.zvl} total={ids.length} color="bg-euba-green/15 text-euba-green" />
        <Stat label="Rozpracované" value={counts.roz} total={ids.length} color="bg-euba-orange/15 text-euba-orange" />
        <Stat label="Nové" value={counts.nov} total={ids.length} color="bg-euba-ink/15 text-euba-ink dark:text-white" />
      </section>

      <section className="rp-section">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading text-lg">Dnešná dávka</h2>
          <span className="rp-chip bg-euba-accent/10 text-euba-accent">{todayPack} položiek</span>
        </div>
        <p className="text-sm text-[var(--rp-muted)]">
          {pacing.novychZaDen} nových téz + {due.length} dnes splatných opakovaní. Tempo: aby si stihol prvý prechod, potrebuješ {pacing.novychZaDen}/deň počas {pacing.firstPassDays} dní.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href="/test?mode=dnes" className="rp-btn-primary">Pokračovať</Link>
          <Link href="/simulacia" className="rp-btn-ghost">Simulácia</Link>
          <Link href="/hladanie" className="rp-btn-ghost">Hľadať</Link>
        </div>
      </section>

      <section className="rp-section">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading text-lg">Celkový progres</h2>
          <span className="text-sm text-[var(--rp-muted)]">{progressPct}% zvládnutých</span>
        </div>
        <ProgressBar pct={progressPct} />

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <CircleList title="Okruh I" items={index.filter((i) => i.okruh === "I")} progress={progress} />
          <CircleList title="Okruh II" items={index.filter((i) => i.okruh === "II")} progress={progress} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  return (
    <div className="rp-section flex items-center justify-between">
      <div>
        <div className="text-xs text-[var(--rp-muted)] uppercase tracking-wide">{label}</div>
        <div className="font-heading text-2xl">{value} <span className="text-base text-[var(--rp-muted)] font-normal">/ {total}</span></div>
      </div>
      <span className={"rp-chip " + color}>{total ? Math.round((value * 100) / total) : 0}%</span>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2.5 rounded-full bg-[var(--rp-border)] overflow-hidden">
      <div className="h-full bg-euba-accent transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

function CircleList({ title, items, progress }: { title: string; items: TezaIndexItem[]; progress: ProgressMap }) {
  if (!items.length) return null;
  // Zoradiť: BC pred ING, potom čísla
  const sorted = [...items].sort((a, b) => (a.program === b.program ? a.cislo - b.cislo : a.program === "BC" ? -1 : 1));
  return (
    <div>
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {sorted.map((it) => {
          const e = progress[it.id];
          const cls =
            e?.status === "zvladnute" ? "bg-euba-green text-white" :
            e?.status === "rozpracovane" ? "bg-euba-orange/80 text-white" :
            "rp-soft-bg text-[var(--rp-fg)]";
          const label = `${it.program} ${it.okruh}.${it.cislo}${it.nazov ? ` – ${it.nazov}` : ""}`;
          return (
            <Link
              key={it.id}
              href={`/tezy/${it.id}`}
              title={label}
              aria-label={label}
              className={"w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium hover:scale-[1.04] transition " + cls}
            >
              {it.program === "BC" ? "B" : "I"}{it.cislo}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
