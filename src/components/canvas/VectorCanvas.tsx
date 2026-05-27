"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useDocumentStore } from "@/store/documentStore";
import { useSelectionTool } from "@/hooks/useSelectionTool";
import { useShapeTool } from "@/hooks/useShapeTool";
import { useFreehandTool } from "@/hooks/useFreehandTool";
import { usePenTool } from "@/hooks/usePenTool";
import { hitTestLayers } from "@/lib/vector/hitTest";
import { renderScene, renderSelectionOverlay } from "@/lib/vector/renderer";
import {
  buildTextObject,
  normalizeTextAlign,
  textStyleFromOptions,
} from "@/lib/vector/textObject";
import type { Point2D, TextObject } from "@/types/vector";
import { TextEditor } from "./TextEditor";

const SHAPE_TOOLS = new Set(["rectangle", "ellipse", "line", "polygon"]);

type TextEditSession =
  | { mode: "new"; point: Point2D }
  | { mode: "edit"; objectId: string; point: Point2D };

/**
 * Vector canvas — renders scene graph and handles tool interactions.
 */
export function VectorCanvas() {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentPointRef = useRef<Point2D>({ x: 0, y: 0 });
  const pointerDownRef = useRef(false);
  const committingTextRef = useRef(false);
  const editSnapshotRef = useRef<TextObject | null>(null);

  const [textSession, setTextSession] = useState<TextEditSession | null>(null);
  const [textDraft, setTextDraft] = useState("");

  const {
    canvasSize,
    zoom,
    pan,
    activeTool,
    setCursorPosition,
    textOptions,
    fillColor,
  } = useCanvasStore();
  const layers = useDocumentStore((s) => s.layers);
  const selectedObjectIds = useDocumentStore((s) => s.selectedObjectIds);

  const selectionTool = useSelectionTool();
  const shapeTool = useShapeTool();
  const freehandTool = useFreehandTool();
  const penTool = usePenTool();

  const hiddenObjectIds = useMemo(() => {
    if (textSession?.mode === "edit") {
      return new Set([textSession.objectId]);
    }
    return undefined;
  }, [textSession]);

  const getCanvasPoint = useCallback(
    (
      e: React.PointerEvent | React.MouseEvent | PointerEvent | MouseEvent,
    ): Point2D | null => {
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

  const renderMain = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderScene(ctx, layers, canvasSize.width, canvasSize.height, {
      hiddenObjectIds,
    });
  }, [layers, canvasSize, hiddenObjectIds]);

  useEffect(() => {
    renderMain();
  }, [renderMain]);

  const renderOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    renderSelectionOverlay(
      ctx,
      layers,
      selectedObjectIds,
      canvasSize.width,
      canvasSize.height,
    );

    shapeTool.renderPreview(ctx);
    freehandTool.renderPreview(ctx);
    penTool.renderPreview(ctx, currentPointRef.current);

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
  }, [layers, selectedObjectIds, canvasSize, shapeTool, freehandTool, penTool, selectionTool]);

  useEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

  const cancelTextEdit = useCallback(() => {
    if (textSession?.mode === "edit" && editSnapshotRef.current) {
      const snap = editSnapshotRef.current;
      useDocumentStore.getState().updateObject(snap.id, {
        content: snap.content,
        fontFamily: snap.fontFamily,
        fontSize: snap.fontSize,
        fontWeight: snap.fontWeight,
        fontStyle: snap.fontStyle,
        textAlign: snap.textAlign,
        fill: snap.fill,
      });
    }
    editSnapshotRef.current = null;
    setTextSession(null);
    setTextDraft("");
  }, [textSession]);

  const commitTextEdit = useCallback(() => {
    if (committingTextRef.current || !textSession) return;
    committingTextRef.current = true;

    try {
      const trimmed = textDraft.trim();
      const store = useDocumentStore.getState();
      const canvasState = useCanvasStore.getState();

      if (textSession.mode === "new") {
        if (!trimmed) {
          cancelTextEdit();
          return;
        }

        const textObj = buildTextObject({
          point: textSession.point,
          content: trimmed,
          textOptions: canvasState.textOptions,
          fillColor: canvasState.fillColor,
          fillEnabled: canvasState.fillEnabled,
        });

        const layerId = store.activeLayerId;
        const index = store.getActiveLayer()?.objects.length ?? 0;

        store.addObject(layerId, textObj);
        store.setSelection([textObj.id]);
        store.pushHistory("Add text", [
          { type: "add-object", layerId, object: textObj, index },
        ]);
        canvasState.setActiveTool("selection");
      } else {
        const existing = store.getObject(textSession.objectId);
        if (!existing || existing.type !== "text") return;

        const layerId = store.getObjectLayerId(textSession.objectId);
        if (!layerId) return;

        const snap = editSnapshotRef.current ?? existing;
        const style = textStyleFromOptions(canvasState.textOptions);
        const after = {
          content: trimmed,
          ...style,
        };

        store.updateObject(textSession.objectId, after);
        store.setSelection([textSession.objectId]);
        store.pushHistory("Edit text", [
          {
            type: "modify-object",
            objectId: textSession.objectId,
            layerId,
            before: {
              content: snap.content,
              fontFamily: snap.fontFamily,
              fontSize: snap.fontSize,
              fontWeight: snap.fontWeight,
              fontStyle: snap.fontStyle,
              textAlign: snap.textAlign,
            },
            after,
          },
        ]);
        canvasState.setActiveTool("selection");
      }

      editSnapshotRef.current = null;
      setTextSession(null);
      setTextDraft("");
    } finally {
      committingTextRef.current = false;
    }
  }, [textDraft, textSession, cancelTextEdit]);

  const startNewTextEdit = useCallback((point: Point2D) => {
    setTextSession({ mode: "new", point });
    setTextDraft("");
  }, []);

  const startEditText = useCallback((obj: TextObject) => {
    const canvasState = useCanvasStore.getState();
    canvasState.setTextOptions({
      fontFamily: obj.fontFamily,
      fontSize: obj.fontSize,
      fontWeight: obj.fontWeight,
      fontStyle: obj.fontStyle,
      textAlign: normalizeTextAlign(obj.textAlign),
    });
    if (obj.fill?.type === "solid") {
      canvasState.setFillColor(obj.fill.color);
    }

    editSnapshotRef.current = structuredClone(obj);
    setTextSession({
      mode: "edit",
      objectId: obj.id,
      point: { x: obj.transform.x, y: obj.transform.y },
    });
    setTextDraft(obj.content);
    canvasState.setActiveTool("text");
  }, []);

  // Live preview while editing existing text
  useEffect(() => {
    if (textSession?.mode !== "edit") return;

    const store = useDocumentStore.getState();
    const obj = store.getObject(textSession.objectId);
    if (!obj || obj.type !== "text") return;

    store.updateObject(textSession.objectId, {
      content: textDraft,
      ...textStyleFromOptions(textOptions),
    });
  }, [textDraft, textOptions, textSession]);

  const handleUtilityClick = useCallback(
    (point: Point2D) => {
      const mainCtx = mainCanvasRef.current?.getContext("2d");
      if (!mainCtx) return;

      const store = useDocumentStore.getState();
      const hit = hitTestLayers(mainCtx, point, store.layers);

      switch (activeTool) {
        case "eraser": {
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
          if (hit) {
            const { fillColor: fc, fillEnabled: fe } = useCanvasStore.getState();
            const before = hit.object.fill;
            const after = fe
              ? { type: "solid" as const, color: fc, opacity: 1 }
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
          if (hit && hit.object.fill && hit.object.fill.type === "solid") {
            useCanvasStore.getState().setFillColor(hit.object.fill.color);
          } else if (hit && hit.object.stroke) {
            useCanvasStore.getState().setStrokeColor(hit.object.stroke.color);
          }
          useCanvasStore.getState().setActiveTool("selection");
          break;
        }
      }
    },
    [activeTool],
  );

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
      } else if (activeTool === "pen") {
        penTool.onPointerDown(point);
      } else if (activeTool === "eraser" || activeTool === "fill" || activeTool === "eyedropper") {
        handleUtilityClick(point);
      } else if (activeTool === "text") {
        startNewTextEdit(point);
      }
    },
    [
      activeTool,
      getCanvasPoint,
      selectionTool,
      shapeTool,
      freehandTool,
      penTool,
      handleUtilityClick,
      startNewTextEdit,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e);
      if (!point) return;

      currentPointRef.current = point;
      setCursorPosition({ x: point.x, y: point.y });

      if (!pointerDownRef.current || textSession) return;

      if (activeTool === "selection") {
        selectionTool.onPointerMove(point);
      } else if (SHAPE_TOOLS.has(activeTool)) {
        shapeTool.onPointerMove(point, e.shiftKey, e.altKey);
      } else if (activeTool === "brush") {
        freehandTool.onPointerMove(point);
      } else if (activeTool === "pen") {
        penTool.onPointerMove(point);
      }

      renderOverlay();
    },
    [
      activeTool,
      getCanvasPoint,
      setCursorPosition,
      selectionTool,
      shapeTool,
      freehandTool,
      penTool,
      renderOverlay,
      textSession,
    ],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e);
      if (!point) return;

      const canvas = eventCanvasRef.current;
      if (canvas) canvas.releasePointerCapture(e.pointerId);

      pointerDownRef.current = false;
      currentPointRef.current = point;

      if (textSession) return;

      if (activeTool === "selection") {
        selectionTool.onPointerUp(point);
      } else if (SHAPE_TOOLS.has(activeTool)) {
        shapeTool.onPointerUp(point);
      } else if (activeTool === "brush") {
        freehandTool.onPointerUp();
      } else if (activeTool === "pen") {
        penTool.onPointerUp(point);
      }

      renderOverlay();
    },
    [activeTool, getCanvasPoint, selectionTool, shapeTool, freehandTool, penTool, renderOverlay, textSession],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (textSession) return;

      const point = getCanvasPoint(e);
      if (!point) return;

      const ctx = mainCanvasRef.current?.getContext("2d");
      if (!ctx) return;

      const hit = hitTestLayers(ctx, point, useDocumentStore.getState().layers);
      if (hit?.object.type === "text") {
        e.preventDefault();
        startEditText(hit.object);
      }
    },
    [getCanvasPoint, startEditText, textSession],
  );

  const handleMouseLeave = useCallback(() => {
    setCursorPosition(null);
  }, [setCursorPosition]);

  const getCursor = useCallback(() => {
    if (textSession) return "text";
    switch (activeTool) {
      case "selection":
        return "default";
      case "rectangle":
      case "ellipse":
      case "line":
      case "polygon":
        return "crosshair";
      case "brush":
      case "pen":
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
  }, [activeTool, textSession]);

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

  // Commit when clicking outside the text editor (canvas uses pointer-events: none)
  useEffect(() => {
    if (!textSession) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-text-editor]")) return;
      commitTextEdit();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [textSession, commitTextEdit]);

  // Pen tool: Enter finishes, Escape cancels in-progress path
  useEffect(() => {
    if (activeTool !== "pen") {
      penTool.cancelPath();
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== "Escape") return;
      if (!penTool.isDrawing()) return;
      e.preventDefault();
      if (e.key === "Escape") {
        penTool.cancelPath();
      } else {
        penTool.finishPath(false);
      }
      renderOverlay();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTool, penTool, renderOverlay]);

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
      <div
        className="relative shadow-lg"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: "center center",
        }}
      >
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

        <div className="absolute inset-0 bg-white" />

        <canvas
          ref={mainCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0 pointer-events-none"
        />

        <canvas
          ref={overlayCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0 pointer-events-none"
        />

        {textSession && (
          <TextEditor
            x={textSession.point.x}
            y={textSession.point.y}
            value={textDraft}
            onChange={setTextDraft}
            onCommit={commitTextEdit}
            onCancel={cancelTextEdit}
            textOptions={textOptions}
            fillColor={fillColor}
          />
        )}

        <canvas
          ref={eventCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0"
          style={{
            cursor: getCursor(),
            touchAction: "none",
            pointerEvents: textSession ? "none" : "auto",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
}
