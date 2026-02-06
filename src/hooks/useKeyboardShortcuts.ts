"use client";

import { useEffect, useCallback, useRef } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useDocumentStore } from "@/store/documentStore";
import type { ToolType } from "@/types";

interface KeyboardShortcutsOptions {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onNewLayer?: () => void;
  onDeleteLayer?: () => void;
  enabled?: boolean;
}

// Tool shortcuts mapping
const TOOL_SHORTCUTS: Record<string, ToolType> = {
  v: "selection",
  r: "rectangle",
  o: "ellipse",
  l: "line",
  b: "brush",
  e: "eraser",
  g: "fill",
  i: "eyedropper",
  t: "text",
};

/** Get the keyboard shortcut letter for a tool (for UI display) */
export function getToolShortcut(tool: ToolType): string | null {
  for (const [key, t] of Object.entries(TOOL_SHORTCUTS)) {
    if (t === tool) return key.toUpperCase();
  }
  return null;
}

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const {
    onUndo,
    onRedo,
    onSave,
    onExport,
    onNewLayer,
    onDeleteLayer,
    enabled = true,
  } = options;

  const {
    setActiveTool,
    setBrushSize,
    setBrushOpacity,
    brushSize,
    brushOpacity,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useCanvasStore();

  // Nudge debounce state — kept in refs to survive re-renders
  const nudgeBeforeRef = useRef<Map<string, { x: number; y: number }> | null>(null);
  const nudgeTimerRef = useRef<number | null>(null);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't handle shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Undo: Ctrl+Z
      if (ctrl && !shift && key === "z") {
        e.preventDefault();
        onUndo?.();
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((ctrl && shift && key === "z") || (ctrl && key === "y")) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // Save: Ctrl+S
      if (ctrl && !shift && key === "s") {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Export: Ctrl+E
      if (ctrl && !shift && key === "e") {
        e.preventDefault();
        onExport?.();
        return;
      }

      // New Layer: Ctrl+Shift+N
      if (ctrl && shift && key === "n") {
        e.preventDefault();
        onNewLayer?.();
        return;
      }

      // Delete: Delete/Backspace — remove selected vector objects
      if (key === "delete" || key === "backspace") {
        e.preventDefault();
        const docStore = useDocumentStore.getState();
        const selected = docStore.selectedObjectIds;
        if (selected.length > 0) {
          const ops = [];
          for (const id of selected) {
            const obj = docStore.getObject(id);
            const layerId = docStore.getObjectLayerId(id);
            if (obj && layerId) {
              const layer = docStore.layers.find((l) => l.id === layerId);
              const index = layer?.objects.findIndex((o) => o.id === id) ?? 0;
              ops.push({ type: "remove-object" as const, layerId, object: obj, index });
            }
          }
          // Remove objects (in reverse order to preserve indices)
          for (const id of [...selected].reverse()) {
            docStore.removeObject(id);
          }
          if (ops.length > 0) docStore.pushHistory("Delete objects", ops);
        } else if (shift) {
          onDeleteLayer?.();
        }
        return;
      }

      // Arrow keys: nudge selected objects
      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        const docStore = useDocumentStore.getState();
        if (docStore.selectedObjectIds.length > 0) {
          e.preventDefault();

          // Capture "before" transforms on first nudge of a sequence
          if (nudgeBeforeRef.current === null) {
            nudgeBeforeRef.current = new Map();
            for (const id of docStore.selectedObjectIds) {
              const obj = docStore.getObject(id);
              if (obj) nudgeBeforeRef.current.set(id, { x: obj.transform.x, y: obj.transform.y });
            }
          }

          const step = shift ? 10 : 1;
          const dx = key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
          const dy = key === "arrowup" ? -step : key === "arrowdown" ? step : 0;
          for (const id of docStore.selectedObjectIds) {
            const obj = docStore.getObject(id);
            if (obj) {
              docStore.updateObject(id, {
                transform: { ...obj.transform, x: obj.transform.x + dx, y: obj.transform.y + dy },
              });
            }
          }

          // Debounce: commit history after 500ms pause
          if (nudgeTimerRef.current !== null) clearTimeout(nudgeTimerRef.current);
          nudgeTimerRef.current = window.setTimeout(() => {
            const ds = useDocumentStore.getState();
            const before = nudgeBeforeRef.current;
            if (before) {
              const ops = [];
              for (const id of ds.selectedObjectIds) {
                const obj = ds.getObject(id);
                const b = before.get(id);
                const layerId = ds.getObjectLayerId(id);
                if (obj && b && layerId) {
                  ops.push({
                    type: "modify-object" as const,
                    objectId: id,
                    layerId,
                    before: { transform: { ...obj.transform, x: b.x, y: b.y } },
                    after: { transform: { ...obj.transform } },
                  });
                }
              }
              if (ops.length > 0) ds.pushHistory("Nudge objects", ops);
            }
            nudgeBeforeRef.current = null;
            nudgeTimerRef.current = null;
          }, 500);
        }
        return;
      }

      // X: swap fill/stroke colors
      if (!ctrl && !shift && !e.altKey && key === "x") {
        e.preventDefault();
        useCanvasStore.getState().swapFillStroke();
        return;
      }

      // /: toggle fill on/off
      if (!ctrl && !shift && !e.altKey && key === "/") {
        e.preventDefault();
        const cs = useCanvasStore.getState();
        cs.setFillEnabled(!cs.fillEnabled);
        return;
      }

      // Zoom shortcuts
      if (ctrl && (key === "=" || key === "+")) {
        e.preventDefault();
        zoomIn();
        return;
      }

      if (ctrl && key === "-") {
        e.preventDefault();
        zoomOut();
        return;
      }

      if (ctrl && key === "0") {
        e.preventDefault();
        resetZoom();
        return;
      }

      // Brush size: [ and ]
      if (key === "[") {
        e.preventDefault();
        if (shift) {
          // Decrease opacity
          setBrushOpacity(Math.max(0, brushOpacity - 0.1));
        } else {
          // Decrease size
          setBrushSize(Math.max(1, brushSize - (brushSize > 10 ? 5 : 1)));
        }
        return;
      }

      if (key === "]") {
        e.preventDefault();
        if (shift) {
          // Increase opacity
          setBrushOpacity(Math.min(1, brushOpacity + 0.1));
        } else {
          // Increase size
          setBrushSize(Math.min(100, brushSize + (brushSize >= 10 ? 5 : 1)));
        }
        return;
      }

      // Tool shortcuts (only when no modifiers)
      if (!ctrl && !shift && !e.altKey) {
        const tool = TOOL_SHORTCUTS[key];
        if (tool) {
          e.preventDefault();
          setActiveTool(tool);
          return;
        }
      }
    },
    [
      enabled,
      onUndo,
      onRedo,
      onSave,
      onExport,
      onNewLayer,
      onDeleteLayer,
      setActiveTool,
      setBrushSize,
      setBrushOpacity,
      brushSize,
      brushOpacity,
      zoomIn,
      zoomOut,
      resetZoom,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    // Expose the tool shortcuts for UI hints
    toolShortcuts: TOOL_SHORTCUTS,
  };
}

