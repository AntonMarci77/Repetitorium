# Repetitórium

Bezplatná webová (PWA) pomôcka na prípravu na **štátnice z účtovníctva** na FHI EU v Bratislave — pre študentov bakalárskeho (Účtovníctvo) aj inžinierskeho (Účtovníctvo a audítorstvo) štúdia, a pre členov skúšobnej komisie.

🌐 **Live:** https://repetitorium.vercel.app
📦 **Repozitár:** https://github.com/AntonMarci77/Repetitorium

> ⚠️ **Neoficiálna, dobrovoľná študijná pomôcka. NIE je oficiálnou aplikáciou Ekonomickej univerzity v Bratislave ani Fakulty hospodárskej informatiky.** Obsah pripravil pedagóg vo voľnom čase a môže obsahovať chyby — nahláste ich, prosím. Pri štátnici je rozhodujúce platné znenie predpisov a pokyny komisie.

## Čo appka vie
- Čítanie 36 téz (BC 18 + ING 18) vrátane príkladov s účtovaním a vizuálov.
- **Mentálne mapy** ku každej téze (štruktúra ústnej odpovede).
- **Sebatestovanie s opakovaním** (spaced repetition, Leitnerov systém) — hovor nahlas, ohodnoť sa, ťažké sa vracajú častejšie.
- **Simulácia štátnice** — náhodné vytiahnutie tézy + ~10-min časovač.
- **Tempo učenia** podľa zadaného dátumu štátnice.
- **Slovník skratiek** a fulltextové vyhľadávanie.
- **Počúvanie** obsahu (čítanie nahlas v prehliadači).
- Funguje **offline** (PWA), progres sa ukladá v zariadení; prenos medzi zariadeniami cez export/import zálohy.

## Technológie
Next.js (App Router) + TypeScript + Tailwind CSS, PWA. **Bez backendu** — progres v `localStorage`. Hosting Vercel. Formulár opráv cez Formspree.

## Lokálny beh
```bash
npm install
cp .env.example .env.local   # doplň hodnoty (pozri nižšie)
npm run dev                  # http://localhost:3000
npm run build && npm start
```

## Konfigurácia a tajomstvá
- `NEXT_PUBLIC_FORMSPREE_PROJECT` — **verejné** Formspree Project ID (smie byť v repe aj v klientskom kóde).
- `FORMSPREE_DEPLOY_KEY` — **TAJNÉ**. Nikdy necommitovať. Nastaviť vo Vercel (Environment Variables) a lokálne v `.env.local`. Používa sa len pri nasadení definície formulára: `npx @formspree/cli deploy`.
- `.gitignore` musí obsahovať `.env*.local` (a `.env`). Vzor premenných je v `.env.example`.

## Obsah — tok dát a ako ho aktualizovať

**Zdroj pravdy** obsahu nie je v tomto repe, ale v OneDrive priečinku autora. Tento repo má len **kópiu** v `/public/`, ktorá sa nahráva na Vercel pri deployi.

```
┌──────────────────────────────────────────────┐
│ ZDROJ (OneDrive)                              │   ← edituj sa TU
│  …/Štátnice app/                              │
│    02_Obsah/*.json          (36 téz)          │
│    03_Vizualy/*.svg         (71 schém)        │
│    05_Aplikacia/mapy/*.svg  (36 máp)          │
│    05_Aplikacia/mapy/*.json (36 fallback)     │
│    05_Aplikacia/esencie/*.json                │
│    05_Aplikacia/skratky.json                  │
│    05_Aplikacia/changelog.md                  │
└──────────────────────────────────────────────┘
                 │  npm run sync
                 ▼
┌──────────────────────────────────────────────┐
│ REPO (tento priečinok)                        │
│  public/                                      │
│    content/, visuals/, mapy/, mapy-esencie/,  │
│    skratky.json, changelog.md                 │
└──────────────────────────────────────────────┘
                 │  git push
                 ▼
┌──────────────────────────────────────────────┐
│ GITHUB (AntonMarci77/Repetitorium)            │
└──────────────────────────────────────────────┘
                 │  npx vercel --prod
                 ▼
┌──────────────────────────────────────────────┐
│ VERCEL (repetitorium.vercel.app)              │
│ Appka číta s NetworkFirst stratégiou —        │
│ čerstvé dáta majú prednosť pred PWA cache.    │
└──────────────────────────────────────────────┘
```

### Ako aktualizovať obsah

1. **Edituj v zdroji** (OneDrive) — uprav JSON tézy, pridaj záznam do `changelog.md`, zvýš `verzia` v upravenej téze (napr. `"1.0"` → `"1.1"`).
2. **Sync do repa:**
   ```bash
   npm run sync
   ```
   Skript validuje všetky JSONy, zobrazí počty súborov a verzie všetkých téz, vypíše ktoré sa zmenili.
3. **Deploy:**
   ```bash
   npm run release
   ```
   Spraví sync + `git commit` + `git push` + `vercel --prod` v jednom kroku.

   Alebo manuálne:
   ```bash
   git add public && git commit -m "content: …" && git push
   npx vercel --prod --yes
   ```

### Vlastná zdrojová cesta

Defaultný zdroj je `C:/Users/anton/OneDrive/EUBA - výuka/20252026/Štátnice app`. Ak je inde:
```bash
npm run sync -- /iná/cesta
# alebo
RP_SOURCE=/iná/cesta npm run sync
```

### Štruktúra `/public/`
- `content/*.json` — 36 téz (BC 18 + ING 18), schéma vrátane MC distraktorov pre doplňujúce otázky.
- `visuals/*.svg` — 71 schém a grafov (klikateľné, otvoria sa v lightboxe so zoomom).
- `mapy/*.svg` — 36 grafických mentálnych máp (stred = názov tézy, vetva = bod osnovy + esencia odpovede).
- `mapy/*.json` — JSON tree mapy (fallback ak by SVG zlyhal).
- `mapy-esencie/*.json` — zdrojové esencie máp pre prípadné úpravy.
- `skratky.json` — slovník skratiek (inline tooltipy v texte).
- `changelog.md` — log opráv (rendrovaný na `/log-oprav`).

## Funkčné stránky
- `/` — dashboard (odpočet dní, dnešná dávka, progres po okruhoch)
- `/tezy` — zoznam s filtrami (program, okruh, stav)
- `/tezy/[id]` — detail (jadro, rozšírená báza, príklady s MD/D, vizuály, doplňujúce, pasce, test, zdroje)
- `/tezy/[id]/mapa` — grafická mentálna mapa so zoomom
- `/tezy/[id]/test` — sebatestovanie (Korda-style MC + Leitner SR)
- `/test` — hub režimov (dnes splatné / slabé miesta / nové)
- `/simulacia` — náhodná téza + 10-min časovač
- `/hladanie` — fulltext (FlexSearch) cez celý obsah
- `/skratky` — slovník skratiek
- `/opravy` — Formspree formulár
- `/log-oprav` — changelog.md
- `/nastavenia` — profil, dátum štátnice, export/import JSON zálohy

Schéma tézy a podrobné zadanie: pozri `Podklad_pre_Claude_Code.md` (v zdrojovom OneDrive priečinku).

## Nahlásenie chyby / návrhu
V appke tlačidlo **„Nahlásiť opravu"** (typ: chyba / vylepšenie / doplnenie). Každá zverejnená oprava je vidno v **[Logu opráv](./changelog.md)**.

## Podpora
Projekt je zadarmo. Ak ho chcete podporiť, dobrovoľný dar: **SK9011000000002932588341**.

## Licencie
- Kód: **MIT**.
- Obsah (tézy, mapy, skratky): **CC BY-NC 4.0** (voľné nekomerčné použitie s uvedením autora).
