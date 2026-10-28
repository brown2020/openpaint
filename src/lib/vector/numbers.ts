/** Clamp a finite number into optional inclusive bounds. */
export function clampNumber(
  value: number,
  min?: number,
  max?: number,
): number {
  if (!Number.isFinite(value)) {
    return min ?? 0;
  }
  let next = value;
  if (min != null) next = Math.max(min, next);
  if (max != null) next = Math.min(max, next);
  return next;
}

/** Canvas ellipse radii must be finite and non-negative or `ellipse()` throws. */
export function nonNegativeRadius(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}
