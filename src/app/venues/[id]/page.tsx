import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/helpers";
import {
  getVenueMapHref,
  INDOOR_OUTDOOR_LABELS,
  VENUE_TYPE_LABELS,
  type VenueListItem,
} from "@/lib/venues";
import {
  formatKickoff,
  matchLabel,
  STAGE_LABELS,
  type MatchRow,
} from "@/lib/matches";
import { MiniMap } from "@/components/map/mini-map";
import { ShareButton } from "@/components/venues/share-button";
import { VenueActions } from "@/components/venues/venue-actions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: venue } = await supabase
    .from("venues")
    .select("name, city, country")
    .eq("id", id)
    .maybeSingle();
  if (!venue) return { title: "Venue not found" };
  const place = [venue.city, venue.country].filter(Boolean).join(", ");
  return {
    title: place ? `${venue.name} — ${place}` : venue.name,
    description: place
      ? `Watch 2026 World Cup matches at ${venue.name}, ${place}.`
      : `Watch 2026 World Cup matches at ${venue.name}.`,
  };
}

export default async function VenuePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: venueRow }, { data: voteCount }] = await Promise.all([
    supabase.from("venues").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("venue_vote_counts")
      .select("vote_count")
      .eq("venue_id", id)
      .maybeSingle(),
  ]);
  if (!venueRow) notFound();

  const venue: VenueListItem = {
    ...venueRow,
    vote_count: voteCount?.vote_count ?? 0,
  };

  const user = await getUser();

  let hasVoted = false;
  if (user) {
    const { data: myVote } = await supabase
      .from("votes")
      .select("venue_id")
      .eq("venue_id", venue.id)
      .eq("user_id", user.id)
      .maybeSingle();
    hasVoted = myVote !== null;
  }

  let screenedMatches: MatchRow[] = [];
  const teamsByCode = new Map<
    string,
    { code: string; name: string; group_letter: string; flag_emoji: string }
  >();
  if (!venue.screens_all_matches) {
    const [{ data: vm }, { data: teams }] = await Promise.all([
      supabase
        .from("venue_matches")
        .select("matches(*)")
        .eq("venue_id", venue.id),
      supabase.from("teams").select("*"),
    ]);
    screenedMatches = (vm ?? [])
      .map((row) => row.matches as unknown as MatchRow)
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime(),
      );
    for (const t of teams ?? []) teamsByCode.set(t.code, t);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="display text-3xl text-ink">{venue.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {[venue.address, venue.city, venue.country]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <VenueActions
            venueId={venue.id}
            voteCount={venue.vote_count}
            hasVoted={hasVoted}
            isSignedIn={user !== null}
          />
          {user && venue.created_by === user.id && (
            <Link
              href={`/venues/${venue.id}/edit`}
              className="press rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:bg-blue-wash"
            >
              Edit
            </Link>
          )}
          <ShareButton title={venue.name} />
        </div>
      </div>

      <p className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-medium">
        <span className="chip">
          {VENUE_TYPE_LABELS[venue.venue_type]}
        </span>
        <span className="chip">
          {INDOOR_OUTDOOR_LABELS[venue.indoor_outdoor]}
        </span>
        {venue.is_free_entry && (
          <span className="chip">
            Free entry
          </span>
        )}
        {venue.big_screen && (
          <span className="chip">
            Big screen
          </span>
        )}
        {venue.food_available && (
          <span className="chip">
            Food
          </span>
        )}
        {venue.family_friendly && (
          <span className="chip">
            Family friendly
          </span>
        )}
        {venue.capacity_estimate ? (
          <span className="chip">
            ~{venue.capacity_estimate.toLocaleString()} people
          </span>
        ) : null}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">
            {venue.description}
          </p>

          <h2 className="display mt-8 text-lg text-ink">Matches screened</h2>
          {venue.screens_all_matches ? (
            <p className="mt-2 rounded-xl bg-blue-wash/60 px-3 py-2 text-sm text-blue-deep">
              Screening <strong>all matches</strong> of the tournament.
            </p>
          ) : screenedMatches.length === 0 ? (
            <p className="mt-2 text-sm text-ink-faint">
              No specific matches listed.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {screenedMatches.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span className="text-ink">{matchLabel(m, teamsByCode)}</span>
                  <span className="scoreboard shrink-0 text-xs text-ink-faint">
                    {STAGE_LABELS[m.stage]} · {formatKickoff(m.kickoff_utc)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          {venue.lat != null && venue.lng != null && (
            <div className="h-56 overflow-hidden rounded-2xl border border-line">
              <MiniMap venue={venue} />
            </div>
          )}
          {(() => {
            const mapLink = getVenueMapHref(venue);
            return mapLink ? (
              <a
                href={mapLink.href}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-sm font-semibold text-blue-deep underline"
              >
                {mapLink.label} →
              </a>
            ) : null;
          })()}
        </div>
      </div>
    </main>
  );
}
