import type { TextObject, VectorObject } from "@/types/vector";

const TYPE_LABELS: Record<VectorObject["type"], string> = {
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  line: "Line",
  polygon: "Polygon",
  path: "Path",
  text: "Text",
  group: "Group",
};

const MAX_NAME_LENGTH = 24;

function truncateName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= MAX_NAME_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_NAME_LENGTH - 1)}…`;
}

/**
 * Label for the layers panel object row (type + truncated name).
 */
export function formatObjectListLabel(obj: VectorObject): string {
  const typeLabel = TYPE_LABELS[obj.type];
  const displayName =
    obj.type === "text"
      ? truncateName((obj as TextObject).content || obj.name)
      : truncateName(obj.name);
  return displayName ? `${typeLabel} · ${displayName}` : typeLabel;
}
