"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { defaultProfile, exportBackup, getProfile, importBackup, patchProfile, resetAll, setProfile } from "@/lib/storage";
import { clearContentCaches } from "@/lib/loaders";
import { programLabel } from "@/lib/thesis-index";
import type { Profile, Program } from "@/lib/types";

export function Nastavenia() {
  const [p, setP] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const r = () => setP(getProfile());
    r();
    window.addEventListener("rp:profile", r);
    return () => window.removeEventListener("rp:profile", r);
  }, []);

  if (!p) return null;

  const doExport = () => {
    const data = exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `repetitorium-zaloha-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const doImport = async (file: File) => {
    try {
      const txt = await file.text();
      const data = JSON.parse(txt);
      const r = importBackup(data);
      setMsg(r.ok ? "Záloha načítaná." : `Chyba: ${r.error}`);
    } catch (e: any) {
      setMsg(`Chyba: ${e.message || e}`);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white">Nastavenia</h1>
      </header>

      <section className="rp-section space-y-4">
        <h2 className="font-heading text-lg">Profil</h2>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Program</span>
          <select
            className="rp-input"
            value={p.program}
            onChange={(e) => patchProfile({ program: e.target.value as Program })}
          >
            <option value="BC">{programLabel("BC")}</option>
            <option value="ING">{programLabel("ING")}</option>
            <option value="OBE">{programLabel("OBE")}</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Dátum štátnice</span>
          <input
            type="date"
            className="rp-input"
            value={p.exam_date}
            onChange={(e) => patchProfile({ exam_date: e.target.value })}
          />
        </label>
      </section>

      <section className="rp-section space-y-4">
        <h2 className="font-heading text-lg">Vzhľad a zvuk</h2>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Veľkosť písma ({Math.round(p.settings.fontScale * 100)}%)</span>
          <input
            type="range" min={0.9} max={1.4} step={0.05}
            value={p.settings.fontScale}
            onChange={(e) => {
              patchProfile({ settings: { ...p.settings, fontScale: Number(e.target.value) } });
              document.documentElement.style.fontSize = `${Number(e.target.value) * 16}px`;
            }}
            className="w-full"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Rýchlosť čítania (TTS) ({p.settings.ttsRate.toFixed(2)}×)</span>
          <input
            type="range" min={0.8} max={1.4} step={0.05}
            value={p.settings.ttsRate}
            onChange={(e) => patchProfile({ settings: { ...p.settings, ttsRate: Number(e.target.value) } })}
            className="w-full"
          />
        </label>
        <p className="text-xs text-[var(--rp-muted)]">Tému (svetlý/tmavý režim) prepíname tlačidlom v hornej lište.</p>
      </section>

      <section className="rp-section space-y-3">
        <h2 className="font-heading text-lg">Záloha (prenos medzi zariadeniami)</h2>
        <p className="text-sm text-[var(--rp-muted)]">Stiahni JSON so svojím profilom a progresom. Načítaj ho na inom zariadení.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={doExport} className="rp-btn-primary">Stiahnuť zálohu</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); }}
          />
          <button onClick={() => fileRef.current?.click()} className="rp-btn-ghost">Načítať zálohu…</button>
        </div>
        {msg && <p className="text-sm">{msg}</p>}
      </section>

      <section className="rp-section space-y-3">
        <h2 className="font-heading text-lg">Obnoviť obsah</h2>
        <p className="text-sm text-[var(--rp-muted)]">
          Ak vidíš zastaraný alebo poškodený obsah (napr. chyba parsovania JSON), zmaž lokálny cache aplikácie a stiahni najnovšie tézy, mapy a skratky zo servera. Tvoj profil a progres ostávajú.
        </p>
        <button
          onClick={async () => {
            const r = await clearContentCaches();
            setMsg(`Cache zmazaný (${r.entries} položiek v ${r.caches} úložiskách). Obnovujem…`);
            // Hard reload aby sa service worker preregistroval
            setTimeout(() => window.location.reload(), 600);
          }}
          className="rp-btn-accent"
        >
          Obnoviť obsah (vyčistiť cache)
        </button>
      </section>

      <section className="rp-section space-y-3">
        <h2 className="font-heading text-lg text-euba-red">Vymazať údaje</h2>
        <p className="text-sm text-[var(--rp-muted)]">Zmaže profil a progres z tohto zariadenia (zostane to len v prípade, že máš zálohu).</p>
        <button
          onClick={() => { if (confirm("Naozaj vymazať profil aj progres?")) { resetAll(); } }}
          className="rp-btn-ghost border-euba-red/40 text-euba-red"
        >
          Vymazať všetko z tohto zariadenia
        </button>
      </section>

      <p className="text-xs text-[var(--rp-muted)]">
        Pozri tiež: <Link href="/o-aplikacii" className="rp-link">O aplikácii</Link> · <Link href="/log-oprav" className="rp-link">Log opráv</Link>
      </p>
    </div>
  );
}
