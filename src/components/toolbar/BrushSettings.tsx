"use client";

import { useCanvasStore } from "@/store/canvasStore";
import { TextSettings } from "./TextSettings";

/**
 * Tool settings panel — shows vector-relevant controls based on active tool.
 *
 * - Shape / brush tools: stroke width
 * - Text tool: font settings
 * - Selection: nothing (PropertiesPanel handles it)
 * - Eraser / fill / eyedropper: usage hint
 */
export function BrushSettings() {
  const {
    activeTool,
    strokeWidth,
    setStrokeWidth,
    strokeEnabled,
    setStrokeEnabled,
    fillEnabled,
    setFillEnabled,
  } = useCanvasStore();

  const isDrawingTool = [
    "rectangle",
    "ellipse",
    "line",
    "polygon",
    "brush",
    "pen",
  ].includes(activeTool);

  return (
    <div className="flex flex-col gap-3 p-2 bg-gray-100 rounded-lg">
      {/* Tool name header */}
      <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
        {toolLabel(activeTool)}
      </div>

      {/* Stroke width — for shape and brush tools */}
      {isDrawingTool && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={strokeEnabled}
                onChange={(e) => setStrokeEnabled(e.target.checked)}
                className="rounded"
              />
              Stroke
            </label>
            <span className="text-xs text-gray-700 ml-auto">
              {strokeWidth}px
            </span>
          </div>
          {strokeEnabled && (
            <div className="flex items-center gap-2">
              <input
                id="stroke-width-range"
                type="range"
                min="1"
                max="50"
                value={strokeWidth}
                aria-label="Stroke width"
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw.trim() === "") return;
                  const n = Number(raw);
                  if (!Number.isFinite(n)) return;
                  setStrokeWidth(n);
                }}
                className="flex-1"
              />
              <input
                id="stroke-width-number"
                type="number"
                min="1"
                max="100"
                value={strokeWidth}
                aria-label="Stroke width in pixels"
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw.trim() === "") return;
                  const n = Number(raw);
                  if (!Number.isFinite(n)) return;
                  setStrokeWidth(n);
                }}
                className="w-14 px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
          )}
        </div>
      )}

      {/* Fill toggle — for shape tools */}
      {["rectangle", "ellipse", "polygon"].includes(activeTool) && (
        <label className="flex items-center gap-1 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={fillEnabled}
            onChange={(e) => setFillEnabled(e.target.checked)}
            className="rounded"
          />
          Fill
        </label>
      )}

      {/* Usage hints for utility tools */}
      {activeTool === "selection" && (
        <p className="text-xs text-gray-600">
          Click to select. Drag to move. Shift+click for multi-select.
        </p>
      )}
      {activeTool === "pen" && (
        <>
          <p className="text-xs text-gray-600">
            Click for corner points. Click-drag for smooth curves. Click the
            start point to close. Enter to finish, Escape to cancel.
          </p>
        </>
      )}

      {activeTool === "eraser" && (
        <p className="text-xs text-gray-600">Click an object to delete it.</p>
      )}
      {activeTool === "fill" && (
        <p className="text-xs text-gray-600">
          Click an object to apply the current fill color.
        </p>
      )}
      {activeTool === "eyedropper" && (
        <p className="text-xs text-gray-600">
          Click an object to pick its color.
        </p>
      )}
      {activeTool === "text" && (
        <>
          <TextSettings />
          <p className="text-xs text-gray-600">
            Click on the canvas to place text. Double-click text to edit with
            the selection tool.
          </p>
        </>
      )}
    </div>
  );
}

function toolLabel(tool: string): string {
  const labels: Record<string, string> = {
    selection: "Selection",
    rectangle: "Rectangle",
    ellipse: "Ellipse",
    line: "Line",
    polygon: "Polygon",
    brush: "Brush",
    pen: "Pen",
    eraser: "Eraser",
    fill: "Fill Bucket",
    eyedropper: "Eyedropper",
    text: "Text",
  };
  return labels[tool] ?? "Tool";
}
