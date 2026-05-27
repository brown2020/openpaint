import { v4 as uuidv4 } from "uuid";
import {
  createTransform,
  type ImageObject,
  type VectorLayer,
} from "@/types/vector";
import { createLayer } from "@/types/vector";
import type { LayerMetadata } from "@/lib/firebase/firestore";

export function createImageObject(
  src: string,
  width: number,
  height: number,
  name = "Raster",
  locked = true,
): ImageObject {
  return {
    id: uuidv4(),
    type: "image",
    name,
    transform: createTransform(0, 0),
    fill: null,
    stroke: null,
    opacity: 1,
    visible: true,
    locked,
    width,
    height,
    src,
  };
}

export function buildLegacyVectorLayer(
  meta: LayerMetadata,
  imageSrc: string,
  canvasWidth: number,
  canvasHeight: number,
): VectorLayer {
  const layer = createLayer(meta.id, meta.name);
  layer.visible = meta.visible;
  layer.locked = meta.locked;
  layer.opacity = meta.opacity;
  layer.objects = [
    createImageObject(imageSrc, canvasWidth, canvasHeight, meta.name, true),
  ];
  return layer;
}
