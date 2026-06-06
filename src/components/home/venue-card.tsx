import Link from "next/link";
import {
  formatDistanceKm,
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
  return (
    <Link
      href={`/venues/${venue.id}`}
      className={`group block border-b border-line px-4 py-4 transition hover:bg-blue-wash/50 ${
        highlight ? "bg-yellow-wash/60" : ""
      }`}
    >
      {highlight && (
        <p className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-yellow-wash px-2.5 py-0.5 text-xs font-semibold text-yellow-deep">
          {highlight.flagEmoji} {highlight.teamName} plays here ·{" "}
          {highlight.kickoffLabel}
        </p>
      )}
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-bold text-ink group-hover:text-blue-deep">
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
      <p className="mt-0.5 text-sm text-ink-soft">
        {venue.city}, {venue.country}
      </p>
      <p className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium">
        <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-ink-soft">
          {VENUE_TYPE_LABELS[venue.venue_type]}
        </span>
        <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-ink-soft">
          {INDOOR_OUTDOOR_LABELS[venue.indoor_outdoor]}
        </span>
        {venue.is_free_entry && (
          <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-ink-soft">
            Free entry
          </span>
        )}
        {venue.big_screen && (
          <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-ink-soft">
            Big screen
          </span>
        )}
      </p>
    </Link>
  );
}
