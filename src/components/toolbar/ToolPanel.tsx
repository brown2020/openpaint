"use client";

import { useCanvasStore } from "@/store/canvasStore";
import { getToolShortcut } from "@/hooks/useKeyboardShortcuts";
import type { ToolType } from "@/types";

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
}

function ToolButton({ tool, icon, label }: ToolButtonProps) {
  const { activeTool, setActiveTool } = useCanvasStore();
  const shortcut = getToolShortcut(tool);
  const isActive = activeTool === tool;

  return (
    <button
      onClick={() => setActiveTool(tool)}
      className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
        isActive
          ? "bg-blue-500 text-white"
          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
      }`}
      title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
    >
      {icon}
    </button>
  );
}

/**
 * Tool panel with tool selection buttons
 */
export function ToolPanel() {
  return (
    <div className="flex flex-col gap-1 p-2 bg-gray-100 rounded-lg">
      <ToolButton
        tool="brush"
        label="Brush"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        }
      />
      <ToolButton
        tool="eraser"
        label="Eraser"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        }
      />

      <div className="border-t border-gray-300 my-1" />

      <ToolButton
        tool="line"
        label="Line"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20L20 4" />
          </svg>
        }
      />
      <ToolButton
        tool="rectangle"
        label="Rectangle"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="4" y="6" width="16" height="12" strokeWidth={2} />
          </svg>
        }
      />
      <ToolButton
        tool="ellipse"
        label="Ellipse"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <ellipse cx="12" cy="12" rx="8" ry="5" strokeWidth={2} />
          </svg>
        }
      />

      <div className="border-t border-gray-300 my-1" />

      <ToolButton
        tool="fill"
        label="Fill"
        icon={
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.228 18.732l1.768-1.768 1.767 1.768a2.5 2.5 0 11-3.535 0zM8.878 1.08l11.314 11.313a1 1 0 010 1.415l-8.485 8.485a1 1 0 01-1.414 0l-8.485-8.485a1 1 0 010-1.415l7.778-7.778-2.122-2.121L8.878 1.08zM11 6.03L3.929 13.1H18.07L11 6.03z" />
          </svg>
        }
      />
      <ToolButton
        tool="eyedropper"
        label="Eyedropper"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        }
      />

      <div className="border-t border-gray-300 my-1" />

      <ToolButton
        tool="text"
        label="Text"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        }
      />
      <ToolButton
        tool="selection"
        label="Selection"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} strokeDasharray="4 2" d="M4 6h16M4 18h16M4 6v12M20 6v12" />
          </svg>
        }
      />
    </div>
  );
}
