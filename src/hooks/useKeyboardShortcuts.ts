"use client";

import { useEffect, useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
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
  b: "brush",
  e: "eraser",
  l: "line",
  r: "rectangle",
  u: "rectangle", // Alternative for rectangle
  o: "ellipse",
  g: "fill",
  i: "eyedropper",
  t: "text",
  m: "selection",
};

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

      // Delete: Delete key
      if (key === "delete" || key === "backspace") {
        // Only if not in an input field (already checked above)
        if (shift) {
          e.preventDefault();
          onDeleteLayer?.();
        }
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

/**
 * Get the shortcut key for a tool
 */
export function getToolShortcut(tool: ToolType): string | null {
  for (const [key, t] of Object.entries(TOOL_SHORTCUTS)) {
    if (t === tool) {
      return key.toUpperCase();
    }
  }
  return null;
}
