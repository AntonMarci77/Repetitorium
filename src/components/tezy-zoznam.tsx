"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProfile, getProgress } from "@/lib/storage";
import { ensureIndexMeta } from "@/lib/loaders";
import { indexForProgram } from "@/lib/thesis-index";
import type { Profile, ProgressMap, TezaIndexItem } from "@/lib/types";

export function TezyZoznam() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [items, setItems] = useState<TezaIndexItem[]>([]);
  const [filter, setFilter] = useState<"vsetko" | "nove" | "rozpracovane" | "zvladnute">("vsetko");
  const [okruh, setOkruh] = useState<"all" | "I" | "II">("all");
  const [program, setProgramFilt] = useState<"all" | "BC" | "ING">("all");

  useEffect(() => {
    const r = () => { setProfile(getProfile()); setProgress(getProgress()); };
    r();
    window.addEventListener("rp:profile", r);
    window.addEventListener("rp:progress", r);
    return () => { window.removeEventListener("rp:profile", r); window.removeEventListener("rp:progress", r); };
  }, []);

  useEffect(() => {
    if (!profile) return;
    ensureIndexMeta(indexForProgram(profile.program)).then((m) => setItems([...m]));
  }, [profile]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (okruh !== "all" && it.okruh !== okruh) return false;
      if (program !== "all" && it.program !== program) return false;
      const e = progress[it.id];
      const st = e?.status ?? "nove";
      if (filter !== "vsetko" && st !== filter) return false;
      return true;
    });
  }, [items, okruh, program, filter, progress]);

  if (!profile) return null;
  const showProgramFilter = profile.program === "OBE";

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white">Tézy</h1>
          <p className="text-sm text-[var(--rp-muted)]">{items.length} téz · {filtered.length} zobrazených</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showProgramFilter && (
            <Selector value={program} onChange={(v) => setProgramFilt(v as any)} options={[
              { v: "all", l: "BC + ING" }, { v: "BC", l: "BC" }, { v: "ING", l: "ING" },
            ]} />
          )}
          <Selector value={okruh} onChange={(v) => setOkruh(v as any)} options={[
            { v: "all", l: "Oba okruhy" }, { v: "I", l: "Okruh I" }, { v: "II", l: "Okruh II" },
          ]} />
          <Selector value={filter} onChange={(v) => setFilter(v as any)} options={[
            { v: "vsetko", l: "Všetko" }, { v: "nove", l: "Nové" }, { v: "rozpracovane", l: "Rozpracované" }, { v: "zvladnute", l: "Zvládnuté" },
          ]} />
        </div>
      </header>

      <ul className="grid sm:grid-cols-2 gap-3">
        {filtered.map((it) => {
          const e = progress[it.id];
          const st = e?.status ?? "nove";
          const dot =
            st === "zvladnute" ? "bg-euba-green" : st === "rozpracovane" ? "bg-euba-orange" : "bg-[var(--rp-muted)]";
          const updated = e && e.last_seen_version && e.last_seen_version !== it.verzia;
          return (
            <li key={it.id} className="rp-card hover:shadow transition">
              <Link href={`/tezy/${it.id}`} className="block p-4">
                <div className="flex items-center gap-2 text-xs text-[var(--rp-muted)]">
                  <span className="rp-chip rp-softer-bg">{it.program} · Okruh {it.okruh} · {it.cislo}</span>
                  <span className={"w-2.5 h-2.5 rounded-full " + dot} aria-hidden />
                  <span className="capitalize">{st}</span>
                  {updated && <span className="rp-chip bg-euba-orange/15 text-euba-orange">aktualizované</span>}
                  {e?.box ? <span className="rp-chip bg-euba-accent/10 text-euba-accent ml-auto">Box {e.box}</span> : null}
                </div>
                <div className="mt-2 font-medium leading-snug">{it.nazov || it.id}</div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Selector({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <select className="rp-input w-auto" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
