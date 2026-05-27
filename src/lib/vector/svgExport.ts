import type {
  Fill,
  GradientStop,
  LinearGradientFill,
  PathObject,
  PathSegment,
  PolygonObject,
  RadialGradientFill,
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

/** Clamp corner radii so adjacent corners do not overlap on an edge */
export function clampCornerRadii(
  width: number,
  height: number,
  radii: [number, number, number, number],
): [number, number, number, number] {
  const [tl, tr, br, bl] = radii.map((r) => Math.max(0, r)) as [
    number,
    number,
    number,
    number,
  ];

  const scale = Math.min(
    1,
    tl + tr > width && width > 0 ? width / (tl + tr) : 1,
    bl + br > width && width > 0 ? width / (bl + br) : 1,
    tl + bl > height && height > 0 ? height / (tl + bl) : 1,
    tr + br > height && height > 0 ? height / (tr + br) : 1,
  );

  return [tl * scale, tr * scale, br * scale, bl * scale];
}

/** SVG path `d` for a rectangle with independent corner radii (TL, TR, BR, BL) */
export function roundedRectPathD(
  width: number,
  height: number,
  radii: [number, number, number, number],
): string {
  const [tl, tr, br, bl] = clampCornerRadii(width, height, radii);
  const w = width;
  const h = height;

  const parts: string[] = [`M ${tl} 0`, `H ${w - tr}`];

  if (tr > 0) {
    parts.push(`A ${tr} ${tr} 0 0 1 ${w} ${tr}`);
  } else {
    parts.push(`L ${w} 0`);
  }

  parts.push(`V ${h - br}`);

  if (br > 0) {
    parts.push(`A ${br} ${br} 0 0 1 ${w - br} ${h}`);
  } else {
    parts.push(`L ${w} ${h}`);
  }

  parts.push(`H ${bl}`);

  if (bl > 0) {
    parts.push(`A ${bl} ${bl} 0 0 1 0 ${h - bl}`);
  } else {
    parts.push(`L 0 ${h}`);
  }

  parts.push(`V ${tl}`);

  if (tl > 0) {
    parts.push(`A ${tl} ${tl} 0 0 1 ${tl} 0`);
  } else {
    parts.push(`L 0 0`);
  }

  parts.push("Z");
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
  const opacity = fill.opacity < 1 ? ` fill-opacity="${fill.opacity}"` : "";
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

function gradientStopsMarkup(stops: GradientStop[]): string {
  return stops
    .map(
      (stop) =>
        `<stop offset="${stop.offset}" stop-color="${escapeXml(stop.color)}" stop-opacity="${stop.opacity}"/>`,
    )
    .join("");
}

function linearGradientDef(id: string, fill: LinearGradientFill): string {
  return (
    `<linearGradient id="${id}" x1="${fill.startX}" y1="${fill.startY}" ` +
    `x2="${fill.endX}" y2="${fill.endY}" gradientUnits="userSpaceOnUse">` +
    `${gradientStopsMarkup(fill.stops)}</linearGradient>`
  );
}

function radialGradientDef(id: string, fill: RadialGradientFill): string {
  return (
    `<radialGradient id="${id}" cx="${fill.centerX}" cy="${fill.centerY}" r="${fill.radius}" ` +
    `gradientUnits="userSpaceOnUse">` +
    `${gradientStopsMarkup(fill.stops)}</radialGradient>`
  );
}

class SvgExportContext {
  private defs: string[] = [];
  private gradientCounter = 0;
  private gradientIds = new Map<string, string>();

  fillAttrs(fill: Fill | null): string {
    if (!fill) return "";
    if (fill.type === "solid") return solidFillAttrs(fill);
    const id = this.gradientId(fill);
    return ` fill="url(#${id})"`;
  }

  private gradientId(fill: LinearGradientFill | RadialGradientFill): string {
    const key = JSON.stringify(fill);
    const existing = this.gradientIds.get(key);
    if (existing) return existing;

    const id = `op-gradient-${++this.gradientCounter}`;
    this.gradientIds.set(key, id);

    if (fill.type === "linear-gradient") {
      this.defs.push(linearGradientDef(id, fill));
    } else {
      this.defs.push(radialGradientDef(id, fill));
    }

    return id;
  }

  defsMarkup(): string {
    if (this.defs.length === 0) return "";
    return `<defs>\n${this.defs.join("\n")}\n</defs>\n`;
  }
}

function paintAttrs(
  ctx: SvgExportContext,
  fill: Fill | null,
  stroke: StrokeStyle | null,
): string {
  let attrs = ctx.fillAttrs(fill);
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

function objectToSvg(ctx: SvgExportContext, obj: VectorObject): string {
  if (!obj.visible) return "";

  const transform = ` transform="${escapeXml(transformToSvg(obj.transform))}"`;
  const op = opacityAttr(obj.opacity);
  const paint = paintAttrs(ctx, obj.fill, obj.stroke);

  switch (obj.type) {
    case "rectangle": {
      const rect = obj as RectangleObject;
      const [tl, tr, br, bl] = rect.cornerRadius;
      const hasRadius = tl > 0 || tr > 0 || br > 0 || bl > 0;
      if (hasRadius) {
        const d = roundedRectPathD(rect.width, rect.height, [tl, tr, br, bl]);
        const fillRule = rect.fill ? ' fill-rule="evenodd"' : "";
        return `<path d="${d}"${transform}${op}${paint}${fillRule} />`;
      }
      return `<rect x="0" y="0" width="${rect.width}" height="${rect.height}"${transform}${op}${paint} />`;
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
      if (text.fill) {
        attrs += ctx.fillAttrs(text.fill);
      }
      if (text.stroke) {
        attrs += strokeAttrs(text.stroke);
      }
      return `${attrs}>${escapeXml(text.content)}</text>`;
    }
    case "group": {
      const inner = obj.children
        .map((child) => objectToSvg(ctx, child))
        .join("\n");
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
  const ctx = new SvgExportContext();
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
      const svg = objectToSvg(ctx, obj);
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
    ctx.defsMarkup() +
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
