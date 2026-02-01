"use client";

import { useCanvasStore } from "@/store/canvasStore";

/**
 * Status bar showing canvas info and cursor position
 */
export function StatusBar() {
  const { cursorPosition, canvasSize, zoom, activeTool } = useCanvasStore();

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-gray-200 border-t border-gray-300 text-xs text-gray-600">
      {/* Cursor position */}
      <div className="flex items-center gap-4">
        <span>
          Position:{" "}
          {cursorPosition
            ? `${Math.round(cursorPosition.x)}, ${Math.round(cursorPosition.y)}`
            : "—, —"}
        </span>
        <span>
          Canvas: {canvasSize.width} × {canvasSize.height}
        </span>
      </div>

      {/* Current tool */}
      <div className="flex items-center gap-4">
        <span className="capitalize">Tool: {activeTool}</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
