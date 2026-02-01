"use client";

import { useLayers } from "@/hooks/useLayers";

/**
 * Layers panel for managing canvas layers
 */
export function LayersPanel() {
  const {
    layers,
    activeLayerId,
    addLayer,
    deleteLayer,
    setActiveLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    setLayerOpacity,
    moveLayerUp,
    moveLayerDown,
    duplicateLayer,
    mergeDown,
    canMergeDown,
    canDeleteLayer,
  } = useLayers();

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-200 border-b border-gray-300">
        <span className="text-sm font-medium text-gray-700">Layers</span>
        <div className="flex gap-1">
          <button
            onClick={addLayer}
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-300 rounded"
            title="Add Layer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => deleteLayer(activeLayerId)}
            disabled={!canDeleteLayer()}
            className={`p-1 rounded ${
              canDeleteLayer()
                ? "text-gray-600 hover:text-red-600 hover:bg-gray-300"
                : "text-gray-400 cursor-not-allowed"
            }`}
            title="Delete Layer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto">
        {[...layers].reverse().map((layer, reversedIndex) => {
          const isActive = layer.id === activeLayerId;

          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex items-center gap-2 px-2 py-2 border-b border-gray-200 cursor-pointer ${
                isActive ? "bg-blue-100" : "hover:bg-gray-50"
              }`}
            >
              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                className={`p-1 rounded ${
                  layer.visible ? "text-gray-700" : "text-gray-400"
                }`}
                title={layer.visible ? "Hide Layer" : "Show Layer"}
              >
                {layer.visible ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>

              {/* Lock toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerLock(layer.id);
                }}
                className={`p-1 rounded ${
                  layer.locked ? "text-yellow-600" : "text-gray-400"
                }`}
                title={layer.locked ? "Unlock Layer" : "Lock Layer"}
              >
                {layer.locked ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              {/* Layer name */}
              <span className="flex-1 text-sm truncate">{layer.name}</span>

              {/* Opacity */}
              <span className="text-xs text-gray-500">
                {Math.round(layer.opacity * 100)}%
              </span>

              {/* Layer actions */}
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayerUp(layer.id);
                  }}
                  disabled={reversedIndex === 0}
                  className={`p-1 rounded ${
                    reversedIndex === 0
                      ? "text-gray-300"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  title="Move Up"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayerDown(layer.id);
                  }}
                  disabled={reversedIndex === layers.length - 1}
                  className={`p-1 rounded ${
                    reversedIndex === layers.length - 1
                      ? "text-gray-300"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  title="Move Down"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Layer opacity slider for active layer */}
      {layers.find(l => l.id === activeLayerId) && (
        <div className="px-3 py-2 border-t border-gray-300 bg-gray-200">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Opacity</label>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round((layers.find(l => l.id === activeLayerId)?.opacity || 1) * 100)}
              onChange={(e) => setLayerOpacity(activeLayerId, Number(e.target.value) / 100)}
              className="flex-1"
            />
            <span className="text-xs text-gray-600 w-8 text-right">
              {Math.round((layers.find(l => l.id === activeLayerId)?.opacity || 1) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Layer actions */}
      <div className="flex gap-1 px-2 py-2 border-t border-gray-300 bg-gray-200">
        <button
          onClick={() => duplicateLayer(activeLayerId)}
          className="flex-1 text-xs py-1 px-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
          title="Duplicate Layer"
        >
          Duplicate
        </button>
        <button
          onClick={mergeDown}
          disabled={!canMergeDown(activeLayerId)}
          className={`flex-1 text-xs py-1 px-2 rounded border ${
            canMergeDown(activeLayerId)
              ? "bg-white border-gray-300 hover:bg-gray-50"
              : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          title="Merge Down"
        >
          Merge Down
        </button>
      </div>
    </div>
  );
}
