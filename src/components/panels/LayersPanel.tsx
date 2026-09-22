"use client";

import { useCallback, useState } from "react";
import { computeObjectReorder } from "@/lib/vector/layerObjectReorder";
import { useDocumentStore } from "@/store/documentStore";
import type { VectorLayer } from "@/types/vector";
import { ObjectRow, EyeIcon, LockIcon } from "./LayerObjectRow";

/**
 * Layers panel — vector layers plus object list for the active layer.
 */
export function LayersPanel() {
  const layers = useDocumentStore((s) => s.layers);
  const activeLayerId = useDocumentStore((s) => s.activeLayerId);
  const selectedObjectIds = useDocumentStore((s) => s.selectedObjectIds);
  const addLayer = useDocumentStore((s) => s.addLayer);
  const removeLayer = useDocumentStore((s) => s.removeLayer);
  const setActiveLayer = useDocumentStore((s) => s.setActiveLayer);
  const updateLayer = useDocumentStore((s) => s.updateLayer);
  const reorderLayer = useDocumentStore((s) => s.reorderLayer);
  const selectObject = useDocumentStore((s) => s.selectObject);
  const updateObject = useDocumentStore((s) => s.updateObject);
  const removeObject = useDocumentStore((s) => s.removeObject);
  const reorderObject = useDocumentStore((s) => s.reorderObject);

  const canDeleteLayer = layers.length > 1;
  const selectedSet = new Set(selectedObjectIds);

  const handleMoveUp = (index: number) => {
    if (index < layers.length - 1) {
      reorderLayer(index, index + 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index > 0) {
      reorderLayer(index, index - 1);
    }
  };

  const handleSelectObject = useCallback(
    (layerId: string, objectId: string) => {
      setActiveLayer(layerId);
      selectObject(objectId);
    },
    [setActiveLayer, selectObject],
  );

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-200 border-b border-gray-300">
        <span className="text-sm font-medium text-gray-700">Layers</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => addLayer()}
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-300 rounded"
            title="Add Layer"
            aria-label="Add layer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => removeLayer(activeLayerId)}
            disabled={!canDeleteLayer}
            className={`p-1 rounded ${
              canDeleteLayer
                ? "text-gray-600 hover:text-red-600 hover:bg-gray-300"
                : "text-gray-400 cursor-not-allowed"
            }`}
            title="Delete Layer"
            aria-label="Delete active layer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {[...layers].reverse().map((layer) => {
          const isActive = layer.id === activeLayerId;
          const actualIndex = layers.findIndex((l) => l.id === layer.id);
          const isTop = actualIndex === layers.length - 1;
          const isBottom = actualIndex === 0;
          const layerLocked = layer.locked;

          return (
            <div key={layer.id} className="border-b border-gray-200">
              <div
                aria-current={isActive ? "true" : undefined}
                className={`flex items-center gap-2 px-2 py-2 ${
                  isActive ? "bg-blue-100" : "hover:bg-gray-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                  className={`p-1 rounded ${layer.visible ? "text-gray-700" : "text-gray-400"}`}
                  title={layer.visible ? "Hide layer" : "Show layer"}
                  aria-label={layer.visible ? "Hide layer" : "Show layer"}
                >
                  <EyeIcon visible={layer.visible} />
                </button>

                <button
                  type="button"
                  onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
                  className={`p-1 rounded ${layer.locked ? "text-yellow-600" : "text-gray-400"}`}
                  title={layer.locked ? "Unlock layer" : "Lock layer"}
                  aria-label={layer.locked ? "Unlock layer" : "Lock layer"}
                >
                  <LockIcon locked={layer.locked} />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveLayer(layer.id)}
                  className="flex-1 min-w-0 text-left"
                  aria-pressed={isActive}
                >
                  <span className="text-sm truncate block">{layer.name}</span>
                  <span className="text-[10px] text-gray-400">
                    {layer.objects.length} object{layer.objects.length !== 1 ? "s" : ""}
                  </span>
                </button>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(actualIndex);
                    }}
                    disabled={isTop}
                    className={`p-1 rounded ${
                      isTop ? "text-gray-300" : "text-gray-500 hover:text-gray-700"
                    }`}
                    title="Move layer up"
                    aria-label="Move layer up"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown(actualIndex);
                    }}
                    disabled={isBottom}
                    className={`p-1 rounded ${
                      isBottom ? "text-gray-300" : "text-gray-500 hover:text-gray-700"
                    }`}
                    title="Move layer down"
                    aria-label="Move layer down"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {isActive && (
                <ObjectList
                  layer={layer}
                  layerLocked={layerLocked}
                  selectedSet={selectedSet}
                  onSelectObject={handleSelectObject}
                  onToggleVisible={(objectId, visible) =>
                    updateObject(objectId, { visible })
                  }
                  onToggleLocked={(objectId, locked) =>
                    updateObject(objectId, { locked })
                  }
                  onDeleteObject={removeObject}
                  onReorderObject={reorderObject}
                />
              )}
            </div>
          );
        })}
      </div>

      {layers.find((l) => l.id === activeLayerId) && (
        <div className="px-3 py-2 border-t border-gray-300 bg-gray-200">
          <div className="flex items-center gap-2">
            <label htmlFor="layer-opacity" className="text-xs text-gray-600">
              Opacity
            </label>
            <input
              id="layer-opacity"
              type="range"
              min="0"
              max="100"
              value={Math.round(
                (layers.find((l) => l.id === activeLayerId)?.opacity ?? 1) * 100,
              )}
              onChange={(e) =>
                updateLayer(activeLayerId, {
                  opacity: Number(e.target.value) / 100,
                })
              }
              className="flex-1"
            />
            <span className="text-xs text-gray-600 w-8 text-right">
              {Math.round(
                (layers.find((l) => l.id === activeLayerId)?.opacity ?? 1) * 100,
              )}
              %
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ObjectList({
  layer,
  layerLocked,
  selectedSet,
  onSelectObject,
  onToggleVisible,
  onToggleLocked,
  onDeleteObject,
  onReorderObject,
}: {
  layer: VectorLayer;
  layerLocked: boolean;
  selectedSet: Set<string>;
  onSelectObject: (layerId: string, objectId: string) => void;
  onToggleVisible: (objectId: string, visible: boolean) => void;
  onToggleLocked: (objectId: string, locked: boolean) => void;
  onDeleteObject: (objectId: string) => void;
  onReorderObject: (
    layerId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
}) {
  const [dragObjectId, setDragObjectId] = useState<string | null>(null);
  const [dropUiIndex, setDropUiIndex] = useState<number | null>(null);

  const finishDrag = useCallback(() => {
    setDragObjectId(null);
    setDropUiIndex(null);
  }, []);

  const handleDropOnRow = useCallback(
    (targetUiIndex: number) => {
      if (layerLocked || !dragObjectId) {
        finishDrag();
        return;
      }

      const fromArrayIndex = layer.objects.findIndex((o) => o.id === dragObjectId);
      const indices = computeObjectReorder(
        layer.objects.length,
        fromArrayIndex,
        targetUiIndex,
      );
      if (indices) {
        onReorderObject(layer.id, indices.fromIndex, indices.toIndex);
      }
      finishDrag();
    },
    [
      dragObjectId,
      finishDrag,
      layer.id,
      layer.objects,
      layerLocked,
      onReorderObject,
    ],
  );

  if (layer.objects.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
        No objects on this layer
      </p>
    );
  }

  const objectsTopFirst = [...layer.objects].reverse();

  return (
    <ul
      className="bg-gray-50 border-t border-gray-100"
      aria-label={`Objects on ${layer.name}`}
    >
      {objectsTopFirst.map((obj, uiIndex) => (
        <ObjectRow
          key={obj.id}
          layerId={layer.id}
          obj={obj}
          layerLocked={layerLocked}
          isSelected={selectedSet.has(obj.id)}
          isDragSource={dragObjectId === obj.id}
          isDropTarget={dropUiIndex === uiIndex && dragObjectId !== obj.id}
          onSelectObject={onSelectObject}
          onToggleVisible={onToggleVisible}
          onToggleLocked={onToggleLocked}
          onDeleteObject={onDeleteObject}
          onDragStart={() => setDragObjectId(obj.id)}
          onDragEnter={() => setDropUiIndex(uiIndex)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={() => handleDropOnRow(uiIndex)}
          onDragEnd={finishDrag}
        />
      ))}
    </ul>
  );
}
