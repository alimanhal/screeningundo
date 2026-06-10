import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  formatKickoff,
  matchLabel,
  STAGE_LABELS,
  type TeamRow,
} from "@/lib/matches";
import { attachVoteCounts, type VenueListItem } from "@/lib/venues";
import { VenueCard } from "@/components/home/venue-card";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle();
  if (!match) return { title: "Match not found" };
  return { title: `Where to watch match #${match.match_number}` };
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  const matchId = Number(id);
  if (!Number.isInteger(matchId)) notFound();

  const supabase = await createClient();
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) notFound();

  const [
    { data: teams },
    { data: allVenueRows },
    { data: voteCounts },
    { data: explicit },
  ] = await Promise.all([
    supabase.from("teams").select("*"),
    supabase.from("venues").select("*"),
    supabase.from("venue_vote_counts").select("*"),
    supabase.from("venue_matches").select("venue_id").eq("match_id", matchId),
  ]);

  const teamsByCode = new Map<string, TeamRow>(
    (teams ?? []).map((t) => [t.code, t]),
  );
  const explicitIds = new Set((explicit ?? []).map((r) => r.venue_id));

  const venues: VenueListItem[] = attachVoteCounts(allVenueRows, voteCounts)
    .filter((v) => v.screens_all_matches || explicitIds.has(v.id))
    .sort((a, b) => b.vote_count - a.vote_count);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link
        href="/matches"
        className="text-sm font-semibold text-blue-deep hover:underline"
      >
        ← All matches
      </Link>
      <h1 className="display mt-2 text-2xl text-ink">
        {matchLabel(match, teamsByCode)}
      </h1>
      <p className="scoreboard mt-1 text-sm text-ink-soft">
        {STAGE_LABELS[match.stage]} · {formatKickoff(match.kickoff_utc)} ·{" "}
        {match.stadium}, {match.city}
      </p>
      <div className="rule my-6" />

      <h2 className="text-sm font-semibold text-ink-faint">
        {venues.length}{" "}
        {venues.length === 1 ? "place is screening" : "places are screening"}{" "}
        this match
      </h2>

      {venues.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-line bg-surface px-4 py-10 text-center">
          <p className="font-semibold text-ink">No venues yet.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Know a place showing this match?{" "}
            <Link href="/submit" className="text-blue-deep underline">
              Add it
            </Link>{" "}
            and help fellow fans.
          </p>
        </div>
      ) : (
        <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
          {venues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              distanceKm={null}
              highlight={null}
            />
          ))}
        </div>
      )}
    </main>
  );
}
