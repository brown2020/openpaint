import type { PathSegment, Point2D } from "@/types/vector";

/** One anchor while drawing with the pen tool */
export interface PenAnchor {
  x: number;
  y: number;
  /** Outgoing bezier handle (world coordinates) */
  outHandle?: Point2D;
  /** Incoming bezier handle (world coordinates) */
  inHandle?: Point2D;
}

export const PEN_CLOSE_RADIUS = 10;
export const PEN_DRAG_THRESHOLD = 4;

export function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Symmetric handle on the opposite side of the anchor */
export function mirroredHandle(anchor: Point2D, handle: Point2D): Point2D {
  return { x: 2 * anchor.x - handle.x, y: 2 * anchor.y - handle.y };
}

export function pathOriginFromAnchors(anchors: PenAnchor[]): Point2D {
  return { x: anchors[0].x, y: anchors[0].y };
}

/**
 * Convert pen anchors to path segments relative to origin (first anchor).
 */
export function penAnchorsToSegments(
  anchors: PenAnchor[],
  origin: Point2D,
  closed: boolean,
): PathSegment[] {
  if (anchors.length === 0) return [];

  const rel = (p: Point2D) => ({
    x: p.x - origin.x,
    y: p.y - origin.y,
  });

  const segments: PathSegment[] = [
    { type: "M", x: rel(anchors[0]).x, y: rel(anchors[0]).y },
  ];

  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];
    const currRel = rel(curr);

    if (prev.outHandle) {
      const cp1 = rel(prev.outHandle);
      const cp2 = curr.inHandle ? rel(curr.inHandle) : currRel;
      segments.push({
        type: "C",
        cp1x: cp1.x,
        cp1y: cp1.y,
        cp2x: cp2.x,
        cp2y: cp2.y,
        x: currRel.x,
        y: currRel.y,
      });
    } else {
      segments.push({ type: "L", x: currRel.x, y: currRel.y });
    }
  }

  if (closed) {
    segments.push({ type: "Z" });
  }

  return segments;
}
