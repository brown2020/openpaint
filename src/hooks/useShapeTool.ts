"use client";

import { useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useCanvasStore } from "@/store/canvasStore";
import { useDocumentStore } from "@/store/documentStore";
import {
  createTransform,
  createSolidFill,
  createStroke,
  type Point2D,
  type BoundingBox,
  type VectorObject,
  type RectangleObject,
  type EllipseObject,
  type LineObject,
  type PolygonObject,
  type Fill,
  type StrokeStyle,
} from "@/types/vector";
import type { ToolType } from "@/types";

interface ShapeDragState {
  active: boolean;
  startPoint: Point2D;
  currentPoint: Point2D;
  tool: ToolType;
  shiftHeld: boolean;
  altHeld: boolean;
}

/**
 * Hook for shape creation tools (Rectangle, Ellipse, Line, Polygon)
 *
 * Returns pointer handlers + a preview render function.
 */
export function useShapeTool() {
  const stateRef = useRef<ShapeDragState>({
    active: false,
    startPoint: { x: 0, y: 0 },
    currentPoint: { x: 0, y: 0 },
    tool: "rectangle",
    shiftHeld: false,
    altHeld: false,
  });

  const onPointerDown = useCallback((point: Point2D, tool: ToolType) => {
    stateRef.current = {
      active: true,
      startPoint: point,
      currentPoint: point,
      tool,
      shiftHeld: false,
      altHeld: false,
    };
  }, []);

  const onPointerMove = useCallback(
    (point: Point2D, shiftKey: boolean, altKey: boolean) => {
      const s = stateRef.current;
      if (!s.active) return;
      s.currentPoint = point;
      s.shiftHeld = shiftKey;
      s.altHeld = altKey;
    },
    [],
  );

  const onPointerUp = useCallback((point: Point2D) => {
    const s = stateRef.current;
    if (!s.active) return;

    s.currentPoint = point;

    // Don't create tiny accidental shapes
    const dist = Math.hypot(point.x - s.startPoint.x, point.y - s.startPoint.y);
    if (dist < 3) {
      s.active = false;
      return;
    }

    const obj = createShapeObject(s);
    if (obj) {
      const store = useDocumentStore.getState();
      const layerId = store.activeLayerId;
      const index = store.getActiveLayer()?.objects.length ?? 0;

      store.addObject(layerId, obj);
      store.setSelection([obj.id]);
      store.pushHistory(`Create ${obj.type}`, [
        { type: "add-object", layerId, object: obj, index },
      ]);
    }

    s.active = false;
  }, []);

  /**
   * Render the shape preview on the overlay canvas
   */
  const renderPreview = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const s = stateRef.current;
      if (!s.active) return;

      const { fillColor, fillEnabled, strokeColor, strokeWidth, strokeEnabled } =
        useCanvasStore.getState();

      ctx.save();

      // Preview styling
      if (fillEnabled) {
        ctx.fillStyle = fillColor + "88"; // semi-transparent
      }
      if (strokeEnabled) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.setLineDash([4, 4]);
      }

      const bounds = computeBounds(s);

      switch (s.tool) {
        case "rectangle": {
          ctx.beginPath();
          ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
          if (fillEnabled) ctx.fill();
          if (strokeEnabled) ctx.stroke();
          break;
        }
        case "ellipse": {
          const cx = bounds.x + bounds.width / 2;
          const cy = bounds.y + bounds.height / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, bounds.width / 2, bounds.height / 2, 0, 0, Math.PI * 2);
          if (fillEnabled) ctx.fill();
          if (strokeEnabled) ctx.stroke();
          break;
        }
        case "line": {
          ctx.beginPath();
          let end = s.currentPoint;
          if (s.shiftHeld) end = constrainAngle(s.startPoint, s.currentPoint);
          ctx.moveTo(s.startPoint.x, s.startPoint.y);
          ctx.lineTo(end.x, end.y);
          if (strokeEnabled) ctx.stroke();
          break;
        }
        case "polygon": {
          const radius = Math.hypot(
            s.currentPoint.x - s.startPoint.x,
            s.currentPoint.y - s.startPoint.y,
          );
          const sides = 6; // default hexagon
          ctx.beginPath();
          buildPolygonPreview(ctx, s.startPoint, sides, radius);
          if (fillEnabled) ctx.fill();
          if (strokeEnabled) ctx.stroke();
          break;
        }
      }

      ctx.restore();
    },
    [],
  );

  /** Whether a shape drag is currently active */
  const isActive = useCallback(() => stateRef.current.active, []);

  return { onPointerDown, onPointerMove, onPointerUp, renderPreview, isActive };
}

// ============================================
// Shape creation
// ============================================

function createShapeObject(s: ShapeDragState): VectorObject | null {
  const { fillColor, fillEnabled, strokeColor, strokeWidth, strokeEnabled } =
    useCanvasStore.getState();

  const fill: Fill | null = fillEnabled
    ? createSolidFill(fillColor, 1)
    : null;
  const stroke: StrokeStyle | null = strokeEnabled
    ? createStroke(strokeColor, strokeWidth, 1)
    : null;

  switch (s.tool) {
    case "rectangle":
      return createRectangle(s, fill, stroke);
    case "ellipse":
      return createEllipseObj(s, fill, stroke);
    case "line":
      return createLineObj(s, fill, stroke);
    case "polygon":
      return createPolygonObj(s, fill, stroke);
    default:
      return null;
  }
}

function createRectangle(
  s: ShapeDragState,
  fill: Fill | null,
  stroke: StrokeStyle | null,
): RectangleObject {
  const bounds = computeBounds(s);
  return {
    id: uuidv4(),
    type: "rectangle",
    name: "Rectangle",
    transform: createTransform(bounds.x, bounds.y),
    fill,
    stroke,
    opacity: 1,
    visible: true,
    locked: false,
    width: bounds.width,
    height: bounds.height,
    cornerRadius: [0, 0, 0, 0],
  };
}

function createEllipseObj(
  s: ShapeDragState,
  fill: Fill | null,
  stroke: StrokeStyle | null,
): EllipseObject {
  const bounds = computeBounds(s);
  return {
    id: uuidv4(),
    type: "ellipse",
    name: "Ellipse",
    transform: createTransform(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    ),
    fill,
    stroke,
    opacity: 1,
    visible: true,
    locked: false,
    radiusX: bounds.width / 2,
    radiusY: bounds.height / 2,
  };
}

function createLineObj(
  s: ShapeDragState,
  _fill: Fill | null,
  stroke: StrokeStyle | null,
): LineObject {
  let end = s.currentPoint;
  if (s.shiftHeld) end = constrainAngle(s.startPoint, end);

  return {
    id: uuidv4(),
    type: "line",
    name: "Line",
    transform: createTransform(s.startPoint.x, s.startPoint.y),
    fill: null, // lines don't have fill
    stroke: stroke ?? createStroke("#000000", 2, 1),
    opacity: 1,
    visible: true,
    locked: false,
    endX: end.x - s.startPoint.x,
    endY: end.y - s.startPoint.y,
  };
}

function createPolygonObj(
  s: ShapeDragState,
  fill: Fill | null,
  stroke: StrokeStyle | null,
): PolygonObject {
  const radius = Math.hypot(
    s.currentPoint.x - s.startPoint.x,
    s.currentPoint.y - s.startPoint.y,
  );

  return {
    id: uuidv4(),
    type: "polygon",
    name: "Polygon",
    transform: createTransform(s.startPoint.x, s.startPoint.y),
    fill,
    stroke,
    opacity: 1,
    visible: true,
    locked: false,
    sides: 6,
    radius,
  };
}

// ============================================
// Geometry helpers
// ============================================

function computeBounds(s: ShapeDragState): BoundingBox {
  const start = s.startPoint;
  let end = s.currentPoint;

  if (s.shiftHeld && s.tool !== "line" && s.tool !== "polygon") {
    end = constrainToSquare(start, end);
  }

  if (s.altHeld && s.tool !== "line" && s.tool !== "polygon") {
    // Draw from center
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return {
      x: start.x - Math.abs(dx),
      y: start.y - Math.abs(dy),
      width: Math.abs(dx) * 2,
      height: Math.abs(dy) * 2,
    };
  }

  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

function constrainToSquare(start: Point2D, end: Point2D): Point2D {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const size = Math.max(Math.abs(dx), Math.abs(dy));
  return {
    x: start.x + size * Math.sign(dx),
    y: start.y + size * Math.sign(dy),
  };
}

function constrainAngle(start: Point2D, end: Point2D): Point2D {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return end;

  const angle = Math.atan2(dy, dx);
  const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  return {
    x: start.x + len * Math.cos(snapped),
    y: start.y + len * Math.sin(snapped),
  };
}

function buildPolygonPreview(
  ctx: CanvasRenderingContext2D,
  center: Point2D,
  sides: number,
  radius: number,
) {
  const step = (Math.PI * 2) / sides;
  const startAngle = -Math.PI / 2;
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * step;
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
