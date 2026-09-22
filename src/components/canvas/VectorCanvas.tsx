"use client";

import { TextEditor } from "./TextEditor";
import { useVectorCanvasController } from "@/hooks/useVectorCanvasController";

/**
 * Vector canvas — renders scene graph and handles tool interactions.
 */
export function VectorCanvas() {
  const {
    mainCanvasRef,
    overlayCanvasRef,
    eventCanvasRef,
    canvasSize,
    zoom,
    pan,
    fillColor,
    textOptions,
    textSession,
    textDraft,
    setTextDraft,
    commitTextEdit,
    cancelTextEdit,
    getCursor,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
    handleMouseLeave,
  } = useVectorCanvasController();

  return (
    <div
      className="relative bg-gray-200 overflow-hidden"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="relative shadow-lg"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: "center center",
        }}
      >
        <canvas
          ref={mainCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0 pointer-events-none"
        />

        <canvas
          ref={overlayCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0 pointer-events-none"
        />

        {textSession && (
          <TextEditor
            x={textSession.point.x}
            y={textSession.point.y}
            value={textDraft}
            onChange={setTextDraft}
            onCommit={commitTextEdit}
            onCancel={cancelTextEdit}
            textOptions={textOptions}
            fillColor={fillColor}
          />
        )}

        <canvas
          ref={eventCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0"
          style={{
            cursor: getCursor(),
            touchAction: "none",
            pointerEvents: textSession ? "none" : "auto",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
}
