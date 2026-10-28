import { localToWorld } from "@/lib/vector/bounds";
import type { BoundingBox, Point2D, VectorObject } from "@/types/vector";

/** Handle order matches the selection overlay (tl, tc, tr, mr, br, bc, bl, ml). */
export const SELECTION_HANDLE_IDS = [
  "tl",
  "tc",
  "tr",
  "mr",
  "br",
  "bc",
  "bl",
  "ml",
] as const;

export type SelectionHandleId = (typeof SELECTION_HANDLE_IDS)[number];

/**
 * Local bounds used by the selection overlay.
 * Path bounds use anchors only, matching the drawn handles.
 */
export function selectionLocalBounds(obj: VectorObject): BoundingBox {
  switch (obj.type) {
    case "rectangle":
      return { x: 0, y: 0, width: obj.width, height: obj.height };
    case "ellipse":
      return {
        x: -obj.radiusX,
        y: -obj.radiusY,
        width: obj.radiusX * 2,
        height: obj.radiusY * 2,
      };
    case "line":
      return {
        x: Math.min(0, obj.endX),
        y: Math.min(0, obj.endY),
        width: Math.abs(obj.endX),
        height: Math.abs(obj.endY),
      };
    case "polygon":
      return {
        x: -obj.radius,
        y: -obj.radius,
        width: obj.radius * 2,
        height: obj.radius * 2,
      };
    case "path": {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const seg of obj.segments) {
        if ("x" in seg && "y" in seg) {
          minX = Math.min(minX, seg.x);
          minY = Math.min(minY, seg.y);
          maxX = Math.max(maxX, seg.x);
          maxY = Math.max(maxY, seg.y);
        }
      }
      if (!isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 };
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    case "text":
      return {
        x: 0,
        y: 0,
        width: obj.content.length * obj.fontSize * 0.6,
        height: obj.fontSize * obj.lineHeight,
      };
    case "group":
      return { x: 0, y: 0, width: 0, height: 0 };
    case "image":
      return { x: 0, y: 0, width: obj.width, height: obj.height };
  }
}

/** Eight handle points in local object space. */
export function localSelectionHandles(bounds: BoundingBox): Point2D[] {
  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;

  return [
    { x, y },
    { x: cx, y },
    { x: x + width, y },
    { x: x + width, y: cy },
    { x: x + width, y: y + height },
    { x: cx, y: y + height },
    { x, y: y + height },
    { x, y: cy },
  ];
}

export function worldSelectionHandles(
  obj: VectorObject,
): { id: SelectionHandleId; point: Point2D }[] {
  const local = localSelectionHandles(selectionLocalBounds(obj));
  return local.map((point, index) => ({
    id: SELECTION_HANDLE_IDS[index],
    point: localToWorld(point, obj.transform),
  }));
}

/**
 * Hit-test the same transformed handle points the overlay draws.
 * Later objects win so the topmost handle receives the pointer.
 */
export function hitTestSelectionHandle(
  point: Point2D,
  objects: VectorObject[],
  hitSize = 10,
): SelectionHandleId | null {
  const half = hitSize / 2;

  for (let i = objects.length - 1; i >= 0; i--) {
    let closest: { id: SelectionHandleId; distance: number } | null = null;

    for (const handle of worldSelectionHandles(objects[i])) {
      const distance = Math.hypot(
        point.x - handle.point.x,
        point.y - handle.point.y,
      );
      if (distance <= half && (closest == null || distance < closest.distance)) {
        closest = { id: handle.id, distance };
      }
    }

    if (closest) return closest.id;
  }

  return null;
}
