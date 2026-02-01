"use client";

import { useCanvasStore } from "@/store/canvasStore";

const PRESET_COLORS = [
  "#000000", // Black
  "#ffffff", // White
  "#ff0000", // Red
  "#ff6600", // Orange
  "#ffff00", // Yellow
  "#00ff00", // Green
  "#00ffff", // Cyan
  "#0000ff", // Blue
  "#ff00ff", // Magenta
  "#800080", // Purple
  "#964B00", // Brown
  "#808080", // Gray
];

/**
 * Color picker component with presets and custom color input
 */
export function ColorPicker() {
  const { brushColor, setBrushColor, brushOpacity, setBrushOpacity } = useCanvasStore();

  return (
    <div className="flex flex-col gap-2 p-2 bg-gray-100 rounded-lg">
      {/* Current color display */}
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded border-2 border-gray-300"
          style={{
            backgroundColor: brushColor,
            opacity: brushOpacity,
          }}
        />
        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          className="w-8 h-8 cursor-pointer border-0 p-0"
          title="Custom color"
        />
      </div>

      {/* Color presets */}
      <div className="grid grid-cols-6 gap-1">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setBrushColor(color)}
            className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
              brushColor === color ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300"
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Opacity slider */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600 w-14">Opacity</label>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(brushOpacity * 100)}
          onChange={(e) => setBrushOpacity(Number(e.target.value) / 100)}
          className="flex-1 h-2"
        />
        <span className="text-xs text-gray-600 w-8 text-right">
          {Math.round(brushOpacity * 100)}%
        </span>
      </div>
    </div>
  );
}
