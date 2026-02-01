"use client";

import { useCallback, useRef } from "react";
import { useCanvasStore } from "@/store/canvasStore";

/**
 * Hook for managing canvas history (undo/redo)
 * Uses canvas snapshots for state management
 */
export function useHistory() {
  const {
    addToHistory,
    undo: storeUndo,
    redo: storeRedo,
    canUndo,
    canRedo,
    history,
    historyIndex,
    activeLayerId,
  } = useCanvasStore();

  const snapshotRef = useRef<Map<string, string>>(new Map());

  /**
   * Save a snapshot of the current canvas state
   */
  const saveSnapshot = useCallback(
    (canvas: HTMLCanvasElement) => {
      const snapshot = canvas.toDataURL("image/png");
      snapshotRef.current.set(activeLayerId, snapshot);

      addToHistory({
        type: "stroke",
        layerId: activeLayerId,
        snapshot,
      });
    },
    [activeLayerId, addToHistory]
  );

  /**
   * Save snapshot before starting a drawing operation
   */
  const saveBeforeOperation = useCallback(
    (canvas: HTMLCanvasElement) => {
      const snapshot = canvas.toDataURL("image/png");
      snapshotRef.current.set(`before-${activeLayerId}`, snapshot);
    },
    [activeLayerId]
  );

  /**
   * Commit the operation to history (call after operation completes)
   */
  const commitOperation = useCallback(
    (canvas: HTMLCanvasElement, type: "stroke" | "fill" | "shape" | "text" = "stroke") => {
      const beforeSnapshot = snapshotRef.current.get(`before-${activeLayerId}`);
      if (!beforeSnapshot) return;

      const afterSnapshot = canvas.toDataURL("image/png");

      // Only add to history if the canvas actually changed
      if (beforeSnapshot !== afterSnapshot) {
        addToHistory({
          type,
          layerId: activeLayerId,
          snapshot: beforeSnapshot, // Save the "before" state for undo
        });
      }

      snapshotRef.current.delete(`before-${activeLayerId}`);
    },
    [activeLayerId, addToHistory]
  );

  /**
   * Restore a specific snapshot to the canvas
   */
  const restoreSnapshot = useCallback(
    async (canvas: HTMLCanvasElement, snapshot: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve();
        };
        img.onerror = reject;
        img.src = snapshot;
      });
    },
    []
  );

  /**
   * Get the snapshot to restore for undo
   */
  const getUndoSnapshot = useCallback(() => {
    if (historyIndex >= 0 && historyIndex < history.length) {
      return history[historyIndex];
    }
    return null;
  }, [history, historyIndex]);

  /**
   * Get the snapshot to restore for redo
   */
  const getRedoSnapshot = useCallback(() => {
    if (historyIndex < history.length - 1) {
      return history[historyIndex + 1];
    }
    return null;
  }, [history, historyIndex]);

  /**
   * Perform undo operation
   */
  const undo = useCallback(
    async (getCanvas: (layerId: string) => HTMLCanvasElement | undefined) => {
      const entry = getUndoSnapshot();
      if (!entry || !canUndo()) return;

      const canvas = getCanvas(entry.layerId);
      if (canvas) {
        await restoreSnapshot(canvas, entry.snapshot);
      }

      storeUndo();
    },
    [getUndoSnapshot, canUndo, restoreSnapshot, storeUndo]
  );

  /**
   * Perform redo operation
   */
  const redo = useCallback(
    async (getCanvas: (layerId: string) => HTMLCanvasElement | undefined) => {
      storeRedo();

      const entry = getRedoSnapshot();
      if (!entry || !canRedo()) return;

      const canvas = getCanvas(entry.layerId);
      if (canvas) {
        await restoreSnapshot(canvas, entry.snapshot);
      }
    },
    [getRedoSnapshot, canRedo, restoreSnapshot, storeRedo]
  );

  return {
    saveSnapshot,
    saveBeforeOperation,
    commitOperation,
    restoreSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    historyIndex,
    historyLength: history.length,
  };
}
