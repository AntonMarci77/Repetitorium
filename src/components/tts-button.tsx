"use client";
import { useEffect, useRef, useState } from "react";
import { getProfile } from "@/lib/storage";

/**
 * Rozdelí text na chunky vhodné pre Web Speech API.
 * - primárne podľa hraníc viet (.!?…), s rešpektovaním úvodzoviek/zátvoriek
 * - ak je veta dlhšia ako maxLen, ešte rozdelí podľa čiarok/bodkočiarok,
 *   prípadne podľa medzier (whole-word)
 * Cieľ: každý chunk ≤ ~200 znakov — pod Chrome watchdog ~15 s pri rate 1.
 */
function splitToChunks(text: string, maxLen = 200): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  // 1) split na vety (zachovaj interpunkciu)
  const sentences = clean.split(/(?<=[.!?…])\s+/);
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= maxLen) {
      out.push(s);
      continue;
    }
    // 2) dlhá veta → split podľa čiarky/bodkočiarky/pomlčky
    const subparts = s.split(/(?<=[,;–—])\s+/);
    let buf = "";
    for (const p of subparts) {
      if ((buf + " " + p).trim().length > maxLen) {
        if (buf) out.push(buf.trim());
        if (p.length <= maxLen) buf = p;
        else {
          // 3) ešte príliš dlhé → split podľa medzier
          const words = p.split(/\s+/);
          buf = "";
          for (const w of words) {
            if ((buf + " " + w).trim().length > maxLen) {
              if (buf) out.push(buf.trim());
              buf = w;
            } else {
              buf = (buf ? buf + " " : "") + w;
            }
          }
        }
      } else {
        buf = (buf ? buf + " " : "") + p;
      }
    }
    if (buf) out.push(buf.trim());
  }
  return out.filter((x) => x.length > 0);
}

export function TtsButton({ text, label = "Počúvať", className }: { text: string; label?: string; className?: string }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voiceMissing, setVoiceMissing] = useState(false);
  const [progress, setProgress] = useState<{ i: number; total: number }>({ i: 0, total: 0 });

  // Queue stav (mutable cez ref aby HMR neporušil)
  const chunksRef = useRef<string[]>([]);
  const idxRef = useRef(0);
  const abortedRef = useRef(false);
  const keepAliveRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const probe = () => {
      const voices = window.speechSynthesis.getVoices();
      const hasSk = voices.some((v) => v.lang?.toLowerCase().startsWith("sk"));
      setVoiceMissing(voices.length > 0 && !hasSk);
    };
    probe();
    window.speechSynthesis.onvoiceschanged = probe;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      stopAll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearKeepAlive = () => {
    if (keepAliveRef.current != null) {
      window.clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  };

  /**
   * Chrome watchdog workaround:
   * Ak speak() beží > ~15 s, Chromium implementácia stíchne / opakuje.
   * Každých 12 s zavoláme pause()+resume() ktoré nepretrhne audio, ale resetuje watchdog.
   */
  const startKeepAlive = () => {
    clearKeepAlive();
    keepAliveRef.current = window.setInterval(() => {
      if (typeof window === "undefined") return;
      const ss = window.speechSynthesis;
      if (!ss.speaking || ss.paused || abortedRef.current) return;
      try { ss.pause(); ss.resume(); } catch { /* ignore */ }
    }, 12_000) as unknown as number;
  };

  const stopAll = () => {
    abortedRef.current = true;
    clearKeepAlive();
    if (typeof window === "undefined") return;
    try { window.speechSynthesis.cancel(); } catch {}
    setPlaying(false);
    setPaused(false);
    setProgress({ i: 0, total: 0 });
  };

  const speakChunkAt = (i: number) => {
    if (abortedRef.current) return;
    const chunks = chunksRef.current;
    if (i >= chunks.length) {
      // hotovo
      setPlaying(false);
      setPaused(false);
      clearKeepAlive();
      setProgress({ i: chunks.length, total: chunks.length });
      return;
    }
    setProgress({ i: i + 1, total: chunks.length });

    const u = new SpeechSynthesisUtterance(chunks[i]);
    const voices = window.speechSynthesis.getVoices();
    const sk = voices.find((v) => v.lang?.toLowerCase().startsWith("sk"));
    const cs = voices.find((v) => v.lang?.toLowerCase().startsWith("cs"));
    u.voice = sk || cs || voices[0] || null;
    u.lang = u.voice?.lang || "sk-SK";
    u.rate = getProfile()?.settings.ttsRate ?? 1;
    u.onend = () => {
      idxRef.current = i + 1;
      speakChunkAt(idxRef.current);
    };
    u.onerror = (ev) => {
      const reason = (ev as SpeechSynthesisErrorEvent).error;
      // používateľ stopol → koniec
      if (reason === "canceled" || reason === "interrupted") return;
      // inak preskoč chunk a pokračuj
      idxRef.current = i + 1;
      speakChunkAt(idxRef.current);
    };
    window.speechSynthesis.speak(u);
  };

  const play = () => {
    if (!supported) return;
    // reset
    abortedRef.current = true;
    try { window.speechSynthesis.cancel(); } catch {}
    setTimeout(() => {
      // nový beh
      abortedRef.current = false;
      chunksRef.current = splitToChunks(text);
      idxRef.current = 0;
      if (!chunksRef.current.length) return;
      setPlaying(true);
      setPaused(false);
      setProgress({ i: 0, total: chunksRef.current.length });
      startKeepAlive();
      speakChunkAt(0);
    }, 80);
  };

  const pause = () => {
    if (!playing) return;
    try { window.speechSynthesis.pause(); } catch {}
    setPaused(true);
  };
  const resume = () => {
    if (!paused) return;
    try { window.speechSynthesis.resume(); } catch {}
    setPaused(false);
  };

  if (supported === false) return null;

  return (
    <div className={"inline-flex items-center gap-2 flex-wrap " + (className ?? "")}>
      {!playing ? (
        <button type="button" onClick={play} className="rp-btn-accent" aria-label={label}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          {label}
        </button>
      ) : (
        <>
          {!paused ? (
            <button type="button" onClick={pause} className="rp-btn-ghost" aria-label="Pauza">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
              Pauza
            </button>
          ) : (
            <button type="button" onClick={resume} className="rp-btn-accent" aria-label="Pokračovať">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Pokračovať
            </button>
          )}
          <button type="button" onClick={stopAll} className="rp-btn-ghost" aria-label="Stop">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>
            Stop
          </button>
          {progress.total > 0 && (
            <span className="text-xs text-[var(--rp-muted)] tabular-nums">
              {progress.i} / {progress.total}
            </span>
          )}
        </>
      )}
      {voiceMissing && (
        <span className="text-xs text-euba-orange" title="Slovenský hlas nebol nájdený – použijem dostupný.">
          (chýba sk-SK hlas)
        </span>
      )}
    </div>
  );
}
