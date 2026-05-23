"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";
import { getProfile } from "@/lib/storage";

const NAV = [
  { href: "/", label: "Domov", icon: "M3 12 12 3l9 9M5 10v10h14V10" },
  { href: "/tezy", label: "Tézy", icon: "M4 5h16v4H4zM4 11h16v4H4zM4 17h16v4H4z" },
  { href: "/test", label: "Test", icon: "M5 7h14M5 12h14M5 17h8" },
  { href: "/simulacia", label: "Simulácia", icon: "M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" },
  { href: "/hladanie", label: "Hľadať", icon: "M21 21 16.5 16.5M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [program, setProgram] = useState<string>("");

  useEffect(() => {
    const refresh = () => setProgram(getProfile()?.program ?? "");
    refresh();
    window.addEventListener("rp:profile", refresh);
    return () => window.removeEventListener("rp:profile", refresh);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur rp-bar-bg border-b border-[var(--rp-border)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="font-heading text-xl text-euba-ink dark:text-white">
            Repetitórium
          </Link>
          <span className="text-xs rp-chip bg-euba-accent/10 text-euba-accent">{program || "—"}</span>
          <nav className="ml-auto hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={
                  "px-3 py-1.5 rounded-lg text-sm " +
                  (active(pathname, n.href) ? "bg-euba-ink text-white" : "hover:rp-softer-bg")
                }
              >
                {n.label}
              </Link>
            ))}
            <Link href="/skratky" className="px-3 py-1.5 rounded-lg text-sm hover:rp-softer-bg">
              Skratky
            </Link>
            <Link href="/nastavenia" className="px-3 py-1.5 rounded-lg text-sm hover:rp-softer-bg">
              Nastavenia
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 py-5 md:py-8 flex-1 pb-24 md:pb-8">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--rp-border)] rp-bar-bg backdrop-blur">
        <ul className="grid grid-cols-5">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                className={
                  "flex flex-col items-center py-2 text-[11px] " +
                  (active(pathname, n.href) ? "text-euba-accent" : "text-[var(--rp-muted)]")
                }
                aria-current={active(pathname, n.href) ? "page" : undefined}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={n.icon} />
                </svg>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Footer />
    </div>
  );
}

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function ThemeToggle() {
  const { theme, setTheme, effective } = useTheme();
  const next = effective === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      title={`Prepnúť na ${next === "dark" ? "tmavý" : "svetlý"} režim`}
      onClick={() => setTheme(next)}
      aria-label="Prepnúť tému"
      className="rp-btn-ghost h-9 w-9 p-0"
    >
      {effective === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
      )}
    </button>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--rp-border)] bg-[var(--rp-card)] mt-8">
      <div className="max-w-5xl mx-auto px-4 py-6 text-xs text-[var(--rp-muted)] space-y-2">
        <p>
          <strong className="text-[var(--rp-fg)]">Repetitórium</strong> je neoficiálna, dobrovoľná študijná pomôcka.
          <span className="block">
            <strong>Nie je oficiálnou aplikáciou Ekonomickej univerzity v Bratislave ani Fakulty hospodárskej informatiky.</strong>
          </span>
          Obsah pripravil pedagóg vo voľnom čase; môže obsahovať chyby — <a className="rp-link" href="/opravy">nahláste ich cez formulár</a>. Pri štátnici je rozhodujúce platné znenie predpisov a pokyny skúšobnej komisie.
        </p>
        <p>
          Autor obsahu: <strong className="text-[var(--rp-fg)]">Ing. Anton Marci, PhD.</strong>, Katedra účtovníctva a audítorstva, Fakulta hospodárskej informatiky, Ekonomická univerzita v Bratislave.
        </p>
        <p>
          Projekt je zadarmo. Ak ho chcete podporiť, dobrovoľný dar: <code className="px-1.5 py-0.5 rounded rp-softer-bg">SK9011000000002932588341</code>.
          {" · "}
          <a className="rp-link" href="/o-aplikacii">O aplikácii</a>
          {" · "}
          <a className="rp-link" href="/log-oprav">Log opráv</a>
          {" · "}
          <a className="rp-link" href="/skratky">Skratky</a>
        </p>
        <p className="text-[10px] text-[var(--rp-muted)]/80">
          © {new Date().getFullYear()} Anton Marci · Kód: MIT · Obsah: CC BY-NC 4.0
        </p>
      </div>
    </footer>
  );
}
