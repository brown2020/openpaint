import type { Size } from "@/types";

/** Whole-pixel size accepted by Firestore rules (`canvasSize` ints). */
export function normalizeCanvasSize(size: Size): Size {
  return {
    width: Math.round(size.width),
    height: Math.round(size.height),
  };
}
