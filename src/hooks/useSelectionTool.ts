"use client";

import { useRef, useCallback } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { hitTestLayers } from "@/lib/vector/hitTest";
import { getWorldBounds, mergeBounds, boundsIntersect } from "@/lib/vector/bounds";
import type { Point2D, BoundingBox, VectorObject } from "@/types/vector";

const DRAG_THRESHOLD = 3;
const HANDLE_HIT_SIZE = 10;

type HandleId = "tl" | "tc" | "tr" | "mr" | "br" | "bc" | "bl" | "ml";
type Mode = "idle" | "pending" | "moving" | "resizing" | "marquee";

interface DragState {
  mode: Mode;
  startPoint: Point2D;
  hitObjectId: string | null;
  handleId: HandleId | null;
  shiftHeld: boolean;
  /** Original transform positions of selected objects (for move undo) */
  origTransforms: Map<string, { x: number; y: number }>;
  /** Original object-specific dimensions (for resize undo) */
  origProps: Map<string, Record<string, unknown>>;
  /** Combined selection bounding box at drag start */
  origBounds: BoundingBox | null;
}

function freshState(): DragState {
  return {
    mode: "idle",
    startPoint: { x: 0, y: 0 },
    hitObjectId: null,
    handleId: null,
    shiftHeld: false,
    origTransforms: new Map(),
    origProps: new Map(),
    origBounds: null,
  };
}

/**
 * Hook for the Selection tool (V)
 *
 * Returns pointer handlers to be called from VectorCanvas.
 * All handlers accept canvas-space points (not screen space).
 */
export function useSelectionTool() {
  const stateRef = useRef<DragState>(freshState());

  const onPointerDown = useCallback(
    (point: Point2D, shiftKey: boolean, ctx: CanvasRenderingContext2D) => {
      const s = stateRef.current;
      const store = useDocumentStore.getState();
      s.startPoint = point;
      s.shiftHeld = shiftKey;

      // 1. Check if clicking a resize handle of current selection
      if (store.selectedObjectIds.length > 0) {
        const handle = hitTestHandles(point, store);
        if (handle) {
          s.mode = "resizing";
          s.handleId = handle;
          saveOriginals(s, store);
          return;
        }
      }

      // 2. Hit test against objects
      const hit = hitTestLayers(ctx, point, store.layers);

      if (hit) {
        s.hitObjectId = hit.object.id;
        s.mode = "pending";

        // Immediately select if clicking an unselected object (enables drag-to-move)
        if (!store.selectedObjectIds.includes(hit.object.id) && !shiftKey) {
          store.selectObject(hit.object.id);
        }
        saveOriginals(s, store);
      } else {
        s.hitObjectId = null;
        s.mode = "pending";
      }
    },
    [],
  );

  const onPointerMove = useCallback((point: Point2D) => {
    const s = stateRef.current;
    const store = useDocumentStore.getState();
    const dx = point.x - s.startPoint.x;
    const dy = point.y - s.startPoint.y;

    // Promote pending to drag mode once past threshold
    if (s.mode === "pending" && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      if (s.hitObjectId) {
        s.mode = "moving";
        if (!store.selectedObjectIds.includes(s.hitObjectId)) {
          store.selectObject(s.hitObjectId);
          saveOriginals(s, store);
        }
      } else {
        s.mode = "marquee";
        if (!s.shiftHeld) store.deselectAll();
      }
    }

    if (s.mode === "moving") {
      for (const id of store.selectedObjectIds) {
        const orig = s.origTransforms.get(id);
        const obj = store.getObject(id);
        if (orig && obj) {
          store.updateObject(id, {
            transform: { ...obj.transform, x: orig.x + dx, y: orig.y + dy },
          });
        }
      }
    }

    if (s.mode === "resizing") {
      applyResize(s, store, point);
    }
  }, []);

  const onPointerUp = useCallback(
    (point: Point2D) => {
      const s = stateRef.current;
      const store = useDocumentStore.getState();

      switch (s.mode) {
        case "pending": {
          // Click — select or deselect
          if (s.hitObjectId) {
            store.selectObject(s.hitObjectId, s.shiftHeld);
          } else {
            store.deselectAll();
          }
          break;
        }
        case "moving": {
          commitMoveHistory(s, store);
          break;
        }
        case "resizing": {
          commitResizeHistory(s, store);
          break;
        }
        case "marquee": {
          selectInMarquee(s, point, store);
          break;
        }
      }

      // Reset
      Object.assign(stateRef.current, freshState());
    },
    [],
  );

  /** Get the current marquee rectangle (for overlay rendering) */
  const getMarqueeRect = useCallback(
    (currentPoint: Point2D): BoundingBox | null => {
      const s = stateRef.current;
      if (s.mode !== "marquee") return null;
      return rectFromPoints(s.startPoint, currentPoint);
    },
    [],
  );

  return { onPointerDown, onPointerMove, onPointerUp, getMarqueeRect };
}

// ============================================
// Helpers
// ============================================

function saveOriginals(s: DragState, store: ReturnType<typeof useDocumentStore.getState>) {
  s.origTransforms.clear();
  s.origProps.clear();

  const selected = store.getSelectedObjects();
  for (const obj of selected) {
    s.origTransforms.set(obj.id, { x: obj.transform.x, y: obj.transform.y });
    s.origProps.set(obj.id, extractResizeProps(obj));
  }

  if (selected.length > 0) {
    s.origBounds = mergeBounds(selected.map(getWorldBounds));
  }
}

function extractResizeProps(obj: VectorObject): Record<string, unknown> {
  const base = { transform: { ...obj.transform } };
  switch (obj.type) {
    case "rectangle":
      return { ...base, width: obj.width, height: obj.height };
    case "ellipse":
      return { ...base, radiusX: obj.radiusX, radiusY: obj.radiusY };
    case "line":
      return { ...base, endX: obj.endX, endY: obj.endY };
    case "polygon":
      return { ...base, radius: obj.radius };
    default:
      return base;
  }
}

/** Hit-test the 8 selection handles */
function hitTestHandles(
  point: Point2D,
  store: ReturnType<typeof useDocumentStore.getState>,
): HandleId | null {
  const selected = store.getSelectedObjects();
  if (selected.length === 0) return null;

  const bounds = mergeBounds(selected.map(getWorldBounds));
  const handles = handlePositions(bounds);

  for (const [id, pos] of handles) {
    if (
      Math.abs(point.x - pos.x) <= HANDLE_HIT_SIZE / 2 &&
      Math.abs(point.y - pos.y) <= HANDLE_HIT_SIZE / 2
    ) {
      return id;
    }
  }
  return null;
}

function handlePositions(b: BoundingBox): [HandleId, Point2D][] {
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  return [
    ["tl", { x: b.x, y: b.y }],
    ["tc", { x: cx, y: b.y }],
    ["tr", { x: b.x + b.width, y: b.y }],
    ["mr", { x: b.x + b.width, y: cy }],
    ["br", { x: b.x + b.width, y: b.y + b.height }],
    ["bc", { x: cx, y: b.y + b.height }],
    ["bl", { x: b.x, y: b.y + b.height }],
    ["ml", { x: b.x, y: cy }],
  ];
}

/** Apply resize based on handle drag */
function applyResize(
  s: DragState,
  store: ReturnType<typeof useDocumentStore.getState>,
  point: Point2D,
) {
  if (!s.origBounds || !s.handleId) return;

  const ob = s.origBounds;
  let newBounds: BoundingBox;

  // Calculate new bounds based on which handle is being dragged
  switch (s.handleId) {
    case "br":
      newBounds = { x: ob.x, y: ob.y, width: point.x - ob.x, height: point.y - ob.y };
      break;
    case "bl":
      newBounds = { x: point.x, y: ob.y, width: ob.x + ob.width - point.x, height: point.y - ob.y };
      break;
    case "tr":
      newBounds = { x: ob.x, y: point.y, width: point.x - ob.x, height: ob.y + ob.height - point.y };
      break;
    case "tl":
      newBounds = { x: point.x, y: point.y, width: ob.x + ob.width - point.x, height: ob.y + ob.height - point.y };
      break;
    case "mr":
      newBounds = { x: ob.x, y: ob.y, width: point.x - ob.x, height: ob.height };
      break;
    case "ml":
      newBounds = { x: point.x, y: ob.y, width: ob.x + ob.width - point.x, height: ob.height };
      break;
    case "bc":
      newBounds = { x: ob.x, y: ob.y, width: ob.width, height: point.y - ob.y };
      break;
    case "tc":
      newBounds = { x: ob.x, y: point.y, width: ob.width, height: ob.y + ob.height - point.y };
      break;
    default:
      return;
  }

  // Enforce minimum size
  if (newBounds.width < 2) newBounds.width = 2;
  if (newBounds.height < 2) newBounds.height = 2;

  // Compute scale factors
  const sx = ob.width > 0 ? newBounds.width / ob.width : 1;
  const sy = ob.height > 0 ? newBounds.height / ob.height : 1;

  // Apply to each selected object
  for (const id of store.selectedObjectIds) {
    const origP = s.origProps.get(id);
    const origT = s.origTransforms.get(id);
    if (!origP || !origT) continue;

    const obj = store.getObject(id);
    if (!obj) continue;

    // Scale position relative to original bounds origin
    const newX = newBounds.x + (origT.x - ob.x) * sx;
    const newY = newBounds.y + (origT.y - ob.y) * sy;

    const updates: Record<string, unknown> = {
      transform: { ...obj.transform, x: newX, y: newY },
    };

    // Scale dimensions
    switch (obj.type) {
      case "rectangle":
        updates.width = (origP.width as number) * sx;
        updates.height = (origP.height as number) * sy;
        break;
      case "ellipse":
        updates.radiusX = (origP.radiusX as number) * sx;
        updates.radiusY = (origP.radiusY as number) * sy;
        break;
      case "line":
        updates.endX = (origP.endX as number) * sx;
        updates.endY = (origP.endY as number) * sy;
        break;
      case "polygon":
        updates.radius = (origP.radius as number) * Math.max(sx, sy);
        break;
    }

    store.updateObject(id, updates);
  }
}

function commitMoveHistory(
  s: DragState,
  store: ReturnType<typeof useDocumentStore.getState>,
) {
  const ops = [];
  for (const id of store.selectedObjectIds) {
    const orig = s.origTransforms.get(id);
    const obj = store.getObject(id);
    if (!orig || !obj) continue;
    const layerId = store.getObjectLayerId(id);
    if (!layerId) continue;

    ops.push({
      type: "modify-object" as const,
      objectId: id,
      layerId,
      before: { transform: { ...obj.transform, x: orig.x, y: orig.y } },
      after: { transform: { ...obj.transform } },
    });
  }
  if (ops.length > 0) store.pushHistory("Move objects", ops);
}

function commitResizeHistory(
  s: DragState,
  store: ReturnType<typeof useDocumentStore.getState>,
) {
  const ops = [];
  for (const id of store.selectedObjectIds) {
    const origP = s.origProps.get(id);
    const obj = store.getObject(id);
    if (!origP || !obj) continue;
    const layerId = store.getObjectLayerId(id);
    if (!layerId) continue;

    ops.push({
      type: "modify-object" as const,
      objectId: id,
      layerId,
      before: origP,
      after: extractResizeProps(obj),
    });
  }
  if (ops.length > 0) store.pushHistory("Resize objects", ops);
}

function selectInMarquee(
  s: DragState,
  endPoint: Point2D,
  store: ReturnType<typeof useDocumentStore.getState>,
) {
  const marquee = rectFromPoints(s.startPoint, endPoint);
  const ids: string[] = [];

  for (const layer of store.layers) {
    if (!layer.visible || layer.locked) continue;
    for (const obj of layer.objects) {
      if (!obj.visible || obj.locked) continue;
      const objBounds = getWorldBounds(obj);
      if (boundsIntersect(marquee, objBounds)) {
        ids.push(obj.id);
      }
    }
  }

  if (s.shiftHeld) {
    // Add to existing selection
    const existing = new Set(store.selectedObjectIds);
    for (const id of ids) existing.add(id);
    store.setSelection(Array.from(existing));
  } else {
    store.setSelection(ids);
  }
}

function rectFromPoints(a: Point2D, b: Point2D): BoundingBox {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}
