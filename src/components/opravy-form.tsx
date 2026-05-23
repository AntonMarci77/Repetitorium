"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, ValidationError } from "@formspree/react";

export function OpravyForm() {
  const sp = useSearchParams();
  const tezaId = sp.get("teza") ?? "";
  const tezaNazov = sp.get("nazov") ?? "";
  const projectConfigured = Boolean(process.env.NEXT_PUBLIC_FORMSPREE_PROJECT);

  const [state, handleSubmit] = useForm("opravy");
  const [typ, setTyp] = useState<"chyba" | "vylepsenie" | "doplnenie">("chyba");

  useEffect(() => {
    // reset typu pri prvom načítaní
  }, []);

  if (state.succeeded) {
    return (
      <div className="rp-section text-center space-y-3 max-w-xl mx-auto">
        <h1 className="font-heading text-2xl text-euba-ink dark:text-white">Ďakujem!</h1>
        <p className="text-[var(--rp-muted)]">Hlásenie bolo odoslané. Ak je opravené, objaví sa to v Logu opráv.</p>
        <div className="flex justify-center gap-2">
          <a href="/log-oprav" className="rp-btn-ghost">Log opráv</a>
          <a href="/tezy" className="rp-btn-primary">Späť na tézy</a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rp-section max-w-2xl mx-auto space-y-4">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl text-euba-ink dark:text-white">Nahlásiť opravu</h1>
        <p className="text-sm text-[var(--rp-muted)]">
          Vďaka — každá oprava posúva projekt. Po zverejnení sa zmena objaví v <a className="rp-link" href="/log-oprav">Logu opráv</a>.
        </p>
      </header>

      {!projectConfigured && (
        <div className="rounded-xl border border-euba-orange/40 bg-euba-orange/10 text-sm p-3 text-euba-orange">
          <strong>Pozn.:</strong> chýba <code>NEXT_PUBLIC_FORMSPREE_PROJECT</code> v env.
          Odoslanie nemusí fungovať lokálne, kým nedoplníš <code>.env.local</code> alebo Vercel env.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Typ</label>
        <div className="grid grid-cols-3 gap-2">
          {(["chyba","vylepsenie","doplnenie"] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTyp(t)}
              aria-pressed={typ === t}
              className={"rp-btn-ghost text-sm " + (typ === t ? "ring-2 ring-euba-accent border-euba-accent" : "")}
            >
              {t === "chyba" ? "Chyba" : t === "vylepsenie" ? "Vylepšenie" : "Doplnenie"}
            </button>
          ))}
        </div>
        <input type="hidden" name="typ" value={typ} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium mb-1">ID tézy (voliteľné)</span>
          <input className="rp-input" name="teza_id" defaultValue={tezaId} placeholder="napr. BC-I-1" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Názov tézy (voliteľné)</span>
          <input className="rp-input" name="teza_nazov" defaultValue={tezaNazov} />
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-medium mb-1">Popis (čo opraviť / doplniť)*</span>
        <textarea className="rp-input min-h-[140px]" name="text" required minLength={5} />
        <ValidationError prefix="Text" field="text" errors={state.errors} className="text-xs text-euba-red mt-1" />
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">Citácia / kontext (voliteľné)</span>
        <textarea className="rp-input min-h-[80px]" name="citacia" placeholder="Skopíruj vetu, ktorej sa to týka." />
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">Tvoj e-mail (voliteľné)</span>
        <input className="rp-input" type="email" name="email" placeholder="ak chceš odpoveď" />
        <ValidationError prefix="Email" field="email" errors={state.errors} className="text-xs text-euba-red mt-1" />
      </label>

      <button type="submit" className="rp-btn-primary" disabled={state.submitting}>
        {state.submitting ? "Odosielam…" : "Odoslať"}
      </button>
    </form>
  );
}
