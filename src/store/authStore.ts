import { create } from "zustand";
import type { User } from "firebase/auth";

interface AuthState {
  // User state
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  loading: true,
  error: null,
  initialized: false,

  // Actions
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setInitialized: (initialized) => set({ initialized, loading: false }),
  clearError: () => set({ error: null }),
}));
