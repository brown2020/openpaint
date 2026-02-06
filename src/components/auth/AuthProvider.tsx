"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  onAuthStateChange,
  checkIsSignInWithEmailLink,
  signInWithEmailLink,
  getStoredEmailForSignIn,
  getAuthErrorMessage,
  isFirebaseConfigured,
} from "@/lib/firebase/auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component that handles auth state management
 * Wraps the app and subscribes to Firebase auth state changes
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setInitialized, setError, setLoading } = useAuthStore();

  useEffect(() => {
    // If Firebase is not configured, immediately mark as initialized with no user
    if (!isFirebaseConfigured) {
      setUser(null);
      setInitialized(true);
      return;
    }

    // Handle email link sign-in if present in URL
    const handleEmailLinkSignIn = async () => {
      if (typeof window === "undefined") return;

      const url = window.location.href;
      if (checkIsSignInWithEmailLink(url)) {
        const email = getStoredEmailForSignIn();
        if (!email) {
          // No stored email — clear the link and let user sign in normally
          window.history.replaceState(null, "", window.location.pathname);
          return;
        }

        setLoading(true);
        try {
          await signInWithEmailLink(email, url);
          window.history.replaceState(null, "", window.location.pathname);
        } catch (error) {
          setError(getAuthErrorMessage(error));
        }
      }
    };

    handleEmailLinkSignIn();

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setInitialized(true);
    });

    return () => {
      unsubscribe();
    };
  }, [setUser, setInitialized, setError, setLoading]);

  return <>{children}</>;
}
