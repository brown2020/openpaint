"use client";

import { useRef, useEffect, useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { VectorCanvas } from "./VectorCanvas";

/**
 * Canvas container with zoom and pan support
 */
export function CanvasContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { zoom, setZoom, setPan } = useCanvasStore();

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(10, zoom * delta));
        setZoom(newZoom);
      }
    },
    [zoom, setZoom],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const listener = handleWheel;
    container.addEventListener("wheel", listener, { passive: false });
    return () => {
      container.removeEventListener("wheel", listener);
    };
  }, [handleWheel]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 1) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startPan = { ...useCanvasStore.getState().pan };
      const currentZoom = useCanvasStore.getState().zoom;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        setPan({
          x: startPan.x + dx / currentZoom,
          y: startPan.y + dy / currentZoom,
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [setPan],
  );

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Drawing canvas"
      className="flex-1 overflow-hidden bg-gray-300"
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <VectorCanvas />
    </div>
  );
}
