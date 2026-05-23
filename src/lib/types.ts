export type Program = "BC" | "ING" | "OBE";

export type Settings = {
  dark: boolean;
  fontScale: number;   // 0.9..1.4
  ttsRate: number;     // 0.8..1.4
};

export type Profile = {
  program: Program;
  exam_date: string;   // YYYY-MM-DD
  settings: Settings;
  createdAt: string;
};

export type Rating = "nevedel" | "ciastocne" | "vedel";
export type Status = "nove" | "rozpracovane" | "zvladnute";

export type ProgressEntry = {
  status: Status;
  box: 1 | 2 | 3 | 4 | 5;
  self_rating?: Rating;
  last_reviewed?: string;   // ISO date
  next_due?: string;        // ISO date
  times_seen: number;
  first_pass_done: boolean;
  last_seen_version?: string; // pre značku „aktualizované"
};

export type ProgressMap = Record<string, ProgressEntry>;

// === Schéma téz (Podklad kap. 5) ============================================
export type TezaVizual = { subor: string; typ: string; popis: string };
export type TezaCastJadra = { nadpis?: string; text?: string; zaver?: string };
export type TezaJadro = { cielova_dlzka_slov?: number; uvod: string; casti: TezaCastJadra[] };
export type TezaPrikladUctovanie = { rok?: string | number; md: string; d: string; suma: number | string; popis?: string };
export type TezaPriklad = {
  nazov: string;
  zadanie: string;
  uctovanie?: TezaPrikladUctovanie[];
  riesenie: string;
  dopad_na_zd?: string;
};
export type TezaOtazkaOdpoved = {
  otazka: string;
  odpoved: string;
  // Polia pridané pre Korda-style MC rendering doplňujúcich otázok
  // (per SCHEMA_doplnujuce_MC.md). Backward compat: ak chýbajú, rendruje sa po starom.
  moznosti?: string[];
  spravna_index?: number;
  spravne_indexy?: number[];
  vysvetlenie?: string;
};
export type TezaMC = { otazka: string; moznosti: string[]; spravna_index: number; vysvetlenie?: string };
export type TezaOpen = { otazka: string; vzorova_odpoved: string };
export type TezaPriklady = { zadanie: string; riesenie: string };
export type TezaZdroj = { nazov: string; kde?: string; typ?: string };

export type Teza = {
  id: string;                       // napr. "BC-I-1"
  program: string;                  // text z JSON, mapuje sa cez programGroup()
  okruh: string;                    // "I" | "II"
  cislo: number;
  nazov: string;
  cas_na_odpoved_min?: number;
  verzia: string;
  stav_legislativy?: string;
  klucove_pojmy: string[];
  princip_mentalny_model: string;
  jadro_odpovede_10min: TezaJadro;
  rozsirena_baza?: { nadpis: string; text: string }[];
  priklady?: TezaPriklad[];
  vizualy?: TezaVizual[];
  caste_doplnujuce_otazky?: TezaOtazkaOdpoved[];
  pasce_caste_chyby?: string[];
  test?: {
    vyber_z_moznosti?: TezaMC[];
    otvorene?: TezaOpen[];
    priklad?: TezaPriklady[];
  };
  zdroje?: TezaZdroj[];
};

// === Mapy ===================================================================
export type MapNode = { nazov: string; deti?: MapNode[] };
export type MentalnaMapa = {
  id: string;
  subor?: string;
  program: string;
  okruh: string;
  cislo: number;
  nazov: string;
  koren: MapNode;
  vetvy?: string[];
};

// === Skratky ================================================================
export type Skratka = { skratka: string; vyznam: string; kategoria?: string; poznamka?: string };
export type SkratkySubor = { verzia: string; aktualizovane?: string; poznamka?: string; skratky: Skratka[] };

// === Index téz (zoznam) =====================================================
export type TezaIndexItem = {
  id: string;
  file: string;   // napr. "BC_I_01.json"
  program: "BC" | "ING";
  okruh: "I" | "II";
  cislo: number;
  nazov: string;
  verzia: string;
};
