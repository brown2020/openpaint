"use client";

import { useCanvasStore } from "@/store/canvasStore";

const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Inter",
  "Courier New",
];

/**
 * Font controls for the text tool and inline text editing.
 */
export function TextSettings() {
  const { textOptions, setTextOptions } = useCanvasStore();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-gray-700">
        Font family
        <select
          value={textOptions.fontFamily}
          onChange={(e) => setTextOptions({ fontFamily: e.target.value })}
          className="mt-0.5 w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-700 shrink-0">Size</label>
        <input
          type="number"
          min={8}
          max={200}
          value={textOptions.fontSize}
          onChange={(e) =>
            setTextOptions({ fontSize: Number(e.target.value) || 24 })
          }
          className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
        />
        <span className="text-xs text-gray-500">px</span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-700">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={textOptions.fontWeight === "bold"}
            onChange={(e) =>
              setTextOptions({ fontWeight: e.target.checked ? "bold" : "normal" })
            }
            className="rounded"
          />
          Bold
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={textOptions.fontStyle === "italic"}
            onChange={(e) =>
              setTextOptions({ fontStyle: e.target.checked ? "italic" : "normal" })
            }
            className="rounded"
          />
          Italic
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-700">Align</span>
        <div className="flex gap-1" role="group" aria-label="Text alignment">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => setTextOptions({ textAlign: align })}
              className={`flex-1 px-2 py-1 text-xs rounded border ${
                textOptions.textAlign === align
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              aria-pressed={textOptions.textAlign === align}
            >
              {align}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
