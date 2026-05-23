"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { dueToday, getProfile, getProgress } from "@/lib/storage";
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
  const weak = ids
    .map((id) => ({ id, box: progress[id]?.box ?? 1, seen: progress[id]?.times_seen ?? 0 }))
    .filter((x) => x.box <= 2)
    .sort((a, b) => a.box - b.box || b.seen - a.seen)
    .map((x) => x.id);
  const newOnes = ids.filter((id) => !(progress[id]?.first_pass_done));

  const groups = [
    { id: "dnes", label: "Dnes splatné", items: due, color: "bg-euba-accent/15 text-euba-accent" },
    { id: "slabe", label: "Slabé miesta (Box 1–2)", items: weak, color: "bg-euba-orange/15 text-euba-orange" },
    { id: "nove", label: "Nové (ešte neprešiel)", items: newOnes, color: "bg-euba-ink/10 text-euba-ink dark:text-white" },
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
            <span className={"rp-chip " + initial.color}>{initial.items.length}</span>
          </div>
          <NextLink ids={initial.items} />
        </section>
      )}

      <section className="grid sm:grid-cols-2 gap-3">
        {groups.map((g) => (
          <div key={g.id} className="rp-section">
            <div className="flex items-center justify-between">
              <div className="font-medium">{g.label}</div>
              <span className={"rp-chip " + g.color}>{g.items.length}</span>
            </div>
            <p className="text-sm text-[var(--rp-muted)] mt-1">
              {g.items.length === 0 ? "Žiadne položky." : "Začni klikom — testovanie pôjde postupne."}
            </p>
            {g.items.length > 0 && <div className="mt-3"><NextLink ids={g.items} /></div>}
          </div>
        ))}
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
