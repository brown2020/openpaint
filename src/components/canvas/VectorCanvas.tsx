"use client";

import { useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useCanvasStore } from "@/store/canvasStore";
import { useDocumentStore } from "@/store/documentStore";
import { useSelectionTool } from "@/hooks/useSelectionTool";
import { useShapeTool } from "@/hooks/useShapeTool";
import { useFreehandTool } from "@/hooks/useFreehandTool";
import { hitTestLayers } from "@/lib/vector/hitTest";
import { renderScene, renderSelectionOverlay } from "@/lib/vector/renderer";
import { createTransform, createSolidFill } from "@/types/vector";
import type { Point2D, TextObject } from "@/types/vector";

const SHAPE_TOOLS = new Set(["rectangle", "ellipse", "line", "polygon"]);

/**
 * Vector canvas — renders scene graph and handles tool interactions.
 *
 * Three stacked canvases:
 *  1. Main: renders vector objects
 *  2. Overlay: selection handles, tool previews, guides
 *  3. Event: invisible, captures all pointer events
 */
export function VectorCanvas() {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentPointRef = useRef<Point2D>({ x: 0, y: 0 });
  const pointerDownRef = useRef(false);

  const { canvasSize, zoom, pan, activeTool, setCursorPosition } = useCanvasStore();
  const layers = useDocumentStore((s) => s.layers);
  const selectedObjectIds = useDocumentStore((s) => s.selectedObjectIds);

  const selectionTool = useSelectionTool();
  const shapeTool = useShapeTool();
  const freehandTool = useFreehandTool();

  // ---- Coordinate conversion ----

  const getCanvasPoint = useCallback(
    (e: React.PointerEvent | PointerEvent): Point2D | null => {
      const canvas = eventCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    },
    [],
  );

  // ---- Render main scene ----

  const renderMain = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderScene(ctx, layers, canvasSize.width, canvasSize.height);
  }, [layers, canvasSize]);

  useEffect(() => {
    renderMain();
  }, [renderMain]);

  // ---- Render overlay (called imperatively for performance) ----

  const renderOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Selection outlines + handles
    renderSelectionOverlay(
      ctx,
      layers,
      selectedObjectIds,
      canvasSize.width,
      canvasSize.height,
    );

    // Tool-specific previews
    shapeTool.renderPreview(ctx);
    freehandTool.renderPreview(ctx);

    // Marquee preview
    const marquee = selectionTool.getMarqueeRect(currentPointRef.current);
    if (marquee) {
      ctx.save();
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(marquee.x, marquee.y, marquee.width, marquee.height);
      ctx.fillStyle = "rgba(37, 99, 235, 0.08)";
      ctx.fillRect(marquee.x, marquee.y, marquee.width, marquee.height);
      ctx.restore();
    }
  }, [layers, selectedObjectIds, canvasSize, shapeTool, freehandTool, selectionTool]);

  // Re-render overlay when selection changes
  useEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

  // ---- Utility tool handlers (eraser, fill bucket, eyedropper) ----

  const handleUtilityClick = useCallback(
    (point: Point2D) => {
      const mainCtx = mainCanvasRef.current?.getContext("2d");
      if (!mainCtx) return;

      const store = useDocumentStore.getState();
      const hit = hitTestLayers(mainCtx, point, store.layers);

      switch (activeTool) {
        case "eraser": {
          // Eraser: click to delete
          if (hit) {
            const layerId = store.getObjectLayerId(hit.object.id);
            if (layerId) {
              const layer = store.layers.find((l) => l.id === layerId);
              const index = layer?.objects.findIndex((o) => o.id === hit.object.id) ?? 0;
              store.removeObject(hit.object.id);
              store.pushHistory("Erase object", [
                { type: "remove-object", layerId, object: hit.object, index },
              ]);
            }
          }
          break;
        }
        case "fill": {
          // Fill bucket: click to set fill
          if (hit) {
            const { fillColor, fillEnabled } = useCanvasStore.getState();
            const before = hit.object.fill;
            const after = fillEnabled
              ? { type: "solid" as const, color: fillColor, opacity: 1 }
              : null;
            const layerId = store.getObjectLayerId(hit.object.id);
            if (layerId) {
              store.updateObject(hit.object.id, { fill: after });
              store.pushHistory("Fill object", [
                {
                  type: "modify-object",
                  objectId: hit.object.id,
                  layerId,
                  before: { fill: before },
                  after: { fill: after },
                },
              ]);
            }
          }
          break;
        }
        case "eyedropper": {
          // Eyedropper: pick fill color
          if (hit && hit.object.fill && hit.object.fill.type === "solid") {
            useCanvasStore.getState().setFillColor(hit.object.fill.color);
          } else if (hit && hit.object.stroke) {
            useCanvasStore.getState().setStrokeColor(hit.object.stroke.color);
          }
          // Switch to selection after picking
          useCanvasStore.getState().setActiveTool("selection");
          break;
        }
      }
    },
    [activeTool],
  );

  // ---- Text tool handler ----

  const handleTextClick = useCallback(
    (point: Point2D) => {
      const text = prompt("Enter text:");
      if (!text) return;

      const { fillColor, fillEnabled } = useCanvasStore.getState();

      const textObj: TextObject = {
        id: uuidv4(),
        type: "text",
        name: "Text",
        transform: createTransform(point.x, point.y),
        fill: fillEnabled ? createSolidFill(fillColor, 1) : createSolidFill("#000000", 1),
        stroke: null,
        opacity: 1,
        visible: true,
        locked: false,
        content: text,
        fontFamily: "Arial",
        fontSize: 24,
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "left",
        lineHeight: 1.2,
      };

      const store = useDocumentStore.getState();
      const layerId = store.activeLayerId;
      const index = store.getActiveLayer()?.objects.length ?? 0;

      store.addObject(layerId, textObj);
      store.setSelection([textObj.id]);
      store.pushHistory("Add text", [
        { type: "add-object", layerId, object: textObj, index },
      ]);

      // Switch to selection tool after placing text
      useCanvasStore.getState().setActiveTool("selection");
    },
    [],
  );

  // ---- Pointer events ----

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e);
      if (!point) return;

      const canvas = eventCanvasRef.current;
      if (canvas) canvas.setPointerCapture(e.pointerId);

      pointerDownRef.current = true;
      currentPointRef.current = point;

      if (activeTool === "selection") {
        const ctx = mainCanvasRef.current?.getContext("2d");
        if (ctx) selectionTool.onPointerDown(point, e.shiftKey, ctx);
      } else if (SHAPE_TOOLS.has(activeTool)) {
        shapeTool.onPointerDown(point, activeTool);
      } else if (activeTool === "brush") {
        freehandTool.onPointerDown(point);
      } else if (activeTool === "eraser" || activeTool === "fill" || activeTool === "eyedropper") {
        handleUtilityClick(point);
      } else if (activeTool === "text") {
        handleTextClick(point);
      }
    },
    [activeTool, getCanvasPoint, selectionTool, shapeTool, freehandTool, handleUtilityClick, handleTextClick],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e);
      if (!point) return;

      currentPointRef.current = point;
      setCursorPosition({ x: point.x, y: point.y });

      if (!pointerDownRef.current) return;

      if (activeTool === "selection") {
        selectionTool.onPointerMove(point);
      } else if (SHAPE_TOOLS.has(activeTool)) {
        shapeTool.onPointerMove(point, e.shiftKey, e.altKey);
      } else if (activeTool === "brush") {
        freehandTool.onPointerMove(point);
      }

      // Imperatively re-render overlay for smooth feedback
      renderOverlay();
    },
    [activeTool, getCanvasPoint, setCursorPosition, selectionTool, shapeTool, freehandTool, renderOverlay],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e);
      if (!point) return;

      const canvas = eventCanvasRef.current;
      if (canvas) canvas.releasePointerCapture(e.pointerId);

      pointerDownRef.current = false;
      currentPointRef.current = point;

      if (activeTool === "selection") {
        selectionTool.onPointerUp(point);
      } else if (SHAPE_TOOLS.has(activeTool)) {
        shapeTool.onPointerUp(point);
      } else if (activeTool === "brush") {
        freehandTool.onPointerUp();
      }

      renderOverlay();
    },
    [activeTool, getCanvasPoint, selectionTool, shapeTool, freehandTool, renderOverlay],
  );

  const handleMouseLeave = useCallback(() => {
    setCursorPosition(null);
  }, [setCursorPosition]);

  // ---- Cursor style ----

  const getCursor = useCallback(() => {
    switch (activeTool) {
      case "selection":
        return "default";
      case "rectangle":
      case "ellipse":
      case "line":
      case "polygon":
        return "crosshair";
      case "brush":
        return "crosshair";
      case "eraser":
        return "pointer";
      case "eyedropper":
        return "crosshair";
      case "fill":
        return "cell";
      case "text":
        return "text";
      default:
        return "default";
    }
  }, [activeTool]);

  // ---- Prevent touch defaults ----

  useEffect(() => {
    const canvas = eventCanvasRef.current;
    if (!canvas) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    canvas.addEventListener("touchstart", prevent, { passive: false });
    canvas.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", prevent);
      canvas.removeEventListener("touchmove", prevent);
    };
  }, []);

  return (
    <div
      className="relative bg-gray-200 overflow-hidden"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Zoom/pan wrapper */}
      <div
        className="relative shadow-lg"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: "center center",
        }}
      >
        {/* Checkerboard transparency background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #ccc 25%, transparent 25%),
              linear-gradient(-45deg, #ccc 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #ccc 75%),
              linear-gradient(-45deg, transparent 75%, #ccc 75%)
            `,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          }}
        />

        {/* White background */}
        <div className="absolute inset-0 bg-white" />

        {/* Main scene canvas */}
        <canvas
          ref={mainCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0 pointer-events-none"
        />

        {/* Overlay canvas (selection handles, previews) */}
        <canvas
          ref={overlayCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0 pointer-events-none"
        />

        {/* Event capture canvas */}
        <canvas
          ref={eventCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0"
          style={{ cursor: getCursor(), touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
}
