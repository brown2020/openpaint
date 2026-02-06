"use client";

import { useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useCanvasStore } from "@/store/canvasStore";
import { useDocumentStore } from "@/store/documentStore";
import {
  createTransform,
  createStroke,
  type Point2D,
  type PathSegment,
  type PathObject,
} from "@/types/vector";

const MIN_DISTANCE = 2; // minimum px between sampled points

interface FreehandState {
  active: boolean;
  points: Point2D[];
}

/**
 * Hook for freehand drawing (brush tool).
 *
 * Collects pointer positions during a drag, then converts them to a
 * smoothed cubic-bezier PathObject on release.
 */
export function useFreehandTool() {
  const stateRef = useRef<FreehandState>({ active: false, points: [] });

  const onPointerDown = useCallback((point: Point2D) => {
    stateRef.current = { active: true, points: [point] };
  }, []);

  const onPointerMove = useCallback((point: Point2D) => {
    const s = stateRef.current;
    if (!s.active) return;

    const last = s.points[s.points.length - 1];
    if (Math.hypot(point.x - last.x, point.y - last.y) >= MIN_DISTANCE) {
      s.points.push(point);
    }
  }, []);

  const onPointerUp = useCallback(() => {
    const s = stateRef.current;
    if (!s.active) return;
    s.active = false;

    const pts = s.points;
    if (pts.length < 2) return;

    // Compute bounding box origin so path coordinates are relative
    const origin = pts[0];
    const relative = pts.map((p) => ({ x: p.x - origin.x, y: p.y - origin.y }));

    const segments = pointsToSmoothSegments(relative);
    const pathObj = createFreehandPath(origin, segments);

    const store = useDocumentStore.getState();
    const layerId = store.activeLayerId;
    const index = store.getActiveLayer()?.objects.length ?? 0;

    store.addObject(layerId, pathObj);
    store.setSelection([pathObj.id]);
    store.pushHistory("Draw freehand", [
      { type: "add-object", layerId, object: pathObj, index },
    ]);
  }, []);

  /**
   * Render the in-progress freehand stroke on the overlay canvas.
   */
  const renderPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;
    if (!s.active || s.points.length < 2) return;

    const { strokeColor, strokeWidth } = useCanvasStore.getState();

    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }, []);

  const isActive = useCallback(() => stateRef.current.active, []);

  return { onPointerDown, onPointerMove, onPointerUp, renderPreview, isActive };
}

// ============================================
// Path smoothing — Catmull-Rom → Cubic Bezier
// ============================================

function pointsToSmoothSegments(pts: Point2D[]): PathSegment[] {
  const segments: PathSegment[] = [{ type: "M", x: pts[0].x, y: pts[0].y }];

  if (pts.length === 2) {
    segments.push({ type: "L", x: pts[1].x, y: pts[1].y });
    return segments;
  }

  // Convert point sequence to smooth cubic bezier curves
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 2)];
    const p1 = pts[i - 1];
    const p2 = pts[i];
    const p3 = pts[Math.min(pts.length - 1, i + 1)];

    // Catmull-Rom to cubic bezier control points (tension = 1/6)
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    segments.push({
      type: "C",
      cp1x,
      cp1y,
      cp2x,
      cp2y,
      x: p2.x,
      y: p2.y,
    });
  }

  return segments;
}

function createFreehandPath(
  origin: Point2D,
  segments: PathSegment[],
): PathObject {
  const { strokeColor, strokeWidth, fillEnabled, fillColor } =
    useCanvasStore.getState();

  return {
    id: uuidv4(),
    type: "path",
    name: "Freehand Path",
    transform: createTransform(origin.x, origin.y),
    fill: fillEnabled ? { type: "solid", color: fillColor, opacity: 1 } : null,
    stroke: createStroke(strokeColor, strokeWidth, 1),
    opacity: 1,
    visible: true,
    locked: false,
    segments,
    closed: false,
  };
}
