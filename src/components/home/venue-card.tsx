import Link from "next/link";
import {
  formatDistanceKm,
  getVenueMapHref,
  INDOOR_OUTDOOR_LABELS,
  VENUE_TYPE_LABELS,
  type VenueListItem,
} from "@/lib/venues";
import { LocationPinIcon } from "@/components/ui/location-pin-icon";

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
        {/*
          Pad the whole header row by the icon column (44px hit area
          + 8px gap) so the title AND the distance/vote badge always
          stay clear of the absolutely-positioned map-pin icon.
          `flex-wrap` lets the badge drop under the title on very
          narrow screens instead of being squeezed against the icon.
        */}
        <div
          className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 ${
            mapLink ? "pr-12" : ""
          }`}
        >
          <h3 className="font-bold text-ink group-hover:text-blue-deep">
            {venue.name}
          </h3>
          {distanceKm !== null ? (
            <span className="scoreboard inline-flex shrink-0 items-center gap-1 text-xs text-blue-deep">
              <LocationPinIcon className="h-3.5 w-3.5" />
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
          <LocationPinIcon className="pin-bounce h-5 w-5" />
        </a>
      )}
    </div>
  );
}
