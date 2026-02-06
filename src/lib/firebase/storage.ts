import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { storage } from "./config";

/**
 * Check if Storage is available
 */
function ensureStorage() {
  if (!storage) {
    throw new Error("Firebase is not configured. Please set up your Firebase credentials.");
  }
  return storage;
}

/**
 * Get the storage path for a user's project files
 */
function getProjectPath(userId: string, projectId: string): string {
  return `users/${userId}/projects/${projectId}`;
}

/**
 * Get the storage path for a layer image
 */
function getLayerPath(
  userId: string,
  projectId: string,
  layerId: string
): string {
  return `${getProjectPath(userId, projectId)}/layers/${layerId}.png`;
}

/**
 * Get the storage path for a project thumbnail
 */
function getThumbnailPath(userId: string, projectId: string): string {
  return `${getProjectPath(userId, projectId)}/thumbnail.png`;
}

/**
 * Upload a layer image to Firebase Storage
 * @returns The storage reference path
 */
export async function uploadLayerImage(
  userId: string,
  projectId: string,
  layerId: string,
  blob: Blob
): Promise<string> {
  const path = getLayerPath(userId, projectId, layerId);
  const storageRef = ref(ensureStorage(), path);
  await uploadBytes(storageRef, blob);
  return path;
}

/**
 * Download a layer image from Firebase Storage
 * @returns The download URL
 */
export async function downloadLayerImage(storagePath: string): Promise<string> {
  const storageRef = ref(ensureStorage(), storagePath);
  return getDownloadURL(storageRef);
}

/**
 * Upload a project thumbnail to Firebase Storage
 * @returns The download URL
 */
export async function uploadThumbnail(
  userId: string,
  projectId: string,
  blob: Blob
): Promise<string> {
  const path = getThumbnailPath(userId, projectId);
  const storageRef = ref(ensureStorage(), path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

/**
 * Delete a single layer image from Firebase Storage
 */
export async function deleteLayerImage(storagePath: string): Promise<void> {
  const storageRef = ref(ensureStorage(), storagePath);
  try {
    await deleteObject(storageRef);
  } catch {
    // Ignore errors if file doesn't exist
  }
}

/**
 * Delete all files for a project from Firebase Storage
 */
export async function deleteProjectFiles(
  userId: string,
  projectId: string
): Promise<void> {
  const projectPath = getProjectPath(userId, projectId);
  const st = ensureStorage();

  try {
    // List all files in the project folder
    const layersRef = ref(st, `${projectPath}/layers`);
    const layersList = await listAll(layersRef);

    // Delete all layer files
    const deletePromises = layersList.items.map((itemRef) =>
      deleteObject(itemRef).catch(() => {})
    );

    // Delete thumbnail
    const thumbnailRef = ref(st, `${projectPath}/thumbnail.png`);
    deletePromises.push(
      deleteObject(thumbnailRef).catch(() => {})
    );

    await Promise.all(deletePromises);
  } catch {
    // Ignore errors if folder doesn't exist
  }
}

/**
 * Convert a canvas to a Blob for uploading
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to convert canvas to blob"));
      }
    }, "image/png");
  });
}

/**
 * Load an image from a URL into a canvas
 */
export function loadImageToCanvas(
  url: string,
  canvas: HTMLCanvasElement
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("No image URL provided"));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw image
      ctx.drawImage(img, 0, 0);
      resolve();
    };
    img.onerror = () => {
      reject(new Error(
        "Failed to load image from Firebase Storage. " +
        "This may be caused by CORS configuration. " +
        "See: https://firebase.google.com/docs/storage/web/download-files#cors_configuration"
      ));
    };
    img.src = url;
  });
}
