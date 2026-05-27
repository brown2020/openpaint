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
  type PathObject,
} from "@/types/vector";
import {
  type PenAnchor,
  PEN_CLOSE_RADIUS,
  PEN_DRAG_THRESHOLD,
  distance,
  mirroredHandle,
  pathOriginFromAnchors,
  penAnchorsToSegments,
} from "@/lib/vector/penPath";

interface PenDrag {
  downPoint: Point2D;
  currentPoint: Point2D;
}

interface PenState {
  anchors: PenAnchor[];
  drag: PenDrag | null;
}

/**
 * Pen tool — click for corners, click-drag for smooth points, Enter/Escape to finish.
 */
export function usePenTool() {
  const stateRef = useRef<PenState>({ anchors: [], drag: null });

  const isDrawing = useCallback(
    () => stateRef.current.anchors.length > 0 || stateRef.current.drag !== null,
    [],
  );

  const cancelPath = useCallback(() => {
    stateRef.current = { anchors: [], drag: null };
  }, []);

  const finishPath = useCallback((closed: boolean) => {
    const { anchors } = stateRef.current;
    stateRef.current = { anchors: [], drag: null };

    if (anchors.length < 2) return;

    const origin = pathOriginFromAnchors(anchors);
    const segments = penAnchorsToSegments(anchors, origin, closed);
    if (segments.length < 2) return;

    const { strokeColor, strokeWidth, strokeEnabled, fillEnabled, fillColor } =
      useCanvasStore.getState();

    const pathObj: PathObject = {
      id: uuidv4(),
      type: "path",
      name: "Path",
      transform: createTransform(origin.x, origin.y),
      fill: fillEnabled ? createSolidFill(fillColor, 1) : null,
      stroke: strokeEnabled
        ? createStroke(strokeColor, strokeWidth, 1)
        : createStroke(strokeColor, strokeWidth, 1),
      opacity: 1,
      visible: true,
      locked: false,
      segments,
      closed,
    };

    const store = useDocumentStore.getState();
    const layerId = store.activeLayerId;
    const index = store.getActiveLayer()?.objects.length ?? 0;

    store.addObject(layerId, pathObj);
    store.setSelection([pathObj.id]);
    store.pushHistory(closed ? "Create closed path" : "Create path", [
      { type: "add-object", layerId, object: pathObj, index },
    ]);
    useCanvasStore.getState().setActiveTool("selection");
  }, []);

  const tryCloseAtPoint = useCallback(
    (point: Point2D): boolean => {
      const { anchors } = stateRef.current;
      if (anchors.length < 2) return false;
      if (distance(point, anchors[0]) > PEN_CLOSE_RADIUS) return false;
      finishPath(true);
      return true;
    },
    [finishPath],
  );

  const onPointerDown = useCallback(
    (point: Point2D) => {
      if (tryCloseAtPoint(point)) return;
      stateRef.current.drag = { downPoint: point, currentPoint: point };
    },
    [tryCloseAtPoint],
  );

  const onPointerMove = useCallback((point: Point2D) => {
    const s = stateRef.current;
    if (s.drag) {
      s.drag.currentPoint = point;
    }
  }, []);

  const onPointerUp = useCallback(
    (point: Point2D) => {
      const s = stateRef.current;
      if (!s.drag) return;

      const { downPoint } = s.drag;
      s.drag = null;

      if (tryCloseAtPoint(point)) return;

      const dragDist = distance(downPoint, point);
      if (dragDist >= PEN_DRAG_THRESHOLD) {
        s.anchors.push({
          x: downPoint.x,
          y: downPoint.y,
          outHandle: { x: point.x, y: point.y },
          inHandle: mirroredHandle(downPoint, point),
        });
      } else {
        s.anchors.push({ x: downPoint.x, y: downPoint.y });
      }
    },
    [tryCloseAtPoint],
  );

  const renderPreview = useCallback(
    (ctx: CanvasRenderingContext2D, cursor: Point2D) => {
      const s = stateRef.current;
      const { anchors, drag } = s;
      if (anchors.length === 0 && !drag) return;

      const { strokeColor, strokeWidth } = useCanvasStore.getState();

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([4, 4]);

      if (anchors.length > 0) {
        ctx.beginPath();
        ctx.moveTo(anchors[0].x, anchors[0].y);

        for (let i = 1; i < anchors.length; i++) {
          const prev = anchors[i - 1];
          const curr = anchors[i];
          if (prev.outHandle) {
            ctx.bezierCurveTo(
              prev.outHandle.x,
              prev.outHandle.y,
              curr.inHandle?.x ?? curr.x,
              curr.inHandle?.y ?? curr.y,
              curr.x,
              curr.y,
            );
          } else {
            ctx.lineTo(curr.x, curr.y);
          }
        }
        ctx.stroke();

        for (const anchor of anchors) {
          ctx.fillStyle = "#2563eb";
          ctx.beginPath();
          ctx.arc(anchor.x, anchor.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        if (anchors.length >= 2) {
          ctx.strokeStyle = "#16a34a";
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(anchors[0].x, anchors[0].y, PEN_CLOSE_RADIUS, 0, Math.PI * 2);
          ctx.stroke();
        }

        const last = anchors[anchors.length - 1];
        ctx.strokeStyle = strokeColor;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);

        if (drag) {
          const anchor = drag.downPoint;
          const handle = drag.currentPoint;
          if (distance(anchor, handle) >= PEN_DRAG_THRESHOLD) {
            const incoming = mirroredHandle(anchor, handle);
            if (last.outHandle) {
              ctx.bezierCurveTo(
                last.outHandle.x,
                last.outHandle.y,
                incoming.x,
                incoming.y,
                anchor.x,
                anchor.y,
              );
            } else {
              ctx.quadraticCurveTo(incoming.x, incoming.y, anchor.x, anchor.y);
            }
          } else {
            ctx.lineTo(anchor.x, anchor.y);
          }
        } else {
          ctx.lineTo(cursor.x, cursor.y);
        }
        ctx.stroke();
      }

      if (drag && distance(drag.downPoint, drag.currentPoint) >= PEN_DRAG_THRESHOLD) {
        ctx.setLineDash([]);
        ctx.strokeStyle = "#94a3b8";
        ctx.beginPath();
        ctx.moveTo(drag.downPoint.x, drag.downPoint.y);
        ctx.lineTo(drag.currentPoint.x, drag.currentPoint.y);
        ctx.stroke();
      }

      ctx.restore();
    },
    [],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    renderPreview,
    isDrawing,
    cancelPath,
    finishPath,
  };
}
