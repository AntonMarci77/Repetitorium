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

## Štruktúra obsahu
Obsah je statický (v `/public`):
- `content/*.json` — 36 téz (BC 18 + ING 18), zdroj pravdy. Schéma vrátane MC distraktorov pre doplňujúce otázky.
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
