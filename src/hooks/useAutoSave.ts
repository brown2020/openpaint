"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { useProjects } from "./useProjects";

const AUTO_SAVE_INTERVAL = 30000;
const DEBOUNCE_DELAY = 2000;

interface UseAutoSaveOptions {
  enabled?: boolean;
  interval?: number;
  debounceDelay?: number;
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const {
    enabled = true,
    interval = AUTO_SAVE_INTERVAL,
    debounceDelay = DEBOUNCE_DELAY,
  } = options;

  const { user } = useAuthStore();
  const { currentProjectId, isDirty } = useProjectStore();
  const { saveProject } = useProjects();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const performSave = useCallback(async () => {
    if (isSavingRef.current) return;
    const { isDirty, syncStatus } = useProjectStore.getState();
    if (!isDirty || syncStatus === "syncing") return;

    isSavingRef.current = true;
    try {
      await saveProject();
    } finally {
      isSavingRef.current = false;
    }
  }, [saveProject]);

  // Debounced save when dirty flag changes
  useEffect(() => {
    if (!enabled || !user || !currentProjectId || !isDirty) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(performSave, debounceDelay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, user, currentProjectId, isDirty, debounceDelay, performSave]);

  // Regular interval save
  useEffect(() => {
    if (!enabled || !user || !currentProjectId) return;

    intervalRef.current = setInterval(performSave, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, user, currentProjectId, interval, performSave]);

  const save = useCallback(async () => {
    if (!user || !currentProjectId) return false;
    return saveProject();
  }, [user, currentProjectId, saveProject]);

  return { save };
}
