import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/helpers";
import {
  formatKickoff,
  matchLabel,
  nextMatchForTeam,
  type MatchRow,
  type TeamRow,
} from "@/lib/matches";
import type { VenueListItem } from "@/lib/venues";
import {
  HomeExplorer,
  type FavoriteContext,
} from "@/components/home/home-explorer";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: venueRows }, { data: voteCounts }, profile] =
    await Promise.all([
      supabase.from("venues").select("*").eq("status", "approved"),
      supabase.from("venue_vote_counts").select("*"),
      getProfile(),
    ]);

  const countByVenue = new Map(
    (voteCounts ?? []).map((row) => [row.venue_id, row.vote_count]),
  );
  const venues: VenueListItem[] = (venueRows ?? []).map((venue) => ({
    ...venue,
    vote_count: countByVenue.get(venue.id) ?? 0,
  }));

  const favorite = profile?.favorite_team
    ? await buildFavoriteContext(supabase, profile.favorite_team)
    : null;

  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b-2 border-ink bg-surface px-4 py-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6">
          <div>
            <h1 className="display max-w-3xl text-3xl leading-tight text-ink sm:text-4xl">
              Where to watch the <span className="text-red">2026</span> World
              Cup <span className="text-blue">near you</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink-soft">
              Fan zones, pubs and public squares screening the matches —
              submitted by fans, verified before they go live.
            </p>
          </div>
          {/* Poster composition: the three primitives, stacked off-grid */}
          <div aria-hidden className="relative hidden h-24 w-28 shrink-0 md:block">
            <span className="absolute left-0 top-1 h-16 w-16 rounded-full border-2 border-ink bg-red" />
            <span className="absolute bottom-0 right-6 h-12 w-12 border-2 border-ink bg-blue" />
            <span
              className="absolute right-0 top-0 h-0 w-0 border-x-[26px] border-b-[46px] border-x-transparent"
              style={{ borderBottomColor: "var(--yellow)" }}
            />
          </div>
        </div>
      </section>
      <HomeExplorer venues={venues} favorite={favorite} />
    </main>
  );
}

async function buildFavoriteContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamCode: string,
): Promise<FavoriteContext | null> {
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .or(`home_team.eq.${teamCode},away_team.eq.${teamCode}`);

  const next = nextMatchForTeam(
    (matches ?? []) as MatchRow[],
    teamCode,
    new Date(),
  );
  if (!next) return null;

  // Fetch both sides of the match so the banner shows readable names.
  const codes = [
    ...new Set(
      [teamCode, next.home_team, next.away_team].filter(
        (c): c is string => c !== null,
      ),
    ),
  ];
  const [{ data: teams }, { data: explicit }] = await Promise.all([
    supabase.from("teams").select("*").in("code", codes),
    supabase.from("venue_matches").select("venue_id").eq("match_id", next.id),
  ]);

  const teamsByCode = new Map<string, TeamRow>(
    (teams ?? []).map((t) => [t.code, t]),
  );
  const team = teamsByCode.get(teamCode);
  if (!team) return null;
  return {
    teamName: team.name,
    flagEmoji: team.flag_emoji,
    kickoffLabel: `${matchLabel(next, teamsByCode)} · ${formatKickoff(next.kickoff_utc)}`,
    explicitVenueIds: (explicit ?? []).map((row) => row.venue_id),
  };
}
