"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useLayers } from "@/hooks/useLayers";
import { useDrawing } from "@/hooks/useDrawing";
import { useCanvasEvents } from "@/hooks/useCanvasEvents";
import { LayerCanvas } from "./LayerCanvas";
import type { Point } from "@/types";

/**
 * Main drawing canvas component
 * Manages layer canvases and handles drawing events
 */
export function DrawingCanvas() {
  const eventCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { canvasSize, zoom, pan, setCursorPosition, activeTool, brushSize } = useCanvasStore();
  const { layers, getActiveLayerCanvas } = useLayers();

  const [shiftHeld, setShiftHeld] = useState(false);
  const [altHeld, setAltHeld] = useState(false);
  const lastPointRef = useRef<Point | null>(null);

  // Get the active layer's canvas for drawing
  const activeCanvas = getActiveLayerCanvas();

  const { startDrawing, continueDrawing, endDrawing } = useDrawing({
    canvas: activeCanvas || null,
    previewCanvasRef,
  });

  // Handle draw start
  const handleDrawStart = useCallback(
    (point: Point, pressure: number) => {
      lastPointRef.current = point;
      startDrawing(point, pressure);
    },
    [startDrawing]
  );

  // Handle draw move
  const handleDrawMove = useCallback(
    (point: Point, pressure: number) => {
      setCursorPosition(point);
      continueDrawing(point, pressure, shiftHeld, altHeld);
      lastPointRef.current = point;
    },
    [continueDrawing, setCursorPosition, shiftHeld, altHeld]
  );

  // Handle draw end
  const handleDrawEnd = useCallback(() => {
    endDrawing(lastPointRef.current || undefined);
    lastPointRef.current = null;
  }, [endDrawing]);

  // Set up canvas events
  const { handlers } = useCanvasEvents(eventCanvasRef, {
    onDrawStart: handleDrawStart,
    onDrawMove: handleDrawMove,
    onDrawEnd: handleDrawEnd,
  });

  // Track modifier keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(true);
      if (e.key === "Alt") setAltHeld(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(false);
      if (e.key === "Alt") setAltHeld(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Handle mouse leave to clear cursor position
  const handleMouseLeave = useCallback(() => {
    setCursorPosition(null);
  }, [setCursorPosition]);

  // Get cursor style based on active tool
  const getCursor = useCallback(() => {
    switch (activeTool) {
      case "eyedropper":
        return "crosshair";
      case "fill":
        return "cell";
      case "text":
        return "text";
      case "selection":
        return "crosshair";
      default:
        return "none"; // We'll draw a custom cursor
    }
  }, [activeTool]);

  return (
    <div
      ref={containerRef}
      className="relative bg-gray-200 overflow-hidden"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Canvas container with zoom/pan */}
      <div
        className="relative shadow-lg"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: "center center",
        }}
      >
        {/* Checkerboard background for transparency */}
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

        {/* White background layer */}
        <div className="absolute inset-0 bg-white" />

        {/* Layer canvases */}
        {layers.map((layer) => (
          <LayerCanvas
            key={layer.id}
            layerId={layer.id}
            size={canvasSize}
            visible={layer.visible}
            opacity={layer.opacity}
          />
        ))}

        {/* Preview canvas for shape tools */}
        <canvas
          ref={previewCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0 pointer-events-none"
        />

        {/* Event capture canvas (transparent, on top) */}
        <canvas
          ref={eventCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0"
          style={{
            cursor: getCursor(),
            touchAction: "none",
          }}
          onMouseLeave={handleMouseLeave}
          {...handlers}
        />

        {/* Custom cursor overlay */}
        {activeTool === "brush" || activeTool === "eraser" ? (
          <BrushCursor size={brushSize} zoom={zoom} />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Custom brush cursor component
 */
function BrushCursor({ size, zoom }: { size: number; zoom: number }) {
  const cursorPosition = useCanvasStore((s) => s.cursorPosition);

  if (!cursorPosition) return null;

  const scaledSize = size * zoom;

  return (
    <div
      className="absolute pointer-events-none border-2 border-gray-800 rounded-full"
      style={{
        width: scaledSize,
        height: scaledSize,
        left: cursorPosition.x * zoom - scaledSize / 2,
        top: cursorPosition.y * zoom - scaledSize / 2,
        boxShadow: "0 0 0 1px white",
      }}
    />
  );
}
