"use client";

import { useEffect, useRef } from "react";
import type { TextOptions } from "@/types";

export interface TextEditorProps {
  x: number;
  y: number;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  textOptions: TextOptions;
  fillColor: string;
}

/**
 * On-canvas text input positioned in canvas coordinates (inside zoom/pan wrapper).
 */
export function TextEditor({
  x,
  y,
  value,
  onChange,
  onCommit,
  onCancel,
  textOptions,
  fillColor,
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      aria-label="Edit text"
      data-text-editor
      rows={1}
      className="absolute z-20 resize min-w-[8rem] max-w-[min(90%,480px)] p-0 m-0 border border-dashed border-blue-500 bg-white/90 outline-none focus:ring-2 focus:ring-blue-400"
      style={{
        left: x,
        top: y,
        fontFamily: textOptions.fontFamily,
        fontSize: textOptions.fontSize,
        fontWeight: textOptions.fontWeight,
        fontStyle: textOptions.fontStyle,
        textAlign: textOptions.textAlign,
        color: fillColor,
        lineHeight: 1.2,
      }}
    />
  );
}
