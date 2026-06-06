/**
 * Sanitizes a post-login redirect target so only same-site paths are allowed
 * (prevents open-redirect via the ?next= param).
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/";
  }
  return next;
}

/** Builds the sign-in URL that returns the user to `next` after auth. */
export function loginUrl(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
