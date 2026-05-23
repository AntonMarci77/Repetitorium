"use client";
import { useEffect, useRef, useState } from "react";
import { getProfile } from "@/lib/storage";

export function TtsButton({ text, label = "Počúvať", className }: { text: string; label?: string; className?: string }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [voiceMissing, setVoiceMissing] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

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
  }, []);

  const stopAll = () => {
    if (typeof window === "undefined") return;
    try { window.speechSynthesis.cancel(); } catch {}
    setPlaying(false);
  };

  const play = () => {
    if (!supported) return;
    stopAll();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const sk = voices.find((v) => v.lang?.toLowerCase().startsWith("sk"));
    const cs = voices.find((v) => v.lang?.toLowerCase().startsWith("cs"));
    u.voice = sk || cs || voices[0] || null;
    u.lang = u.voice?.lang || "sk-SK";
    u.rate = getProfile()?.settings.ttsRate ?? 1;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    utterRef.current = u;
    window.speechSynthesis.speak(u);
    setPlaying(true);
  };

  if (supported === false) return null;

  return (
    <div className={"inline-flex items-center gap-2 " + (className ?? "")}>
      {!playing ? (
        <button type="button" onClick={play} className="rp-btn-accent" aria-label={label}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          {label}
        </button>
      ) : (
        <>
          <button type="button" onClick={() => { window.speechSynthesis.pause(); setPlaying(false); }} className="rp-btn-ghost">
            Pauza
          </button>
          <button type="button" onClick={stopAll} className="rp-btn-ghost">Stop</button>
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
