"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";

/**
 * Hook for layer management operations
 */
export function useLayers() {
  const {
    layers,
    activeLayerId,
    addLayer,
    deleteLayer,
    duplicateLayer,
    setActiveLayer,
    updateLayer,
    reorderLayers,
    mergeLayerDown,
    flattenLayers,
    registerLayerCanvas,
    unregisterLayerCanvas,
    getLayerCanvas,
  } = useCanvasStore();

  /**
   * Get the active layer
   */
  const getActiveLayer = useCallback(() => {
    return layers.find((l) => l.id === activeLayerId);
  }, [layers, activeLayerId]);

  /**
   * Get the active layer's canvas
   */
  const getActiveLayerCanvas = useCallback(() => {
    return getLayerCanvas(activeLayerId);
  }, [activeLayerId, getLayerCanvas]);

  /**
   * Get the index of a layer
   */
  const getLayerIndex = useCallback(
    (id: string) => {
      return layers.findIndex((l) => l.id === id);
    },
    [layers]
  );

  /**
   * Move a layer up in the stack
   */
  const moveLayerUp = useCallback(
    (id: string) => {
      const index = getLayerIndex(id);
      if (index < layers.length - 1) {
        reorderLayers(index, index + 1);
      }
    },
    [getLayerIndex, layers.length, reorderLayers]
  );

  /**
   * Move a layer down in the stack
   */
  const moveLayerDown = useCallback(
    (id: string) => {
      const index = getLayerIndex(id);
      if (index > 0) {
        reorderLayers(index, index - 1);
      }
    },
    [getLayerIndex, reorderLayers]
  );

  /**
   * Toggle layer visibility
   */
  const toggleLayerVisibility = useCallback(
    (id: string) => {
      const layer = layers.find((l) => l.id === id);
      if (layer) {
        updateLayer(id, { visible: !layer.visible });
      }
    },
    [layers, updateLayer]
  );

  /**
   * Toggle layer lock
   */
  const toggleLayerLock = useCallback(
    (id: string) => {
      const layer = layers.find((l) => l.id === id);
      if (layer) {
        updateLayer(id, { locked: !layer.locked });
      }
    },
    [layers, updateLayer]
  );

  /**
   * Rename a layer
   */
  const renameLayer = useCallback(
    (id: string, name: string) => {
      updateLayer(id, { name });
    },
    [updateLayer]
  );

  /**
   * Set layer opacity
   */
  const setLayerOpacity = useCallback(
    (id: string, opacity: number) => {
      updateLayer(id, { opacity: Math.max(0, Math.min(1, opacity)) });
    },
    [updateLayer]
  );

  /**
   * Merge the currently selected layer with the one below it
   */
  const mergeDown = useCallback(() => {
    const activeIndex = getLayerIndex(activeLayerId);
    if (activeIndex <= 0) return; // Can't merge bottom layer

    const activeCanvas = getLayerCanvas(activeLayerId);
    const belowLayer = layers[activeIndex - 1];
    const belowCanvas = getLayerCanvas(belowLayer.id);

    if (!activeCanvas || !belowCanvas) return;

    // Draw active layer onto the layer below
    const ctx = belowCanvas.getContext("2d");
    if (ctx) {
      const activeLayer = layers[activeIndex];
      ctx.globalAlpha = activeLayer.opacity;
      ctx.drawImage(activeCanvas, 0, 0);
      ctx.globalAlpha = 1;
    }

    // Remove the active layer
    mergeLayerDown(activeLayerId);
  }, [activeLayerId, getLayerIndex, getLayerCanvas, layers, mergeLayerDown]);

  /**
   * Flatten all visible layers into one
   */
  const flatten = useCallback(() => {
    if (layers.length <= 1) return;

    // Get all visible layer canvases
    const visibleLayers = layers.filter((l) => l.visible);
    if (visibleLayers.length === 0) return;

    // The flatten operation in the store will create a new layer
    // The actual compositing needs to happen in the component
    flattenLayers();
  }, [layers, flattenLayers]);

  /**
   * Composite all visible layers onto a single canvas
   */
  const compositeToCanvas = useCallback(
    (targetCanvas: HTMLCanvasElement) => {
      const ctx = targetCanvas.getContext("2d");
      if (!ctx) return;

      // Clear target canvas
      ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

      // Draw layers from bottom to top
      for (const layer of layers) {
        if (!layer.visible) continue;

        const layerCanvas = getLayerCanvas(layer.id);
        if (!layerCanvas) continue;

        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.drawImage(layerCanvas, 0, 0);
      }

      // Reset composite settings
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    },
    [layers, getLayerCanvas]
  );

  /**
   * Check if a layer can be merged down
   */
  const canMergeDown = useCallback(
    (id: string) => {
      const index = getLayerIndex(id);
      return index > 0;
    },
    [getLayerIndex]
  );

  /**
   * Check if layer can be deleted (must have at least one layer)
   */
  const canDeleteLayer = useCallback(() => {
    return layers.length > 1;
  }, [layers.length]);

  return {
    // State
    layers,
    activeLayerId,
    activeLayer: getActiveLayer(),

    // Actions
    addLayer,
    deleteLayer,
    duplicateLayer,
    setActiveLayer,
    updateLayer,
    renameLayer,
    setLayerOpacity,
    moveLayerUp,
    moveLayerDown,
    toggleLayerVisibility,
    toggleLayerLock,
    mergeDown,
    flatten,

    // Canvas operations
    registerLayerCanvas,
    unregisterLayerCanvas,
    getLayerCanvas,
    getActiveLayerCanvas,
    compositeToCanvas,

    // Helpers
    getLayerIndex,
    canMergeDown,
    canDeleteLayer,
  };
}
