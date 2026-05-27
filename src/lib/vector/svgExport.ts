import type {
  Fill,
  PathObject,
  PathSegment,
  PolygonObject,
  RectangleObject,
  StrokeStyle,
  TextObject,
  Transform2D,
  VectorLayer,
  VectorObject,
} from "@/types/vector";

export interface SvgExportOptions {
  /** Canvas width in user units */
  width: number;
  /** Canvas height in user units */
  height: number;
  /** Background fill behind artwork (default transparent) */
  backgroundColor?: string;
}

/** Escape text for XML/SVG attribute or text node content */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Build SVG path `d` from path segments (matches canvas `buildPath` order) */
export function pathSegmentsToD(segments: PathSegment[]): string {
  const parts: string[] = [];
  for (const seg of segments) {
    switch (seg.type) {
      case "M":
        parts.push(`M ${seg.x} ${seg.y}`);
        break;
      case "L":
        parts.push(`L ${seg.x} ${seg.y}`);
        break;
      case "C":
        parts.push(
          `C ${seg.cp1x} ${seg.cp1y} ${seg.cp2x} ${seg.cp2y} ${seg.x} ${seg.y}`,
        );
        break;
      case "Q":
        parts.push(`Q ${seg.cpx} ${seg.cpy} ${seg.x} ${seg.y}`);
        break;
      case "Z":
        parts.push("Z");
        break;
    }
  }
  return parts.join(" ");
}

function transformToSvg(t: Transform2D): string {
  const parts: string[] = [`translate(${t.x},${t.y})`];
  if (t.rotation !== 0) {
    parts.push(`rotate(${t.rotation})`);
  }
  if (t.scaleX !== 1 || t.scaleY !== 1) {
    parts.push(`scale(${t.scaleX},${t.scaleY})`);
  }
  return parts.join(" ");
}

function solidFillAttrs(fill: Fill): string {
  if (fill.type !== "solid") return "";
  const opacity =
    fill.opacity < 1 ? ` fill-opacity="${fill.opacity}"` : "";
  return ` fill="${escapeXml(fill.color)}"${opacity}`;
}

function strokeAttrs(stroke: StrokeStyle): string {
  const opacity =
    stroke.opacity < 1 ? ` stroke-opacity="${stroke.opacity}"` : "";
  const dash =
    stroke.dashArray.length > 0
      ? ` stroke-dasharray="${stroke.dashArray.join(" ")}"`
      : "";
  return (
    ` stroke="${escapeXml(stroke.color)}"` +
    ` stroke-width="${stroke.width}"` +
    ` stroke-linecap="${stroke.lineCap}"` +
    ` stroke-linejoin="${stroke.lineJoin}"` +
    opacity +
    dash
  );
}

function paintAttrs(fill: Fill | null, stroke: StrokeStyle | null): string {
  let attrs = "";
  if (fill?.type === "solid") {
    attrs += solidFillAttrs(fill);
  }
  if (stroke) {
    attrs += strokeAttrs(stroke);
  }
  return attrs;
}

function opacityAttr(opacity: number): string {
  return opacity < 1 ? ` opacity="${opacity}"` : "";
}

function polygonPoints(sides: number, radius: number): string {
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = -Math.PI / 2;
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

function textAnchor(align: CanvasTextAlign): string {
  if (align === "center") return "middle";
  if (align === "right" || align === "end") return "end";
  return "start";
}

function objectToSvg(obj: VectorObject): string {
  if (!obj.visible) return "";

  const transform = ` transform="${escapeXml(transformToSvg(obj.transform))}"`;
  const op = opacityAttr(obj.opacity);
  const paint = paintAttrs(obj.fill, obj.stroke);

  switch (obj.type) {
    case "rectangle": {
      const rect = obj as RectangleObject;
      const [tl, tr, br, bl] = rect.cornerRadius;
      const hasRadius = tl > 0 || tr > 0 || br > 0 || bl > 0;
      const rx = hasRadius ? Math.max(tl, tr, br, bl) : 0;
      const ryAttr = hasRadius ? ` rx="${rx}" ry="${rx}"` : "";
      return `<rect x="0" y="0" width="${rect.width}" height="${rect.height}"${ryAttr}${transform}${op}${paint} />`;
    }
    case "ellipse":
      return `<ellipse cx="0" cy="0" rx="${obj.radiusX}" ry="${obj.radiusY}"${transform}${op}${paint} />`;
    case "line": {
      const linePaint = obj.stroke ? strokeAttrs(obj.stroke) : "";
      return `<line x1="0" y1="0" x2="${obj.endX}" y2="${obj.endY}"${transform}${op}${linePaint} />`;
    }
    case "path": {
      const pathObj = obj as PathObject;
      const d = pathSegmentsToD(pathObj.segments);
      const fillRule = pathObj.fill ? ' fill-rule="nonzero"' : "";
      return `<path d="${d}"${transform}${op}${paint}${fillRule} />`;
    }
    case "polygon": {
      const poly = obj as PolygonObject;
      const points = polygonPoints(poly.sides, poly.radius);
      return `<polygon points="${points}"${transform}${op}${paint} />`;
    }
    case "text": {
      const text = obj as TextObject;
      const anchor = textAnchor(text.textAlign);
      let attrs =
        `<text x="0" y="0" font-family="${escapeXml(text.fontFamily)}"` +
        ` font-size="${text.fontSize}" font-weight="${text.fontWeight}"` +
        ` font-style="${text.fontStyle}" text-anchor="${anchor}"` +
        ` dominant-baseline="hanging"${transform}${op}`;
      if (text.fill?.type === "solid") {
        attrs += solidFillAttrs(text.fill);
      }
      if (text.stroke) {
        attrs += strokeAttrs(text.stroke);
      }
      return `${attrs}>${escapeXml(text.content)}</text>`;
    }
    case "group": {
      const inner = obj.children.map((child) => objectToSvg(child)).join("\n");
      return `<g${transform}${op}>\n${inner}\n</g>`;
    }
    default:
      return "";
  }
}

/**
 * Serialize visible vector layers to an SVG document string.
 */
export function exportDocumentToSvg(
  layers: VectorLayer[],
  options: SvgExportOptions,
): string {
  const { width, height, backgroundColor } = options;
  const body: string[] = [];

  if (backgroundColor) {
    body.push(
      `<rect width="${width}" height="${height}" fill="${escapeXml(backgroundColor)}" />`,
    );
  }

  for (const layer of layers) {
    if (!layer.visible) continue;

    const layerParts: string[] = [];
    for (const obj of layer.objects) {
      const svg = objectToSvg(obj);
      if (svg) layerParts.push(svg);
    }

    if (layerParts.length === 0) continue;

    const layerOpacity =
      layer.opacity < 1 ? ` opacity="${layer.opacity}"` : "";
    body.push(`<g${layerOpacity}>\n${layerParts.join("\n")}\n</g>`);
  }

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">\n` +
    `${body.join("\n")}\n` +
    `</svg>`
  );
}

/** Trigger download of an SVG string in the browser */
export function downloadSvgFile(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}
