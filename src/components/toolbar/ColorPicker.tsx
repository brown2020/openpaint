"use client";

import { useState } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useDocumentStore } from "@/store/documentStore";

const PRESET_COLORS = [
  "#000000", "#ffffff", "#ff0000", "#ff6600",
  "#ffff00", "#00ff00", "#00ffff", "#0000ff",
  "#ff00ff", "#800080", "#964B00", "#808080",
];

type ColorTarget = "fill" | "stroke";

/**
 * Color picker with separate fill and stroke rows, presets, and swap/toggle.
 */
export function ColorPicker() {
  const {
    fillColor,
    fillEnabled,
    strokeColor,
    strokeEnabled,
    setFillColor,
    setFillEnabled,
    setStrokeColor,
    setStrokeEnabled,
    swapFillStroke,
  } = useCanvasStore();

  const selectedObjectIds = useDocumentStore((s) => s.selectedObjectIds);
  const updateObject = useDocumentStore((s) => s.updateObject);
  const getObject = useDocumentStore((s) => s.getObject);

  // Which target the preset colors apply to
  const [activeTarget, setActiveTarget] = useState<ColorTarget>("fill");

  const applyFillToSelection = (color: string) => {
    setFillColor(color);
    for (const id of selectedObjectIds) {
      const obj = getObject(id);
      if (obj) {
        updateObject(id, {
          fill: {
            type: "solid" as const,
            color,
            opacity: obj.fill?.type === "solid" ? obj.fill.opacity : 1,
          },
        });
      }
    }
  };

  const applyStrokeToSelection = (color: string) => {
    setStrokeColor(color);
    for (const id of selectedObjectIds) {
      const obj = getObject(id);
      if (obj && obj.stroke) {
        updateObject(id, { stroke: { ...obj.stroke, color } });
      }
    }
  };

  const handlePresetClick = (color: string) => {
    if (activeTarget === "fill") {
      applyFillToSelection(color);
    } else {
      applyStrokeToSelection(color);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 p-2 bg-gray-100 rounded-lg">
      {/* Fill row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTarget("fill")}
          className={`flex items-center gap-1.5 flex-1 px-1.5 py-1 rounded text-xs font-medium ${
            activeTarget === "fill"
              ? "bg-blue-50 text-blue-700 ring-1 ring-blue-300"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {/* Fill swatch */}
          <div
            className="w-7 h-7 rounded border-2 border-gray-400 shrink-0 relative"
            style={{ backgroundColor: fillEnabled ? fillColor : "#ffffff" }}
          >
            {!fillEnabled && (
              <svg
                className="absolute inset-0 w-full h-full text-red-500"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                fill="none"
              >
                <line x1="4" y1="4" x2="20" y2="20" />
              </svg>
            )}
          </div>
          <span>Fill</span>
        </button>

        <input
          type="color"
          value={fillColor}
          onChange={(e) => applyFillToSelection(e.target.value)}
          className="w-7 h-7 cursor-pointer border-0 p-0 rounded"
          title="Pick fill color"
        />

        <button
          onClick={() => setFillEnabled(!fillEnabled)}
          className={`w-7 h-7 flex items-center justify-center rounded border text-xs ${
            fillEnabled
              ? "bg-white border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-500"
              : "bg-blue-50 border-blue-300 text-blue-600"
          }`}
          title={fillEnabled ? "Remove fill (/)" : "Add fill (/)"}
        >
          {fillEnabled ? "✕" : "+"}
        </button>
      </div>

      {/* Stroke row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTarget("stroke")}
          className={`flex items-center gap-1.5 flex-1 px-1.5 py-1 rounded text-xs font-medium ${
            activeTarget === "stroke"
              ? "bg-blue-50 text-blue-700 ring-1 ring-blue-300"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {/* Stroke swatch — hollow square */}
          <div
            className="w-7 h-7 rounded border-2 shrink-0 relative"
            style={{
              borderColor: strokeEnabled ? strokeColor : "#9ca3af",
              backgroundColor: "#ffffff",
            }}
          >
            {strokeEnabled && (
              <div
                className="absolute inset-[3px] rounded-sm"
                style={{ backgroundColor: "#ffffff" }}
              />
            )}
            {!strokeEnabled && (
              <svg
                className="absolute inset-0 w-full h-full text-red-500"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                fill="none"
              >
                <line x1="4" y1="4" x2="20" y2="20" />
              </svg>
            )}
          </div>
          <span>Stroke</span>
        </button>

        <input
          type="color"
          value={strokeColor}
          onChange={(e) => applyStrokeToSelection(e.target.value)}
          className="w-7 h-7 cursor-pointer border-0 p-0 rounded"
          title="Pick stroke color"
        />

        <button
          onClick={() => setStrokeEnabled(!strokeEnabled)}
          className={`w-7 h-7 flex items-center justify-center rounded border text-xs ${
            strokeEnabled
              ? "bg-white border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-500"
              : "bg-blue-50 border-blue-300 text-blue-600"
          }`}
          title={strokeEnabled ? "Remove stroke" : "Add stroke"}
        >
          {strokeEnabled ? "✕" : "+"}
        </button>
      </div>

      {/* Swap button */}
      <button
        onClick={swapFillStroke}
        className="flex items-center justify-center gap-1.5 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded"
        title="Swap fill & stroke (X)"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        Swap fill &amp; stroke
      </button>

      {/* Color presets */}
      <div>
        <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">
          Presets → {activeTarget}
        </div>
        <div className="grid grid-cols-6 gap-1">
          {PRESET_COLORS.map((color) => {
            const isActive =
              (activeTarget === "fill" && fillColor === color) ||
              (activeTarget === "stroke" && strokeColor === color);
            return (
              <button
                key={color}
                onClick={() => handlePresetClick(color)}
                className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
                  isActive
                    ? "border-blue-500 ring-2 ring-blue-300"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
