"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useLayers } from "@/hooks/useLayers";

interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onExport: () => void;
  onNew: () => void;
  onOpen: () => void;
}

/**
 * Top toolbar with file and edit actions
 */
export function Toolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onExport,
  onNew,
  onOpen,
}: ToolbarProps) {
  const { zoom, zoomIn, zoomOut, resetZoom } = useCanvasStore();
  const { getActiveLayerCanvas } = useLayers();

  const handleClear = useCallback(() => {
    const canvas = getActiveLayerCanvas();
    if (!canvas) return;

    if (confirm("Are you sure you want to clear the current layer?")) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [getActiveLayerCanvas]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white">
      {/* Logo/Title */}
      <h1 className="text-lg font-bold mr-4">OpenPaint</h1>

      {/* File operations */}
      <div className="flex items-center gap-1 border-r border-gray-600 pr-2 mr-2">
        <ToolbarButton onClick={onNew} title="New (Ctrl+N)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onOpen} title="Open">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onSave} title="Save (Ctrl+S)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onExport} title="Export (Ctrl+E)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Edit operations */}
      <div className="flex items-center gap-1 border-r border-gray-600 pr-2 mr-2">
        <ToolbarButton onClick={onUndo} title="Undo (Ctrl+Z)" disabled={!canUndo}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onRedo} title="Redo (Ctrl+Shift+Z)" disabled={!canRedo}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={handleClear} title="Clear Layer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </ToolbarButton>
      </div>

      {/* View controls */}
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={zoomOut} title="Zoom Out (Ctrl+-)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </ToolbarButton>
        <span className="text-sm px-2 min-w-16 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton onClick={zoomIn} title="Zoom In (Ctrl++)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={resetZoom} title="Reset Zoom (Ctrl+0)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Help */}
      <div className="text-xs text-gray-400">
        Press B for Brush, E for Eraser, [ ] for size
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, title, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded transition-colors ${
        disabled
          ? "text-gray-500 cursor-not-allowed"
          : "text-white hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
