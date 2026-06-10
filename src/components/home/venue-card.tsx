import Link from "next/link";
import {
  formatDistanceKm,
  getVenueMapHref,
  INDOOR_OUTDOOR_LABELS,
  VENUE_TYPE_LABELS,
  type VenueListItem,
} from "@/lib/venues";

export type FavoriteHighlight = {
  teamName: string;
  flagEmoji: string;
  kickoffLabel: string;
};

export function VenueCard({
  venue,
  distanceKm,
  highlight,
}: {
  venue: VenueListItem;
  distanceKm: number | null;
  highlight: FavoriteHighlight | null;
}) {
  const mapLink = getVenueMapHref(venue);
  return (
    // Relative wrapper so the map icon can overlay the full-bleed card
    // link. HTML forbids nested <a>, so the icon sits as a sibling and
    // uses z-index to stay clickable above the card link.
    <div
      className={`group relative border-b border-line transition hover:bg-blue-wash/60 hover:shadow-[inset_3px_0_0_var(--blue)] ${
        highlight ? "bg-yellow-wash/70 shadow-[inset_3px_0_0_var(--yellow)]" : ""
      }`}
    >
      <Link
        href={`/venues/${venue.id}`}
        className="block px-4 py-4"
      >
        {highlight && (
          <p className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-yellow-wash px-2.5 py-0.5 text-xs font-semibold text-yellow-deep">
            {highlight.flagEmoji} {highlight.teamName} plays here ·{" "}
            {highlight.kickoffLabel}
          </p>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className={`font-bold text-ink group-hover:text-blue-deep ${
              mapLink ? "pr-10" : ""
            }`}
          >
            {venue.name}
          </h3>
          {distanceKm !== null ? (
            <span className="scoreboard shrink-0 text-xs text-blue-deep">
              {formatDistanceKm(distanceKm)}
            </span>
          ) : (
            venue.vote_count > 0 && (
              <span className="scoreboard shrink-0 text-xs text-ink-faint">
                ▲ {venue.vote_count}
              </span>
            )
          )}
        </div>
        {(venue.city || venue.country) && (
          <p className="mt-0.5 text-sm text-ink-soft">
            {[venue.city, venue.country].filter(Boolean).join(", ")}
          </p>
        )}
        <p className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium">
          <span className="chip">
            {VENUE_TYPE_LABELS[venue.venue_type]}
          </span>
          <span className="chip">
            {INDOOR_OUTDOOR_LABELS[venue.indoor_outdoor]}
          </span>
          {venue.is_free_entry && <span className="chip">Free entry</span>}
          {venue.big_screen && <span className="chip">Big screen</span>}
        </p>
      </Link>
      {mapLink && (
        <a
          href={mapLink.href}
          target="_blank"
          rel="noreferrer"
          aria-label={mapLink.label}
          title={mapLink.label}
          // Touch target ≥44px (CLAUDE.md mobile rule), tucked into the
          // top-right corner so it doesn't disrupt the card layout.
          // `pin-bounce-host` triggers the stronger hop on hover/focus
          // for the nested `.pin-bounce` SVG (see globals.css).
          className="pin-bounce-host press absolute right-2 top-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full text-blue-deep transition hover:bg-surface"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            // Filled tint + thicker stroke = a bolder, more tappable pin.
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pin-bounce h-5 w-5"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" fill="var(--surface)" />
          </svg>
        </a>
      )}
    </div>
  );
}
