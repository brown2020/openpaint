export type EmailLinkResolution = "ignore" | "prompt" | "complete";

/**
 * Decide what to do with a possible email-link callback.
 * A link without a stored address must prompt; the oob code stays in the URL
 * until sign-in succeeds or the user cancels.
 */
export function resolveEmailLinkSignIn(
  isSignInLink: boolean,
  storedEmail: string | null,
): EmailLinkResolution {
  if (!isSignInLink) return "ignore";
  if (!storedEmail) return "prompt";
  return "complete";
}
