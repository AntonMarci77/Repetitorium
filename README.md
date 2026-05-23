# Repetitórium

Bezplatná webová (PWA) pomôcka na prípravu na **štátnice z účtovníctva** na FHI EU v Bratislave — pre študentov bakalárskeho (Účtovníctvo) aj inžinierskeho (Účtovníctvo a audítorstvo) štúdia, a pre členov skúšobnej komisie.

Repozitár: https://github.com/AntonMarci77/Repetitorium

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
- `content/*.json` — tézy (zdroj pravdy).
- `visuals/*.svg` — schémy a grafy.
- `skratky.json` — slovník skratiek.
- `mapy/*.json` — mentálne mapy.

Schéma tézy a podrobné zadanie: pozri `Podklad_pre_Claude_Code.md`.

## Nahlásenie chyby / návrhu
V appke tlačidlo **„Nahlásiť opravu"** (typ: chyba / vylepšenie / doplnenie). Každá zverejnená oprava je vidno v **[Logu opráv](./changelog.md)**.

## Podpora
Projekt je zadarmo. Ak ho chcete podporiť, dobrovoľný dar: **SK9011000000002932588341**.

## Licencie
- Kód: **MIT**.
- Obsah (tézy, mapy, skratky): **CC BY-NC 4.0** (voľné nekomerčné použitie s uvedením autora).
