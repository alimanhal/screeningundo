import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/helpers";
import {
  formatKickoff,
  matchLabel,
  nextMatchForTeam,
  type MatchRow,
  type TeamRow,
} from "@/lib/matches";
import { attachVoteCounts, type VenueListItem } from "@/lib/venues";
import {
  HomeExplorer,
  type FavoriteContext,
} from "@/components/home/home-explorer";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: venueRows }, { data: voteCounts }, profile] =
    await Promise.all([
      supabase.from("venues").select("*"),
      supabase.from("venue_vote_counts").select("*"),
      getProfile(),
    ]);

  const venues: VenueListItem[] = attachVoteCounts(venueRows, voteCounts);

  const favorite = profile?.favorite_team
    ? await buildFavoriteContext(supabase, profile.favorite_team)
    : null;

  return (
    <main className="flex flex-1 flex-col">
      <section className="hero-banner px-4 py-10 sm:py-12">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="display max-w-2xl text-3xl leading-[1.1] text-ink sm:text-[2.75rem]">
            Find a place to watch,{" "}
            <span className="text-accent">wherever you are</span>
          </h1>
          <p
            lang="ml"
            className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft"
          >
            കേരളത്തിലെ ഫുട്ബോൾ ആരാധകർക്ക് — സ്ക്രീനിംഗ് സ്ഥലങ്ങൾ ഒറ്റക്കണ്ണിൽ.
          </p>
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
