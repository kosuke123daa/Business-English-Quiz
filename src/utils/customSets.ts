import type { PhraseSet } from "@/types";

const STORAGE_KEY = "beq:customSets";

const COLORS = ["#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777"];

export function loadCustomSets(): PhraseSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PhraseSet[];
  } catch {
    return [];
  }
}

export function saveCustomSets(sets: PhraseSet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

export function makeCustomSetId(name: string, existingIds: string[]): string {
  const base = `custom_${name.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  if (!existingIds.includes(base)) return base;
  let i = 2;
  while (existingIds.includes(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

export function pickColor(index: number): string {
  return COLORS[index % COLORS.length];
}
