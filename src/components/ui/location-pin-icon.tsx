/**
 * Shared map-pin SVG used by:
 *   - the venue card's "Open in Maps" button
 *   - the filter bar's "Near me" button
 *
 * Single source of truth so both surfaces stay visually consistent.
 * Inherits `currentColor` for stroke + fill, so the parent's text
 * color drives the tint. Pass `className` to size it.
 */
export function LocationPinIcon({
  className,
  filled = true,
}: {
  className?: string;
  /** When true, gives the pin body a soft tinted fill for a bolder look. */
  filled?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      fillOpacity={filled ? 0.18 : undefined}
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle
        cx="12"
        cy="10"
        r="3"
        fill={filled ? "var(--surface)" : "none"}
      />
    </svg>
  );
}
