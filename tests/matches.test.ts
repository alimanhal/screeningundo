import { describe, expect, it } from "vitest";
import {
  matchLabel,
  nextMatchForTeam,
  venueScreensMatch,
  type MatchRow,
  type TeamRow,
} from "@/lib/matches";

const team = (code: string, name: string): TeamRow => ({
  code,
  name,
  group_letter: "A",
  flag_emoji: "⚽",
});

const match = (
  id: number,
  home: string | null,
  away: string | null,
  kickoff: string,
): MatchRow => ({
  id,
  match_number: id,
  stage: "group",
  home_team: home,
  away_team: away,
  kickoff_utc: kickoff,
  stadium: "Stadium",
  city: "City",
});

describe("nextMatchForTeam", () => {
  const now = new Date("2026-06-10T00:00:00Z");
  const matches = [
    match(1, "MEX", "RSA", "2026-06-11T20:00:00Z"),
    match(2, "BRA", "MEX", "2026-06-18T20:00:00Z"),
    match(3, "ARG", "FRA", "2026-06-12T20:00:00Z"),
    match(4, "MEX", "KOR", "2026-06-05T20:00:00Z"), // already played
  ];

  it("returns the earliest upcoming match for the team", () => {
    expect(nextMatchForTeam(matches, "MEX", now)?.id).toBe(1);
  });

  it("matches the team on either side", () => {
    expect(nextMatchForTeam(matches, "BRA", now)?.id).toBe(2);
    expect(nextMatchForTeam(matches, "FRA", now)?.id).toBe(3);
  });

  it("ignores matches already kicked off", () => {
    const later = new Date("2026-06-20T00:00:00Z");
    expect(nextMatchForTeam(matches, "MEX", later)).toBeNull();
  });

  it("returns null for unknown teams", () => {
    expect(nextMatchForTeam(matches, "XXX", now)).toBeNull();
  });
});

describe("venueScreensMatch", () => {
  it("is true when the venue screens all matches", () => {
    expect(
      venueScreensMatch(
        { id: "v1", screens_all_matches: true },
        7,
        new Set<string>(),
      ),
    ).toBe(true);
  });

  it("is true when the venue explicitly screens the match", () => {
    expect(
      venueScreensMatch(
        { id: "v1", screens_all_matches: false },
        7,
        new Set(["v1"]),
      ),
    ).toBe(true);
  });

  it("is false otherwise", () => {
    expect(
      venueScreensMatch(
        { id: "v1", screens_all_matches: false },
        7,
        new Set(["v2"]),
      ),
    ).toBe(false);
  });
});

describe("matchLabel", () => {
  const teamsByCode = new Map([
    ["MEX", team("MEX", "Mexico")],
    ["RSA", team("RSA", "South Africa")],
  ]);

  it("uses team names when known", () => {
    expect(
      matchLabel(match(1, "MEX", "RSA", "2026-06-11T20:00:00Z"), teamsByCode),
    ).toBe("Mexico vs South Africa");
  });

  it("falls back to TBD for null knockout slots", () => {
    expect(
      matchLabel(match(99, null, null, "2026-07-10T20:00:00Z"), teamsByCode),
    ).toBe("TBD vs TBD");
  });

  it("falls back to the raw code for unknown teams", () => {
    expect(
      matchLabel(match(2, "BRA", "MEX", "2026-06-18T20:00:00Z"), teamsByCode),
    ).toBe("BRA vs Mexico");
  });
});
