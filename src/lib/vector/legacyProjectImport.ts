import type { LayerMetadata } from "@/lib/firebase/firestore";
import { downloadLayerImage } from "@/lib/firebase/storage";
import { buildLegacyVectorLayer } from "@/lib/vector/imageObject";
import type { VectorLayer } from "@/types/vector";
import { createLayer } from "@/types/vector";

/**
 * True when Firestore has Storage PNGs but no vector objects to render.
 */
export function projectNeedsLegacyRasterImport(
  vectorLayers: unknown[] | undefined,
  layerMetadata: LayerMetadata[],
): boolean {
  const hasStorageLayers = layerMetadata.some((l) => Boolean(l.storageRef));
  if (!hasStorageLayers) return false;

  if (!vectorLayers || !Array.isArray(vectorLayers)) {
    return true;
  }

  const layers = vectorLayers as VectorLayer[];
  if (layers.length === 0) {
    return true;
  }

  return !layers.some(
    (layer) => Array.isArray(layer.objects) && layer.objects.length > 0,
  );
}

/** Empty vector layers from metadata when Storage fetch is not possible */
export function buildEmptyVectorLayersFromMetadata(
  layerMetadata: LayerMetadata[],
): VectorLayer[] {
  return layerMetadata.map((meta) => {
    const layer = createLayer(meta.id, meta.name);
    layer.visible = meta.visible;
    layer.locked = meta.locked;
    layer.opacity = meta.opacity;
    return layer;
  });
}

/**
 * Fetch Storage PNGs and build one locked image object per layer.
 */
export async function fetchLegacyRasterLayers(
  layerMetadata: LayerMetadata[],
  canvasSize: { width: number; height: number },
): Promise<VectorLayer[]> {
  return Promise.all(
    layerMetadata.map(async (meta) => {
      if (!meta.storageRef) {
        const layer = createLayer(meta.id, meta.name);
        layer.visible = meta.visible;
        layer.locked = meta.locked;
        layer.opacity = meta.opacity;
        return layer;
      }

      try {
        const url = await downloadLayerImage(meta.storageRef);
        return buildLegacyVectorLayer(
          meta,
          url,
          canvasSize.width,
          canvasSize.height,
        );
      } catch (error) {
        console.error(
          `Failed to import legacy layer ${meta.id} from storage:`,
          error,
        );
        const layer = createLayer(meta.id, meta.name);
        layer.visible = meta.visible;
        layer.locked = meta.locked;
        layer.opacity = meta.opacity;
        return layer;
      }
    }),
  );
}
