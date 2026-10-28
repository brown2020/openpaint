"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EmailLinkPrompt } from "@/components/auth/EmailLinkPrompt";
import { resolveEmailLinkSignIn } from "@/lib/auth/emailLink";
import {
  resetEditorSession,
  shouldResetEditorOnAuthChange,
} from "@/lib/auth/editorSession";
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
  const previousUserIdRef = useRef<string | null>(null);
  const [emailLinkUrl, setEmailLinkUrl] = useState<string | null>(null);

  const completeEmailLink = useCallback(
    async (email: string, url: string) => {
      setLoading(true);
      try {
        await signInWithEmailLink(email, url);
        window.history.replaceState(null, "", window.location.pathname);
        setEmailLinkUrl(null);
      } catch (error) {
        setError(getAuthErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [setError, setLoading],
  );

  const cancelEmailLink = useCallback(() => {
    window.history.replaceState(null, "", window.location.pathname);
    setEmailLinkUrl(null);
  }, []);

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
      const storedEmail = getStoredEmailForSignIn();
      const resolution = resolveEmailLinkSignIn(
        checkIsSignInWithEmailLink(url),
        storedEmail,
      );
      if (resolution === "prompt") {
        setEmailLinkUrl(url);
        return;
      }
      if (resolution === "complete" && storedEmail) {
        await completeEmailLink(storedEmail, url);
      }
    };

    void handleEmailLinkSignIn();

    // Subscribe to auth state changes. Sign-out clears the open cloud project
    // before guest local hydration can bind that project id to a local document.
    const unsubscribe = onAuthStateChange((user) => {
      const nextUserId = user?.uid ?? null;
      if (shouldResetEditorOnAuthChange(previousUserIdRef.current, nextUserId)) {
        resetEditorSession();
      }
      previousUserIdRef.current = nextUserId;
      setUser(user);
      setInitialized(true);
    });

    return () => {
      unsubscribe();
    };
  }, [setUser, setInitialized, setError, setLoading, completeEmailLink]);

  return (
    <>
      {children}
      {emailLinkUrl && (
        <EmailLinkPrompt
          onSubmit={(email) => {
            void completeEmailLink(email, emailLinkUrl);
          }}
          onCancel={cancelEmailLink}
        />
      )}
    </>
  );
}
