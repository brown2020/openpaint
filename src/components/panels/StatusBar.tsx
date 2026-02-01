"use client";

import { useCanvasStore } from "@/store/canvasStore";
import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";

/**
 * Status bar showing canvas info, cursor position, and sync status
 */
export function StatusBar() {
  const { cursorPosition, canvasSize, zoom, activeTool } = useCanvasStore();
  const { syncStatus, lastSyncTime, isDirty, currentProjectName } = useProjectStore();
  const { user } = useAuthStore();

  const formatLastSync = () => {
    if (!lastSyncTime) return "";
    const date = new Date(lastSyncTime);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSyncStatusDisplay = () => {
    if (!user) return null;

    switch (syncStatus) {
      case "syncing":
        return (
          <span className="flex items-center gap-1 text-blue-600">
            <svg
              className="w-3 h-3 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Saving...
          </span>
        );
      case "synced":
        return isDirty ? (
          <span className="flex items-center gap-1 text-yellow-600">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            Unsaved changes
          </span>
        ) : (
          <span className="flex items-center gap-1 text-green-600">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Saved {formatLastSync()}
          </span>
        );
      case "error":
        return (
          <span className="flex items-center gap-1 text-red-600">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Sync error
          </span>
        );
      case "offline":
        return (
          <span className="flex items-center gap-1 text-gray-500">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                clipRule="evenodd"
              />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
            Offline
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-gray-200 border-t border-gray-300 text-xs text-gray-600">
      {/* Left: Cursor position and canvas info */}
      <div className="flex items-center gap-4">
        <span>
          Position:{" "}
          {cursorPosition
            ? `${Math.round(cursorPosition.x)}, ${Math.round(cursorPosition.y)}`
            : "—, —"}
        </span>
        <span>
          Canvas: {canvasSize.width} × {canvasSize.height}
        </span>
      </div>

      {/* Center: Project name and sync status */}
      <div className="flex items-center gap-4">
        {currentProjectName && (
          <span className="font-medium">{currentProjectName}</span>
        )}
        {getSyncStatusDisplay()}
      </div>

      {/* Right: Tool and zoom */}
      <div className="flex items-center gap-4">
        <span className="capitalize">Tool: {activeTool}</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
