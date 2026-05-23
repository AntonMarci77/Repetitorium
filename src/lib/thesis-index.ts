import type { Program, TezaIndexItem } from "./types";

// Statický index téz — odráža súbory v /public/content (36 ks).
// Drží sa pravidla: BC_I_01..09, BC_II_01..09, ING_I_01..11, ING_II_01..07.
function build(): TezaIndexItem[] {
  const out: TezaIndexItem[] = [];
  const push = (program: "BC"|"ING", okruh: "I"|"II", count: number) => {
    for (let i = 1; i <= count; i++) {
      const cislo = i;
      const id = `${program}-${okruh}-${cislo}`;
      const file = `${program}_${okruh}_${String(cislo).padStart(2, "0")}.json`;
      out.push({ id, file, program, okruh, cislo, nazov: "", verzia: "" });
    }
  };
  push("BC", "I", 9);
  push("BC", "II", 9);
  push("ING", "I", 11);
  push("ING", "II", 7);
  return out;
}

export const THESIS_INDEX: TezaIndexItem[] = build();

export function indexForProgram(p: Program): TezaIndexItem[] {
  if (p === "BC") return THESIS_INDEX.filter((t) => t.program === "BC");
  if (p === "ING") return THESIS_INDEX.filter((t) => t.program === "ING");
  return THESIS_INDEX; // OBE = člen komisie → všetko
}

export function idsForProgram(p: Program): string[] {
  return indexForProgram(p).map((t) => t.id);
}

export function programLabel(p: Program): string {
  return p === "BC" ? "Bakalárske" : p === "ING" ? "Inžinierske" : "Člen komisie (BC + ING)";
}

export function programShort(p: Program): string {
  return p === "BC" ? "BC" : p === "ING" ? "ING" : "Obe";
}
