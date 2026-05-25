"use client";
import type { Profile, ProgressMap, Program, Rating, ProgressEntry } from "./types";

const K = {
  profile: "rp.profile",
  progress: "rp.progress",
  dailyReviews: "rp.dailyReviews",
} as const;

const isBrowser = () => typeof window !== "undefined";

function safeGet<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function safeSet(key: string, val: unknown) {
  if (!isBrowser()) return;
  try { window.localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Profile ────────────────────────────────────────────────────────────────
export function getProfile(): Profile | null { return safeGet<Profile>(K.profile); }
export function setProfile(p: Profile) {
  safeSet(K.profile, p);
  if (isBrowser()) window.dispatchEvent(new CustomEvent("rp:profile"));
}
export function patchProfile(patch: Partial<Profile>) {
  const cur = getProfile();
  if (!cur) return;
  const next: Profile = { ...cur, ...patch, settings: { ...cur.settings, ...(patch.settings || {}) } };
  setProfile(next);
}

export function defaultProfile(program: Program, exam_date: string): Profile {
  return {
    program,
    exam_date,
    settings: { dark: false, fontScale: 1, ttsRate: 1 },
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

// ── Progress ───────────────────────────────────────────────────────────────
export function getProgress(): ProgressMap { return safeGet<ProgressMap>(K.progress) ?? {}; }
export function setProgress(p: ProgressMap) {
  safeSet(K.progress, p);
  if (isBrowser()) window.dispatchEvent(new CustomEvent("rp:progress"));
}

export function entry(id: string): ProgressEntry {
  const all = getProgress();
  return all[id] ?? { status: "nove", box: 1, times_seen: 0, first_pass_done: false };
}

export function updateEntry(id: string, mutate: (e: ProgressEntry) => ProgressEntry) {
  const all = getProgress();
  const next = mutate(all[id] ?? { status: "nove", box: 1, times_seen: 0, first_pass_done: false });
  all[id] = next;
  setProgress(all);
}

// ── Daily reviews counter (lokálny dátum) ─────────────────────────────────
type DailyReviews = { date: string; count: number };

function todayISO(): string {
  // Lokálny dátum (nie UTC) — reset o lokálnej polnoci
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getDailyReviews(): DailyReviews {
  const raw = safeGet<DailyReviews>(K.dailyReviews);
  const today = todayISO();
  if (!raw || raw.date !== today) return { date: today, count: 0 };
  return raw;
}

export function incrementDailyReviews() {
  const cur = getDailyReviews();
  const next: DailyReviews = { date: cur.date, count: cur.count + 1 };
  safeSet(K.dailyReviews, next);
  if (isBrowser()) window.dispatchEvent(new CustomEvent("rp:progress"));
}

// ── Leitner (8.2) ──────────────────────────────────────────────────────────
const LEITNER_INTERVAL_DAYS: Record<1|2|3|4|5, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };

export function applyRating(id: string, rating: Rating, examISO?: string) {
  incrementDailyReviews();
  updateEntry(id, (e) => {
    const next: ProgressEntry = { ...e };
    if (rating === "nevedel") next.box = 1;
    else if (rating === "vedel") next.box = Math.min(5, (next.box + 1)) as ProgressEntry["box"];
    // ciastocne: box ostáva
    next.self_rating = rating;
    next.last_reviewed = new Date().toISOString().slice(0, 10);
    next.times_seen = (next.times_seen || 0) + 1;
    next.first_pass_done = true;
    // ďalší termín, zastropovať na exam_date
    const days = LEITNER_INTERVAL_DAYS[next.box];
    const due = new Date();
    due.setDate(due.getDate() + days);
    if (examISO) {
      const exam = new Date(examISO + "T00:00:00");
      if (due > exam) due.setTime(exam.getTime());
    }
    next.next_due = due.toISOString().slice(0, 10);
    next.status = next.box >= 4 && next.first_pass_done ? "zvladnute" : "rozpracovane";
    return next;
  });
}

export function markFirstPassDone(id: string) {
  updateEntry(id, (e) => ({
    ...e,
    first_pass_done: true,
    status: e.status === "zvladnute" ? "zvladnute" : (e.status === "nove" ? "rozpracovane" : e.status),
    times_seen: (e.times_seen || 0) + (e.first_pass_done ? 0 : 1),
  }));
}

export function noteSeenVersion(id: string, verzia: string) {
  updateEntry(id, (e) => ({ ...e, last_seen_version: verzia }));
}

// ── Pacing (8.1) ────────────────────────────────────────────────────────────
export function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + "T00:00:00");
  const b = new Date(toISO + "T00:00:00");
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000);
}

export function daysUntil(targetISO: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return Math.max(0, daysBetween(today, targetISO));
}

export type PacingResult = {
  totalIds: number;
  newRemaining: number;
  firstPassDays: number;
  novychZaDen: number;
  D: number;
};

export function computePacing(allIds: string[], progress: ProgressMap, examISO: string): PacingResult {
  const D = Math.max(1, daysUntil(examISO));
  const newRemaining = allIds.filter((id) => !(progress[id]?.first_pass_done)).length;
  const firstPassDays = Math.max(1, Math.ceil(D * 0.8));
  const novychZaDen = Math.max(0, Math.ceil(newRemaining / firstPassDays));
  return { totalIds: allIds.length, newRemaining, firstPassDays, novychZaDen, D };
}

export function dueToday(allIds: string[], progress: ProgressMap): string[] {
  const today = new Date().toISOString().slice(0, 10);
  return allIds.filter((id) => {
    const e = progress[id];
    return !!(e && e.next_due && e.next_due <= today && e.status !== "zvladnute");
  });
}

// ── Export / Import zálohy ─────────────────────────────────────────────────
export type Backup = { kind: "repetitorium.backup"; verzia: 1; profil: Profile | null; progress: ProgressMap; exportedAt: string };

export function exportBackup(): Backup {
  return {
    kind: "repetitorium.backup",
    verzia: 1,
    profil: getProfile(),
    progress: getProgress(),
    exportedAt: new Date().toISOString(),
  };
}

export function importBackup(data: unknown): { ok: true } | { ok: false; error: string } {
  if (!data || typeof data !== "object") return { ok: false, error: "Súbor nie je JSON." };
  const b = data as Partial<Backup>;
  if (b.kind !== "repetitorium.backup") return { ok: false, error: "Toto nie je záloha Repetitória." };
  if (b.profil) setProfile(b.profil);
  if (b.progress) setProgress(b.progress);
  return { ok: true };
}

export function resetAll() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(K.profile);
    window.localStorage.removeItem(K.progress);
    window.dispatchEvent(new CustomEvent("rp:profile"));
    window.dispatchEvent(new CustomEvent("rp:progress"));
  } catch {}
}
