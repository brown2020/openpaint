"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { useProjects } from "./useProjects";

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const DEBOUNCE_DELAY = 2000; // 2 seconds after last change

interface UseAutoSaveOptions {
  enabled?: boolean;
  interval?: number;
  debounceDelay?: number;
}

/**
 * Hook that automatically saves the project at regular intervals
 * and when changes are detected
 */
export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const {
    enabled = true,
    interval = AUTO_SAVE_INTERVAL,
    debounceDelay = DEBOUNCE_DELAY,
  } = options;

  const { user } = useAuthStore();
  const { currentProjectId, isDirty, syncStatus } = useProjectStore();
  const { saveProject } = useProjects();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (isDirty && syncStatus !== "syncing") {
        await saveProject();
        lastSaveRef.current = Date.now();
      }
    }, debounceDelay);
  }, [isDirty, syncStatus, saveProject, debounceDelay]);

  // Save when dirty changes
  useEffect(() => {
    if (!enabled || !user || !currentProjectId || !isDirty) return;

    // Only debounce save if we're not syncing
    if (syncStatus !== "syncing") {
      debouncedSave();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, user, currentProjectId, isDirty, syncStatus, debouncedSave]);

  // Regular interval save
  useEffect(() => {
    if (!enabled || !user || !currentProjectId) return;

    intervalRef.current = setInterval(async () => {
      // Only save if dirty and not currently syncing
      if (isDirty && syncStatus !== "syncing") {
        const timeSinceLastSave = Date.now() - lastSaveRef.current;
        // Don't save if we just saved recently (within debounce window)
        if (timeSinceLastSave >= debounceDelay) {
          await saveProject();
          lastSaveRef.current = Date.now();
        }
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, user, currentProjectId, isDirty, syncStatus, interval, debounceDelay, saveProject]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manual save function
  const save = useCallback(async () => {
    if (!user || !currentProjectId) return false;
    const success = await saveProject();
    if (success) {
      lastSaveRef.current = Date.now();
    }
    return success;
  }, [user, currentProjectId, saveProject]);

  return {
    save,
    isDirty,
    syncStatus,
  };
}
