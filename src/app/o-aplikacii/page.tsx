import Link from "next/link";

export default function Page() {
  return (
    <article className="rp-section rp-prose max-w-3xl mx-auto">
      <h1 className="font-heading text-3xl text-euba-ink dark:text-white mb-3">O aplikácii</h1>

      <p>
        <strong>Repetitórium</strong> je neoficiálna, dobrovoľná študijná pomôcka na bakalárske
        a inžinierske štátnice z účtovníctva na <em>Fakulte hospodárskej informatiky Ekonomickej
        univerzity v&nbsp;Bratislave</em>.
      </p>

      <p>
        <strong>Nie je oficiálnou aplikáciou Ekonomickej univerzity v Bratislave ani Fakulty
        hospodárskej informatiky.</strong> Obsah pripravil pedagóg vo voľnom čase a môže obsahovať
        chyby — prosím, nahláste ich cez <Link className="rp-link" href="/opravy">formulár opravy</Link>.
        Pri štátnici je vždy rozhodujúce platné znenie predpisov a pokyny skúšobnej komisie.
      </p>

      <h2>Súkromie</h2>
      <p>
        Appka nezbiera osobné údaje a nemá účty. Tvoj progres je uložený lokálne v prehliadači
        (localStorage). Medzi zariadeniami ho prenesieš cez <Link className="rp-link" href="/nastavenia">export/import zálohy</Link>.
        Formulár opravy odošle tvoj text (a voliteľný e-mail) cez službu Formspree priamo autorovi.
      </p>

      <h2>Licencie</h2>
      <ul>
        <li>Kód: <strong>MIT</strong>.</li>
        <li>Obsah (tézy, mapy, skratky): <strong>CC BY-NC 4.0</strong> – voľné nekomerčné použitie s uvedením autora.</li>
      </ul>

      <h2>Podpora</h2>
      <p>
        Projekt je zadarmo. Ak ho chcete podporiť, dobrovoľný dar na účet:{" "}
        <code className="px-1.5 py-0.5 rounded rp-softer-bg">SK9011000000002932588341</code>.
      </p>

      <h2>Autor</h2>
      <p>
        Anton Marci, Katedra účtovníctva a audítorstva FHI EU v Bratislave.{" "}
        Repozitár:{" "}
        <a className="rp-link" href="https://github.com/AntonMarci77/Repetitorium" target="_blank" rel="noreferrer">
          github.com/AntonMarci77/Repetitorium
        </a>.
      </p>
    </article>
  );
}
