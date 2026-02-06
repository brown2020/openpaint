import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Check if Firestore is available
 */
function ensureDb() {
  if (!db) {
    throw new Error("Firebase is not configured. Please set up your Firebase credentials.");
  }
  return db;
}

/**
 * Layer metadata stored in Firestore
 */
export interface LayerMetadata {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  blendMode: string;
  storageRef: string; // Path to Storage file
}

/**
 * Project document stored in Firestore
 */
export interface ProjectDocument {
  id: string;
  userId: string;
  name: string;
  createdAt: Timestamp;
  modifiedAt: Timestamp;
  canvasSize: { width: number; height: number };
  thumbnailUrl: string | null;
  layers: LayerMetadata[];
  activeLayerId: string;
  version: string;
}

/**
 * Data for creating a new project
 */
export interface CreateProjectData {
  name: string;
  canvasSize: { width: number; height: number };
  layers: LayerMetadata[];
  activeLayerId: string;
}

/**
 * Data for updating an existing project
 */
export interface UpdateProjectData {
  name?: string;
  thumbnailUrl?: string | null;
  layers?: LayerMetadata[];
  activeLayerId?: string;
}

const PROJECTS_COLLECTION = "projects";

/**
 * Create a new project in Firestore
 */
export async function createProject(
  userId: string,
  data: CreateProjectData
): Promise<string> {
  const projectData = {
    userId,
    name: data.name,
    createdAt: serverTimestamp(),
    modifiedAt: serverTimestamp(),
    canvasSize: data.canvasSize,
    thumbnailUrl: null,
    layers: data.layers,
    activeLayerId: data.activeLayerId,
    version: "1.0",
  };

  const docRef = await addDoc(collection(ensureDb(), PROJECTS_COLLECTION), projectData);
  return docRef.id;
}

/**
 * Get all projects for a user
 */
export async function getUserProjects(
  userId: string
): Promise<ProjectDocument[]> {
  const q = query(
    collection(ensureDb(), PROJECTS_COLLECTION),
    where("userId", "==", userId),
    orderBy("modifiedAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ProjectDocument[];
}

/**
 * Get a single project by ID
 */
export async function getProject(
  projectId: string
): Promise<ProjectDocument | null> {
  const docRef = doc(ensureDb(), PROJECTS_COLLECTION, projectId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as ProjectDocument;
}

/**
 * Update a project's metadata
 */
export async function updateProject(
  projectId: string,
  updates: UpdateProjectData
): Promise<void> {
  const docRef = doc(ensureDb(), PROJECTS_COLLECTION, projectId);
  await updateDoc(docRef, {
    ...updates,
    modifiedAt: serverTimestamp(),
  });
}

/**
 * Delete a project from Firestore
 * Note: This does not delete associated storage files
 */
export async function deleteProject(projectId: string): Promise<void> {
  const docRef = doc(ensureDb(), PROJECTS_COLLECTION, projectId);
  await deleteDoc(docRef);
}

/**
 * Rename a project
 */
export async function renameProject(
  projectId: string,
  newName: string
): Promise<void> {
  await updateProject(projectId, { name: newName });
}

