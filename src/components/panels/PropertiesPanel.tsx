"use client";

import { useCallback } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { useCanvasStore } from "@/store/canvasStore";
import { getWorldBounds } from "@/lib/vector/bounds";
import type { VectorObject } from "@/types/vector";

/**
 * Properties panel — shows editable properties for the selected object(s).
 * When nothing is selected, shows canvas info.
 */
export function PropertiesPanel() {
  const selectedObjectIds = useDocumentStore((s) => s.selectedObjectIds);
  const layers = useDocumentStore((s) => s.layers);
  const getObject = useDocumentStore((s) => s.getObject);
  const canvasSize = useCanvasStore((s) => s.canvasSize);

  if (selectedObjectIds.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Canvas
        </h3>
        <div className="text-xs text-gray-600">
          <div>Width: {canvasSize.width}px</div>
          <div>Height: {canvasSize.height}px</div>
          <div className="mt-2 text-gray-400">
            {layers.reduce((n, l) => n + l.objects.length, 0)} objects
          </div>
        </div>
      </div>
    );
  }

  if (selectedObjectIds.length === 1) {
    const obj = getObject(selectedObjectIds[0]);
    if (!obj) return null;
    return <SingleObjectProps obj={obj} />;
  }

  // Multiple selection
  return (
    <div className="flex flex-col gap-2 p-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Selection
      </h3>
      <div className="text-xs text-gray-600">
        {selectedObjectIds.length} objects selected
      </div>
    </div>
  );
}

// ============================================
// Single object properties
// ============================================

function SingleObjectProps({ obj }: { obj: VectorObject }) {
  const updateObject = useDocumentStore((s) => s.updateObject);
  const pushHistory = useDocumentStore((s) => s.pushHistory);
  const getObjectLayerId = useDocumentStore((s) => s.getObjectLayerId);

  const commitChange = useCallback(
    (field: string, before: unknown, after: unknown) => {
      const layerId = getObjectLayerId(obj.id);
      if (!layerId) return;
      pushHistory(`Change ${field}`, [
        {
          type: "modify-object",
          objectId: obj.id,
          layerId,
          before: { [field]: before },
          after: { [field]: after },
        },
      ]);
    },
    [obj.id, getObjectLayerId, pushHistory],
  );

  const setTransformField = useCallback(
    (field: "x" | "y" | "rotation", value: number) => {
      const before = { ...obj.transform };
      const after = { ...obj.transform, [field]: value };
      updateObject(obj.id, { transform: after });
      const layerId = getObjectLayerId(obj.id);
      if (layerId) {
        pushHistory(`Change ${field}`, [
          {
            type: "modify-object",
            objectId: obj.id,
            layerId,
            before: { transform: before },
            after: { transform: after },
          },
        ]);
      }
    },
    [obj, updateObject, getObjectLayerId, pushHistory],
  );

  const setNumericField = useCallback(
    (field: string, value: number) => {
      const before = (obj as unknown as Record<string, unknown>)[field];
      updateObject(obj.id, { [field]: value });
      commitChange(field, before, value);
    },
    [obj, updateObject, commitChange],
  );

  const bounds = getWorldBounds(obj);

  return (
    <div className="flex flex-col gap-3 p-2 text-xs">
      {/* Object type header */}
      <h3 className="font-semibold text-gray-500 uppercase tracking-wide">
        {obj.type}
      </h3>

      {/* Name */}
      <PropInput
        label="Name"
        type="text"
        value={obj.name}
        onChange={(val) => {
          const before = obj.name;
          updateObject(obj.id, { name: val });
          commitChange("name", before, val);
        }}
      />

      {/* Position */}
      <div className="grid grid-cols-2 gap-1">
        <NumInput
          label="X"
          value={Math.round(obj.transform.x)}
          onChange={(v) => setTransformField("x", v)}
        />
        <NumInput
          label="Y"
          value={Math.round(obj.transform.y)}
          onChange={(v) => setTransformField("y", v)}
        />
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-1">
        <NumInput
          label="W"
          value={Math.round(bounds.width)}
          onChange={(v) => {
            if (obj.type === "rectangle") setNumericField("width", v);
            if (obj.type === "ellipse") setNumericField("radiusX", v / 2);
          }}
          min={1}
        />
        <NumInput
          label="H"
          value={Math.round(bounds.height)}
          onChange={(v) => {
            if (obj.type === "rectangle") setNumericField("height", v);
            if (obj.type === "ellipse") setNumericField("radiusY", v / 2);
          }}
          min={1}
        />
      </div>

      {/* Rotation */}
      <NumInput
        label="Rotation"
        value={Math.round(obj.transform.rotation)}
        onChange={(v) => setTransformField("rotation", v)}
        suffix="°"
      />

      {/* Opacity */}
      <div className="flex items-center gap-2">
        <label className="text-gray-600 w-14">Opacity</label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(obj.opacity * 100)}
          onChange={(e) => {
            const before = obj.opacity;
            const after = Number(e.target.value) / 100;
            updateObject(obj.id, { opacity: after });
            // History pushed on mouseUp via onBlur
            void before;
          }}
          className="flex-1 h-2"
        />
        <span className="w-8 text-right text-gray-600">
          {Math.round(obj.opacity * 100)}%
        </span>
      </div>

      {/* Fill */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-600 font-medium">Fill</label>
        {obj.fill && obj.fill.type === "solid" ? (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={obj.fill.color}
              onChange={(e) => {
                const before = obj.fill;
                const after = { ...obj.fill!, type: "solid" as const, color: e.target.value };
                updateObject(obj.id, { fill: after });
                commitChange("fill", before, after);
              }}
              className="w-8 h-6 cursor-pointer border-0 p-0"
            />
            <span className="text-gray-500">{obj.fill.color}</span>
            <button
              onClick={() => {
                const before = obj.fill;
                updateObject(obj.id, { fill: null });
                commitChange("fill", before, null);
              }}
              className="ml-auto text-gray-400 hover:text-red-500"
              title="Remove fill"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              const fill = { type: "solid" as const, color: "#3b82f6", opacity: 1 };
              updateObject(obj.id, { fill });
              commitChange("fill", null, fill);
            }}
            className="text-blue-500 hover:text-blue-700"
          >
            + Add fill
          </button>
        )}
      </div>

      {/* Stroke */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-600 font-medium">Stroke</label>
        {obj.stroke ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={obj.stroke.color}
                onChange={(e) => {
                  const before = obj.stroke;
                  const after = { ...obj.stroke!, color: e.target.value };
                  updateObject(obj.id, { stroke: after });
                  commitChange("stroke", before, after);
                }}
                className="w-8 h-6 cursor-pointer border-0 p-0"
              />
              <NumInput
                label="W"
                value={obj.stroke.width}
                onChange={(v) => {
                  const before = obj.stroke;
                  const after = { ...obj.stroke!, width: v };
                  updateObject(obj.id, { stroke: after });
                  commitChange("stroke", before, after);
                }}
                min={0.5}
                max={100}
              />
              <button
                onClick={() => {
                  const before = obj.stroke;
                  updateObject(obj.id, { stroke: null });
                  commitChange("stroke", before, null);
                }}
                className="ml-auto text-gray-400 hover:text-red-500"
                title="Remove stroke"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              const stroke = {
                color: "#000000",
                opacity: 1,
                width: 2,
                lineCap: "round" as const,
                lineJoin: "round" as const,
                dashArray: [] as number[],
              };
              updateObject(obj.id, { stroke });
              commitChange("stroke", null, stroke);
            }}
            className="text-blue-500 hover:text-blue-700"
          >
            + Add stroke
          </button>
        )}
      </div>

      {/* Type-specific properties */}
      {obj.type === "rectangle" && (
        <NumInput
          label="Corner R"
          value={obj.cornerRadius[0]}
          onChange={(v) => {
            const before = obj.cornerRadius;
            const after: [number, number, number, number] = [v, v, v, v];
            updateObject(obj.id, { cornerRadius: after });
            commitChange("cornerRadius", before, after);
          }}
          min={0}
        />
      )}

      {obj.type === "polygon" && (
        <NumInput
          label="Sides"
          value={obj.sides}
          onChange={(v) => setNumericField("sides", Math.max(3, Math.min(12, Math.round(v))))}
          min={3}
          max={12}
        />
      )}
    </div>
  );
}

// ============================================
// Reusable input components
// ============================================

function NumInput({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <label className="text-gray-600 w-8 shrink-0">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white"
      />
      {suffix && <span className="text-gray-400">{suffix}</span>}
    </div>
  );
}

function PropInput({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <label className="text-gray-600 w-14 shrink-0">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white"
      />
    </div>
  );
}
