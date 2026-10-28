import type { VectorLayer } from "@/types/vector";

export const LOCAL_PROJECT_VERSION = "2.0.0";
export const LOCAL_PROJECT_STORAGE_KEY = "openpaint-project";

export interface LocalProjectSnapshot {
  version: string;
  name: string;
  createdAt: string;
  modifiedAt: string;
  canvasSize: { width: number; height: number };
  layers: VectorLayer[];
}

export function buildLocalProjectSnapshot(input: {
  name: string;
  canvasSize: { width: number; height: number };
  layers: VectorLayer[];
  now?: Date;
}): LocalProjectSnapshot {
  const stamp = (input.now ?? new Date()).toISOString();
  const name = input.name.trim() || "Untitled";
  return {
    version: LOCAL_PROJECT_VERSION,
    name,
    createdAt: stamp,
    modifiedAt: stamp,
    canvasSize: input.canvasSize,
    layers: input.layers,
  };
}

/** Filename safe for a browser download. The Open picker accepts `.json`. */
export function localProjectFilename(name: string): string {
  const trimmed = name.trim() || "openpaint-project";
  const safe = trimmed
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 80)
    .trim();
  const base = safe.replace(/\.json$/i, "") || "openpaint-project";
  return `${base}.json`;
}

export function serializeLocalProject(snapshot: LocalProjectSnapshot): string {
  return JSON.stringify(snapshot);
}
