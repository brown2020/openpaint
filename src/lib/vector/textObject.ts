import { v4 as uuidv4 } from "uuid";
import { createTransform, createSolidFill, type TextObject } from "@/types/vector";
import type { TextOptions } from "@/types";

export interface BuildTextObjectInput {
  point: { x: number; y: number };
  content: string;
  textOptions: TextOptions;
  fillColor: string;
  fillEnabled: boolean;
  name?: string;
}

/**
 * Create a vector text object from tool defaults and canvas position.
 */
export function buildTextObject(input: BuildTextObjectInput): TextObject {
  const trimmed = input.content.trim();
  return {
    id: uuidv4(),
    type: "text",
    name: input.name ?? "Text",
    transform: createTransform(input.point.x, input.point.y),
    fill: input.fillEnabled
      ? createSolidFill(input.fillColor, 1)
      : createSolidFill("#000000", 1),
    stroke: null,
    opacity: 1,
    visible: true,
    locked: false,
    content: trimmed,
    fontFamily: input.textOptions.fontFamily,
    fontSize: input.textOptions.fontSize,
    fontWeight: input.textOptions.fontWeight,
    fontStyle: input.textOptions.fontStyle,
    textAlign: input.textOptions.textAlign,
    lineHeight: 1.2,
  };
}

/** Map canvas text align to toolbar TextOptions values. */
export function normalizeTextAlign(
  align: CanvasTextAlign,
): TextOptions["textAlign"] {
  if (align === "center") return "center";
  if (align === "right" || align === "end") return "right";
  return "left";
}

export function textStyleFromOptions(
  textOptions: TextOptions,
): Pick<
  TextObject,
  "fontFamily" | "fontSize" | "fontWeight" | "fontStyle" | "textAlign"
> {
  return {
    fontFamily: textOptions.fontFamily,
    fontSize: textOptions.fontSize,
    fontWeight: textOptions.fontWeight,
    fontStyle: textOptions.fontStyle,
    textAlign: textOptions.textAlign,
  };
}
