/**
 * Response headers for the client-only editor.
 * CSP allows Firebase Auth, Firestore, and Storage plus Next.js inline bootstrap.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://*.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firebasestorage.googleapis.com https://www.google.com https://accounts.google.com wss://*.firebaseio.com",
  "frame-src 'self' https://accounts.google.com https://*.google.com https://*.firebaseapp.com https://*.web.app",
].join("; ");

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

export function securityHeaderRoutes(): {
  source: string;
  headers: { key: string; value: string }[];
}[] {
  return [{ source: "/:path*", headers: SECURITY_HEADERS }];
}
