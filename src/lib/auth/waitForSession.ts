import { useAuthStore } from "@/store/authStore";

/**
 * Wait until auth store reflects a signed-in user (or timeout).
 * Avoids navigating before onAuthStateChanged settles.
 */
export async function waitForSignedInUser(timeoutMs = 4000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (useAuthStore.getState().user) return true;
    await new Promise((r) => setTimeout(r, 40));
  }
  return !!useAuthStore.getState().user;
}
