import {
  svgFontStyle,
  svgFontWeight,
  svgImageHref,
  svgLineCap,
  svgLineJoin,
  svgNumber,
  svgOpacity,
} from "@/lib/vector/svgSafe";
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
  ImageObject,
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
  const n = (value: unknown) => svgNumber(value);
  for (const seg of segments) {
    switch (seg.type) {
      case "M":
        parts.push(`M ${n(seg.x)} ${n(seg.y)}`);
        break;
      case "L":
        parts.push(`L ${n(seg.x)} ${n(seg.y)}`);
        break;
      case "C":
        parts.push(
          `C ${n(seg.cp1x)} ${n(seg.cp1y)} ${n(seg.cp2x)} ${n(seg.cp2y)} ${n(seg.x)} ${n(seg.y)}`,
        );
        break;
      case "Q":
        parts.push(`Q ${n(seg.cpx)} ${n(seg.cpy)} ${n(seg.x)} ${n(seg.y)}`);
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
  const safeWidth = Math.max(0, svgNumber(width));
  const safeHeight = Math.max(0, svgNumber(height));
  const [tl, tr, br, bl] = radii.map((r) => Math.max(0, svgNumber(r))) as [
    number,
    number,
    number,
    number,
  ];

  const scale = Math.min(
    1,
    tl + tr > safeWidth && safeWidth > 0 ? safeWidth / (tl + tr) : 1,
    bl + br > safeWidth && safeWidth > 0 ? safeWidth / (bl + br) : 1,
    tl + bl > safeHeight && safeHeight > 0 ? safeHeight / (tl + bl) : 1,
    tr + br > safeHeight && safeHeight > 0 ? safeHeight / (tr + br) : 1,
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
  const w = Math.max(0, svgNumber(width));
  const h = Math.max(0, svgNumber(height));

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
  const x = svgNumber(t.x);
  const y = svgNumber(t.y);
  const rotation = svgNumber(t.rotation);
  const scaleX = svgNumber(t.scaleX, 1);
  const scaleY = svgNumber(t.scaleY, 1);
  const parts: string[] = [`translate(${x},${y})`];
  if (rotation !== 0) {
    parts.push(`rotate(${rotation})`);
  }
  if (scaleX !== 1 || scaleY !== 1) {
    parts.push(`scale(${scaleX},${scaleY})`);
  }
  return parts.join(" ");
}

function solidFillAttrs(fill: Fill): string {
  if (fill.type !== "solid") return "";
  const opacity = svgOpacity(fill.opacity);
  const opacityAttr = opacity < 1 ? ` fill-opacity="${opacity}"` : "";
  return ` fill="${escapeXml(String(fill.color ?? ""))}"${opacityAttr}`;
}

function strokeAttrs(stroke: StrokeStyle): string {
  const opacity = svgOpacity(stroke.opacity);
  const opacityAttr = opacity < 1 ? ` stroke-opacity="${opacity}"` : "";
  const dashes = Array.isArray(stroke.dashArray)
    ? stroke.dashArray.map((value) => svgNumber(value))
    : [];
  const dash =
    dashes.length > 0 ? ` stroke-dasharray="${dashes.join(" ")}"` : "";
  return (
    ` stroke="${escapeXml(String(stroke.color ?? ""))}"` +
    ` stroke-width="${svgNumber(stroke.width)}"` +
    ` stroke-linecap="${svgLineCap(stroke.lineCap)}"` +
    ` stroke-linejoin="${svgLineJoin(stroke.lineJoin)}"` +
    opacityAttr +
    dash
  );
}

function gradientStopsMarkup(stops: GradientStop[]): string {
  return stops
    .map(
      (stop) =>
        `<stop offset="${svgNumber(stop.offset)}" stop-color="${escapeXml(String(stop.color ?? ""))}" stop-opacity="${svgOpacity(stop.opacity)}"/>`,
    )
    .join("");
}

function linearGradientDef(id: string, fill: LinearGradientFill): string {
  return (
    `<linearGradient id="${id}" x1="${svgNumber(fill.startX)}" y1="${svgNumber(fill.startY)}" ` +
    `x2="${svgNumber(fill.endX)}" y2="${svgNumber(fill.endY)}" gradientUnits="userSpaceOnUse">` +
    `${gradientStopsMarkup(fill.stops)}</linearGradient>`
  );
}

function radialGradientDef(id: string, fill: RadialGradientFill): string {
  return (
    `<radialGradient id="${id}" cx="${svgNumber(fill.centerX)}" cy="${svgNumber(fill.centerY)}" r="${svgNumber(fill.radius)}" ` +
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

function opacityAttr(opacity: unknown): string {
  const value = svgOpacity(opacity);
  return value < 1 ? ` opacity="${value}"` : "";
}

function polygonPoints(sides: number, radius: number): string {
  const count = Math.max(3, Math.min(64, Math.round(svgNumber(sides, 6))));
  const safeRadius = svgNumber(radius);
  const angleStep = (Math.PI * 2) / count;
  const startAngle = -Math.PI / 2;
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const angle = startAngle + i * angleStep;
    const x = safeRadius * Math.cos(angle);
    const y = safeRadius * Math.sin(angle);
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
      const rawRadii = Array.isArray(rect.cornerRadius) ? rect.cornerRadius : [];
      const [tl, tr, br, bl] = [
        svgNumber(rawRadii[0]),
        svgNumber(rawRadii[1]),
        svgNumber(rawRadii[2]),
        svgNumber(rawRadii[3]),
      ] as [number, number, number, number];
      const hasRadius = tl > 0 || tr > 0 || br > 0 || bl > 0;
      if (hasRadius) {
        const d = roundedRectPathD(rect.width, rect.height, [tl, tr, br, bl]);
        const fillRule = rect.fill ? ' fill-rule="evenodd"' : "";
        return `<path d="${d}"${transform}${op}${paint}${fillRule} />`;
      }
      return `<rect x="0" y="0" width="${svgNumber(rect.width)}" height="${svgNumber(rect.height)}"${transform}${op}${paint} />`;
    }
    case "ellipse":
      return `<ellipse cx="0" cy="0" rx="${svgNumber(obj.radiusX)}" ry="${svgNumber(obj.radiusY)}"${transform}${op}${paint} />`;
    case "line": {
      const linePaint = obj.stroke ? strokeAttrs(obj.stroke) : "";
      return `<line x1="0" y1="0" x2="${svgNumber(obj.endX)}" y2="${svgNumber(obj.endY)}"${transform}${op}${linePaint} />`;
    }
    case "path": {
      const pathObj = obj as PathObject;
      const d = pathSegmentsToD(
        Array.isArray(pathObj.segments) ? pathObj.segments : [],
      );
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
        `<text x="0" y="0" font-family="${escapeXml(String(text.fontFamily ?? ""))}"` +
        ` font-size="${svgNumber(text.fontSize, 16)}" font-weight="${svgFontWeight(text.fontWeight)}"` +
        ` font-style="${svgFontStyle(text.fontStyle)}" text-anchor="${anchor}"` +
        ` dominant-baseline="hanging"${transform}${op}`;
      if (text.fill) {
        attrs += ctx.fillAttrs(text.fill);
      }
      if (text.stroke) {
        attrs += strokeAttrs(text.stroke);
      }
      return `${attrs}>${escapeXml(String(text.content ?? ""))}</text>`;
    }
    case "group": {
      const children = Array.isArray(obj.children) ? obj.children : [];
      const inner = children
        .map((child) => objectToSvg(ctx, child))
        .join("\n");
      return `<g${transform}${op}>\n${inner}\n</g>`;
    }
    case "image": {
      const image = obj as ImageObject;
      return (
        `<image x="0" y="0" width="${svgNumber(image.width)}" height="${svgNumber(image.height)}"` +
        ` href="${escapeXml(svgImageHref(image.src))}" preserveAspectRatio="none"${transform}${op} />`
      );
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
      `<rect width="${svgNumber(width)}" height="${svgNumber(height)}" fill="${escapeXml(String(backgroundColor))}" />`,
    );
  }

  for (const layer of layers) {
    if (!layer.visible) continue;

    const layerParts: string[] = [];
    const objects = Array.isArray(layer.objects) ? layer.objects : [];
    for (const obj of objects) {
      const svg = objectToSvg(ctx, obj);
      if (svg) layerParts.push(svg);
    }

    if (layerParts.length === 0) continue;

    const layerOpacityValue = svgOpacity(layer.opacity);
    const layerOpacity =
      layerOpacityValue < 1 ? ` opacity="${layerOpacityValue}"` : "";
    body.push(`<g${layerOpacity}>\n${layerParts.join("\n")}\n</g>`);
  }

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgNumber(width)}" height="${svgNumber(height)}" ` +
    `viewBox="0 0 ${svgNumber(width)} ${svgNumber(height)}">\n` +
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
