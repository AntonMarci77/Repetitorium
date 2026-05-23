"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = { src: string; alt: string; onClose: () => void };

const MIN = 0.5;
const MAX = 8;

export function VisualLightbox({ src, alt, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Drag
  const dragRef = useRef<{ x: number; y: number; tx0: number; ty0: number; id: number } | null>(null);
  // Pinch
  const pinchRef = useRef<{
    d0: number; s0: number;
    cx: number; cy: number; tx0: number; ty0: number;
    p1: { id: number; x: number; y: number }; p2: { id: number; x: number; y: number };
  } | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  const reset = useCallback(() => { setScale(1); setTx(0); setTy(0); }, []);

  // ESC zatvára
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") setScale((s) => clamp(s * 1.2));
      else if (e.key === "-" || e.key === "_") setScale((s) => clamp(s / 1.2));
      else if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    // zamknúť scroll na pozadí
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, reset]);

  // Wheel zoom (desktop) – zoom k pozícii myši
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setScale((s) => {
      const next = clamp(s * factor);
      // upraviť translate tak, aby bod pod myšou ostal pod myšou
      setTx((t) => t - (mx - t) * (next / s - 1));
      setTy((t) => t - (my - t) * (next / s - 1));
      return next;
    });
  };

  // Pointer events: drag + pinch
  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) {
      dragRef.current = { x: e.clientX, y: e.clientY, tx0: tx, ty0: ty, id: e.pointerId };
    } else if (pointersRef.current.size === 2) {
      const [p1, p2] = [...pointersRef.current.entries()].map(([id, p]) => ({ id, ...p }));
      const d = dist(p1, p2);
      pinchRef.current = { d0: d, s0: scale, cx: (p1.x + p2.x) / 2, cy: (p1.y + p2.y) / 2, tx0: tx, ty0: ty, p1, p2 };
      dragRef.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = [...pointersRef.current.entries()].map(([id, p]) => ({ id, ...p }));
      const d = dist(pts[0], pts[1]);
      const p = pinchRef.current;
      const next = clamp(p.s0 * (d / p.d0));
      setScale(next);
      // pan tak, aby stred pinch zostal stabilný
      const stage = stageRef.current!;
      const rect = stage.getBoundingClientRect();
      const cx = (pts[0].x + pts[1].x) / 2 - rect.left - rect.width / 2;
      const cy = (pts[0].y + pts[1].y) / 2 - rect.top - rect.height / 2;
      setTx(cx - (cx - p.tx0) * (next / p.s0));
      setTy(cy - (cy - p.ty0) * (next / p.s0));
      return;
    }

    if (dragRef.current && dragRef.current.id === e.pointerId) {
      const d = dragRef.current;
      setTx(d.tx0 + (e.clientX - d.x));
      setTy(d.ty0 + (e.clientY - d.y));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) dragRef.current = null;
  };

  const onDoubleClick = () => {
    if (scale === 1) setScale(2);
    else reset();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <header className="flex items-center justify-between px-3 py-2 text-white">
        <p className="text-sm/snug pr-3 max-w-[70%]">{alt}</p>
        <div className="flex items-center gap-1">
          <Btn label="Oddialiť (−)" onClick={() => setScale((s) => clamp(s / 1.2))}>−</Btn>
          <span className="text-xs tabular-nums min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
          <Btn label="Priblížiť (+)" onClick={() => setScale((s) => clamp(s * 1.2))}>+</Btn>
          <Btn label="Reset (0)" onClick={reset}>1:1</Btn>
          <Btn label="Zatvoriť (Esc)" onClick={onClose} primary>✕</Btn>
        </div>
      </header>

      <div
        ref={stageRef}
        className="flex-1 overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <div className="w-full h-full grid place-items-center">
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            draggable={false}
            className="max-w-[90vw] max-h-[80vh] bg-white rounded-md shadow-2xl"
            style={{
              transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
              transformOrigin: "center center",
              transition: dragRef.current || pinchRef.current ? "none" : "transform 0.12s ease-out",
            }}
          />
        </div>
      </div>

      <footer className="text-white/70 text-[11px] text-center py-2 px-3">
        Koliesko = priblíženie · ťahaním pohyb · dvojklik = priblíž/reset · ESC = zatvoriť
      </footer>
    </div>
  );
}

function Btn({ children, onClick, label, primary }: { children: React.ReactNode; onClick: () => void; label: string; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        "inline-flex items-center justify-center h-9 min-w-9 px-2 rounded-lg text-sm font-medium transition " +
        (primary
          ? "bg-white/10 hover:bg-white/20 text-white"
          : "bg-white/5 hover:bg-white/15 text-white/90")
      }
    >
      {children}
    </button>
  );
}

const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n));
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
