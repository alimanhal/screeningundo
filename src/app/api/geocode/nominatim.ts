/**
 * Shared bits for our Nominatim proxies (forward + reverse).
 *
 * OSMF usage policy demands an identified User-Agent and at most ~1
 * request/second per server instance. Both routes share the SAME
 * `lastRequestAt` so combining them can't push us over the limit.
 *
 * A strict global limiter would need shared state across replicas; this
 * single-process limiter is good enough for our free-tier deployment, and
 * a 429 here degrades gracefully on the client (pin-drop still works).
 */
export const USER_AGENT =
  "WC26-Screenings/1.0 (worldcup-screenings community site)";
export const MIN_INTERVAL_MS = 1100;

let lastRequestAt = 0;

/** Returns true if the caller may hit Nominatim now, false if it must back off. */
export function reserveSlot(): boolean {
  const now = Date.now();
  if (now - lastRequestAt < MIN_INTERVAL_MS) return false;
  lastRequestAt = now;
  return true;
}
