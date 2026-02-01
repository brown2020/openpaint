import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink as firebaseSignInWithEmailLink,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./config";

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Email link action code settings
const actionCodeSettings = {
  url: typeof window !== "undefined" ? window.location.origin : "",
  handleCodeInApp: true,
};

/**
 * Check if Firebase auth is available
 */
function ensureAuth() {
  if (!auth) {
    throw new Error("Firebase is not configured. Please set up your Firebase credentials.");
  }
  return auth;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(ensureAuth(), googleProvider);
  return result.user;
}

/**
 * Create a new account with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(ensureAuth(), email, password);
  return result.user;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  const result = await signInWithEmailAndPassword(ensureAuth(), email, password);
  return result.user;
}

/**
 * Send a passwordless sign-in link to email
 */
export async function sendSignInLink(email: string): Promise<void> {
  await sendSignInLinkToEmail(ensureAuth(), email, actionCodeSettings);
  // Save the email locally to complete sign-in later
  if (typeof window !== "undefined") {
    window.localStorage.setItem("emailForSignIn", email);
  }
}

/**
 * Check if the current URL is a sign-in link
 */
export function checkIsSignInWithEmailLink(link: string): boolean {
  if (!auth) return false;
  return isSignInWithEmailLink(auth, link);
}

/**
 * Complete sign-in with email link
 */
export async function signInWithEmailLink(
  email: string,
  link: string
): Promise<User> {
  const result = await firebaseSignInWithEmailLink(ensureAuth(), email, link);
  // Clear stored email
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("emailForSignIn");
  }
  return result.user;
}

/**
 * Get stored email for sign-in link completion
 */
export function getStoredEmailForSignIn(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("emailForSignIn");
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): Unsubscribe {
  if (!auth) {
    // If Firebase is not configured, immediately call callback with null
    // and return a no-op unsubscribe function
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the current user (may be null)
 */
export function getCurrentUser(): User | null {
  if (!auth) return null;
  return auth.currentUser;
}

/**
 * Check if Firebase is configured
 */
export { isFirebaseConfigured };

/**
 * Get a user-friendly error message from Firebase auth errors
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please sign in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/invalid-credential":
        return "Invalid email or password. Please try again.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/popup-closed-by-user":
        return "Sign-in was cancelled.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection.";
      default:
        return error.message || "An error occurred. Please try again.";
    }
  }
  return "An unexpected error occurred.";
}
