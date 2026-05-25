"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { computePacing, dueToday, getDailyReviews, getProfile, getProgress } from "@/lib/storage";
import { ensureIndexMeta } from "@/lib/loaders";
import { idsForProgram, indexForProgram } from "@/lib/thesis-index";
import type { Profile, ProgressMap, TezaIndexItem } from "@/lib/types";

export function TestHub() {
  const sp = useSearchParams();
  const mode = sp.get("mode");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [index, setIndex] = useState<TezaIndexItem[]>([]);

  useEffect(() => {
    const r = () => { setProfile(getProfile()); setProgress(getProgress()); };
    r();
    window.addEventListener("rp:profile", r);
    window.addEventListener("rp:progress", r);
    return () => { window.removeEventListener("rp:profile", r); window.removeEventListener("rp:progress", r); };
  }, []);
  useEffect(() => {
    if (!profile) return;
    ensureIndexMeta(indexForProgram(profile.program)).then((m) => setIndex([...m]));
  }, [profile]);

  if (!profile) return null;
  const ids = idsForProgram(profile.program);
  const due = dueToday(ids, progress);
  const pacing = computePacing(ids, progress, profile.exam_date);
  const todayPack = due.length + pacing.novychZaDen; // celková dnešná dávka
  const todayDone = getDailyReviews().count;
  const weak = ids
    .map((id) => ({ id, box: progress[id]?.box ?? 1, seen: progress[id]?.times_seen ?? 0 }))
    .filter((x) => x.box <= 2)
    .sort((a, b) => a.box - b.box || b.seen - a.seen)
    .map((x) => x.id);
  const newOnes = ids.filter((id) => !(progress[id]?.first_pass_done));

  const dnesPool = [...due, ...newOnes.slice(0, Math.max(0, pacing.novychZaDen))];
  const groups = [
    {
      id: "dnes",
      label: "Dnes zopakované",
      items: dnesPool,
      color: "bg-euba-accent/15 text-euba-accent",
      // Špeciálne pre tento rámček: ukážeme zlomok hotové/potrebné
      ratio: { done: todayDone, total: todayPack },
    },
    { id: "slabe", label: "Slabé miesta (Box 1–2)", items: weak, color: "bg-euba-orange/15 text-euba-orange" },
    { id: "nove", label: "Nové (ešte neprešiel/neprešla)", items: newOnes, color: "bg-euba-ink/10 text-euba-ink dark:text-white" },
  ];

  const initial = mode ? groups.find((g) => g.id === mode) : null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white">Sebatestovanie</h1>
        <p className="text-sm text-[var(--rp-muted)]">Vyber režim — appka ťa zoberie cez tézy postupne.</p>
      </header>

      {initial && initial.items.length > 0 && (
        <section className="rp-section">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading text-lg">{initial.label}</h2>
            <span className={"rp-chip " + initial.color}>
              {"ratio" in initial && initial.ratio
                ? `${initial.ratio.done} / ${initial.ratio.total}`
                : initial.items.length}
            </span>
          </div>
          <NextLink ids={initial.items} />
        </section>
      )}

      <section className="grid sm:grid-cols-2 gap-3">
        {groups.map((g) => {
          const hasRatio = "ratio" in g && g.ratio;
          const chipLabel = hasRatio ? `${g.ratio!.done} / ${g.ratio!.total}` : String(g.items.length);
          const subtitle = hasRatio
            ? (g.ratio!.total === 0
                ? "Dnes nie sú potrebné žiadne opakovania."
                : g.ratio!.done >= g.ratio!.total
                  ? "✓ Hotovo na dnes! Môžeš pokračovať dobrovoľne."
                  : `Zostáva ${g.ratio!.total - g.ratio!.done}. Začni klikom.`)
            : (g.items.length === 0 ? "Žiadne položky." : "Začni klikom — testovanie pôjde postupne.");
          return (
            <div key={g.id} className="rp-section">
              <div className="flex items-center justify-between">
                <div className="font-medium">{g.label}</div>
                <span className={"rp-chip " + g.color}>{chipLabel}</span>
              </div>
              <p className="text-sm text-[var(--rp-muted)] mt-1">{subtitle}</p>
              {g.items.length > 0 && <div className="mt-3"><NextLink ids={g.items} /></div>}
            </div>
          );
        })}

        {/* 4. rámček — MC kvíz */}
        <div className="rp-section">
          <div className="flex items-center justify-between">
            <div className="font-medium">Rýchly MC kvíz</div>
            <span className="rp-chip bg-euba-purple/15 text-euba-purple">nový</span>
          </div>
          <p className="text-sm text-[var(--rp-muted)] mt-1">
            Iba testové otázky (ABCD). Bez „hovor nahlas", bez vplyvu na plán opakovaní.
          </p>
          <div className="mt-3">
            <Link href="/kviz" className="rp-btn-primary">Spustiť kvíz</Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg mb-2">Téma → test</h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {index.map((it) => (
            <li key={it.id}>
              <Link href={`/tezy/${it.id}/test`} className="rp-btn-ghost w-full justify-start">
                <span className="rp-chip rp-softer-bg text-xs mr-2">{it.program} {it.okruh}.{it.cislo}</span>
                {it.nazov || it.id}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function NextLink({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return <Link href={`/tezy/${ids[0]}/test`} className="rp-btn-primary">Začať s {ids[0]}</Link>;
}
