/** Finite number safe to interpolate into an SVG attribute. */
export function svgNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function svgOpacity(value: unknown): number {
  return Math.min(1, Math.max(0, svgNumber(value, 1)));
}

export function svgLineCap(value: unknown): "butt" | "round" | "square" {
  if (value === "butt" || value === "round" || value === "square") return value;
  return "butt";
}

export function svgLineJoin(value: unknown): "miter" | "round" | "bevel" {
  if (value === "miter" || value === "round" || value === "bevel") return value;
  return "miter";
}

export function svgFontWeight(value: unknown): "normal" | "bold" {
  return value === "bold" ? "bold" : "normal";
}

export function svgFontStyle(value: unknown): "normal" | "italic" {
  return value === "italic" ? "italic" : "normal";
}

/** Remote or raster data URLs only. Blocks scriptable SVG/javascript hrefs. */
export function svgImageHref(src: unknown): string {
  if (typeof src !== "string") return "";
  const trimmed = src.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^data:image\/(?:png|jpeg|jpg|gif|webp);/i.test(trimmed)) return trimmed;
  return "";
}
