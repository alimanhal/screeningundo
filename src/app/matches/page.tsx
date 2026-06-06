import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/helpers";
import { STAGE_LABELS, type MatchRow, type TeamRow } from "@/lib/matches";

export const metadata: Metadata = {
  title: "Match schedule",
};

export default async function MatchesPage() {
  const supabase = await createClient();
  const [{ data: matches }, { data: teams }, profile] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_utc"),
    supabase.from("teams").select("*"),
    getProfile(),
  ]);

  const teamsByCode = new Map((teams ?? []).map((t) => [t.code, t]));
  const favorite = profile?.favorite_team ?? null;

  const byDate = new Map<string, MatchRow[]>();
  for (const m of matches ?? []) {
    const day = new Intl.DateTimeFormat("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(m.kickoff_utc));
    byDate.set(day, [...(byDate.get(day) ?? []), m]);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="display text-2xl text-ink">Match schedule</h1>
      <p className="mt-1 text-sm text-ink-soft">
        All 104 matches, times in UTC. Pick one to see where it&apos;s being
        screened.
        {favorite && teamsByCode.get(favorite) && (
          <>
            {" "}
            Your team{" "}
            <strong className="text-yellow-deep">
              {teamsByCode.get(favorite)!.flag_emoji}{" "}
              {teamsByCode.get(favorite)!.name}
            </strong>{" "}
            is highlighted.
          </>
        )}
      </p>
      <div className="rule my-6" />

      {byDate.size === 0 && (
        <p className="rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink-faint">
          The match schedule hasn&apos;t been loaded yet — run the seed
          scripts in <code>supabase/seed/</code>.
        </p>
      )}

      <div className="space-y-8">
        {[...byDate.entries()].map(([day, dayMatches]) => (
          <section key={day}>
            <h2 className="text-sm font-semibold text-ink-faint">
              {day}
            </h2>
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
              {dayMatches.map((m) => (
                <MatchRowItem
                  key={m.id}
                  match={m}
                  teamsByCode={teamsByCode}
                  favorite={favorite}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

function MatchRowItem({
  match,
  teamsByCode,
  favorite,
}: {
  match: MatchRow;
  teamsByCode: Map<string, TeamRow>;
  favorite: string | null;
}) {
  const isFavMatch =
    favorite !== null &&
    (match.home_team === favorite || match.away_team === favorite);

  const side = (code: string | null) => {
    const team = code ? teamsByCode.get(code) : null;
    return team ? `${team.flag_emoji} ${team.name}` : "TBD";
  };

  const time = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(match.kickoff_utc));

  return (
    <li className={isFavMatch ? "bg-yellow-wash/70" : ""}>
      <Link
        href={`/matches/${match.id}`}
        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-blue-wash/50"
      >
        <span className="scoreboard w-14 shrink-0 text-sm text-blue-deep">
          {time}
        </span>
        <span className="min-w-0 flex-1 font-semibold text-ink">
          {isFavMatch && <span className="mr-1 text-yellow-deep">⭐</span>}
          {side(match.home_team)}{" "}
          <span className="font-normal text-ink-faint">vs</span>{" "}
          {side(match.away_team)}
        </span>
        <span className="hidden text-xs text-ink-faint sm:block">
          {STAGE_LABELS[match.stage]} · {match.city}
        </span>
        <span className="text-sm font-semibold text-blue-deep">
          Where to watch →
        </span>
      </Link>
    </li>
  );
}
