"use client";
import { useEffect, useMemo, useState } from "react";
import { defaultProfile, getProfile, setProfile } from "@/lib/storage";
import { programLabel } from "@/lib/thesis-index";
import type { Program } from "@/lib/types";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [needs, setNeeds] = useState(false);

  useEffect(() => {
    setMounted(true);
    const refresh = () => setNeeds(!getProfile());
    refresh();
    window.addEventListener("rp:profile", refresh);
    return () => window.removeEventListener("rp:profile", refresh);
  }, []);

  if (!mounted) return null;
  return needs ? <Onboarding /> : <>{children}</>;
}

const DEFAULT_DATES: Record<Program, string> = {
  ING: "2026-06-01",
  BC: "2026-06-08",
  OBE: "2026-06-01",
};

function Onboarding() {
  const [program, setProgramSel] = useState<Program>("BC");
  const [exam, setExam] = useState<string>(DEFAULT_DATES["BC"]);

  // ak zmení program a dátum bol default, prepnúť default
  const presetActive = useMemo(() => Object.values(DEFAULT_DATES).includes(exam), [exam]);
  useEffect(() => {
    if (presetActive) setExam(DEFAULT_DATES[program]);
  }, [program]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(defaultProfile(program, exam));
  };

  return (
    <main className="min-h-screen flex items-start md:items-center justify-center p-4">
      <form onSubmit={submit} className="rp-card w-full max-w-2xl p-6 md:p-8 space-y-6 animate-in">
        <header>
          <h1 className="font-heading text-3xl md:text-4xl text-euba-ink dark:text-white">Repetitórium</h1>
          <p className="text-[var(--rp-muted)] mt-1">
            Neoficiálna, dobrovoľná pomôcka na štátnice z účtovníctva (FHI EU v Bratislave).
          </p>
        </header>

        <section>
          <label className="block text-sm font-medium mb-2">Som…</label>
          <div className="grid sm:grid-cols-3 gap-2">
            {(["BC", "ING", "OBE"] as Program[]).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setProgramSel(p)}
                aria-pressed={program === p}
                className={
                  "rp-btn-ghost text-left px-4 py-3 " +
                  (program === p ? "ring-2 ring-euba-accent border-euba-accent" : "")
                }
              >
                <div className="font-medium">{programLabel(p)}</div>
                <div className="text-xs text-[var(--rp-muted)]">
                  {p === "BC" && "18 téz (Účtovníctvo)"}
                  {p === "ING" && "18 téz (Účtovníctvo a audítorstvo)"}
                  {p === "OBE" && "36 téz (BC + ING)"}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <label htmlFor="exam" className="block text-sm font-medium mb-2">Dátum štátnice</label>
          <input
            id="exam"
            type="date"
            className="rp-input"
            value={exam}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setExam(e.target.value)}
            required
          />
          <p className="text-xs text-[var(--rp-muted)] mt-1">
            Tempo (koľko nových téz za deň) sa naplánuje na mieru tomuto dátumu.
          </p>
        </section>

        <section className="rp-card rp-softer-bg p-4 text-sm">
          <strong className="font-heading">Ako to používať</strong>
          <ol className="list-decimal pl-5 mt-1 space-y-0.5 text-[var(--rp-muted)]">
            <li>Čítaj jadro tézy a pozri mentálnu mapu.</li>
            <li>Hovor odpoveď nahlas (počúvaj cez TTS, ak chceš).</li>
            <li>Otestuj sa otázkami a ohodnoť sa: nevedel / čiastočne / vedel.</li>
            <li>Appka ti vráti ťažké tézy presne vtedy, keď ich treba zopakovať.</li>
          </ol>
        </section>

        <button type="submit" className="rp-btn-primary w-full md:w-auto">
          Začať
        </button>

        <p className="text-xs text-[var(--rp-muted)]">
          Žiadne účty ani prihlasovanie. Progres ostáva v tomto zariadení.
        </p>
      </form>
    </main>
  );
}
