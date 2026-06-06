import type { Database } from "@/types/database";

export type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

export const STAGE_LABELS: Record<MatchRow["stage"], string> = {
  group: "Group stage",
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-final",
  sf: "Semi-final",
  third: "Third place",
  final: "Final",
};

/** Next upcoming match (kickoff after `now`) involving the given team. */
export function nextMatchForTeam(
  matches: MatchRow[],
  teamCode: string,
  now: Date,
): MatchRow | null {
  const upcoming = matches
    .filter(
      (m) =>
        (m.home_team === teamCode || m.away_team === teamCode) &&
        new Date(m.kickoff_utc).getTime() > now.getTime(),
    )
    .sort(
      (a, b) =>
        new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime(),
    );
  return upcoming[0] ?? null;
}

/**
 * Does a venue screen the given match? True when it screens all matches or
 * the match is in its explicit list.
 */
export function venueScreensMatch(
  venue: { id: string; screens_all_matches: boolean },
  matchId: number,
  explicitVenueIdsForMatch: ReadonlySet<string>,
): boolean {
  return venue.screens_all_matches || explicitVenueIdsForMatch.has(venue.id);
}

export function matchLabel(
  match: MatchRow,
  teamsByCode: ReadonlyMap<string, TeamRow>,
): string {
  const name = (code: string | null) =>
    code ? (teamsByCode.get(code)?.name ?? code) : "TBD";
  return `${name(match.home_team)} vs ${name(match.away_team)}`;
}

/**
 * Kickoff labels are always rendered in UTC: deterministic across server
 * and client (no hydration mismatch) and unambiguous for a global audience.
 */
export function formatKickoff(iso: string): string {
  const label = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(iso));
  return `${label} UTC`;
}
