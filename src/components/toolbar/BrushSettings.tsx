"use client";

import { useCanvasStore } from "@/store/canvasStore";

/**
 * Brush settings component for size and shape controls
 */
export function BrushSettings() {
  const {
    brushSize,
    setBrushSize,
    brushShape,
    setBrushShape,
    activeTool,
    shapeOptions,
    setShapeOptions,
  } = useCanvasStore();

  const isShapeTool = ["line", "rectangle", "ellipse"].includes(activeTool);

  return (
    <div className="flex flex-col gap-3 p-2 bg-gray-100 rounded-lg">
      {/* Brush Size */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-700">
          {isShapeTool ? "Stroke Width" : "Size"}: {brushSize}px
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="flex-1"
          />
          <input
            type="number"
            min="1"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-14 px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>
      </div>

      {/* Brush Shape (for brush/eraser tools) */}
      {!isShapeTool && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-700">Shape</label>
          <div className="flex gap-1">
            <button
              onClick={() => setBrushShape("round")}
              className={`flex-1 py-1 text-xs rounded ${
                brushShape === "round"
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-gray-300"
              }`}
            >
              Round
            </button>
            <button
              onClick={() => setBrushShape("square")}
              className={`flex-1 py-1 text-xs rounded ${
                brushShape === "square"
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-gray-300"
              }`}
            >
              Square
            </button>
          </div>
        </div>
      )}

      {/* Shape Options (for shape tools) */}
      {isShapeTool && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-700">Fill Options</label>
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={shapeOptions.fill}
                onChange={(e) => setShapeOptions({ fill: e.target.checked })}
                className="rounded"
              />
              Fill
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={shapeOptions.stroke}
                onChange={(e) => setShapeOptions({ stroke: e.target.checked })}
                className="rounded"
              />
              Stroke
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
