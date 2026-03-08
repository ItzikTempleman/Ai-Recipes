import { RecipeCategory } from "../models/recipe-model";

export function sanitizeQueryRestrictions(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (!normalized) continue;
    if (normalized.startsWith("__CONTENT_HASH__:")) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(normalized);
  }

  return out;
}

export function normalizeCategories(values: unknown): RecipeCategory[] {
  if (!Array.isArray(values)) return [];

  const allowed = new Set(Object.values(RecipeCategory));
  const seen = new Set<string>();
  const out: RecipeCategory[] = [];

  for (const value of values) {
    const normalized = String(value ?? "").trim() as RecipeCategory;
    if (!allowed.has(normalized)) continue;
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    out.push(normalized);
  }

  return out;
}

export function normalizeTitle(title: unknown): string {
  return String(title ?? "")
    .trim()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[’'"״׳“”\-–—.,:;!()?[\]{}]/g, "")
    .toLowerCase();
}

export function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  const normalize = (v: any): any => {
    if (v === null || v === undefined) return null;
    if (typeof v !== "object") return v;
    if (seen.has(v)) return null;
    seen.add(v);

    if (Array.isArray(v)) return v.map(normalize);

    const out: Record<string, any> = {};
    for (const k of Object.keys(v).sort()) out[k] = normalize(v[k]);
    return out;
  };

  return JSON.stringify(normalize(value));
}