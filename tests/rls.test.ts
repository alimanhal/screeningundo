import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Live RLS policy checks — run only when a Supabase project is configured:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npm test
 *
 * Verifies the open-submission model: anonymous clients can read and insert
 * venues without restriction; votes/reports still require an authenticated
 * session and are own-row only.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasEnv = Boolean(url && anonKey);

describe.skipIf(!hasEnv)("RLS (anonymous client)", () => {
  const anon = () => createClient<Database>(url!, anonKey!);

  it("can read venues without signing in", async () => {
    const { error } = await anon().from("venues").select("id").limit(1);
    expect(error).toBeNull();
  });

  it("can insert a venue while signed out", async () => {
    const probeName = `RLS probe ${crypto.randomUUID()}`;
    const { data, error } = await anon()
      .from("venues")
      .insert({
        name: probeName,
        description: "anon insert probe",
        address: "x",
        city: "x",
        country: "x",
        lat: 0,
        lng: 0,
        venue_type: "other",
        indoor_outdoor: "indoor",
        gmaps_link: "https://maps.example.com/probe",
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();

    // Cleanup: delete is locked down for anon by default, so leave the row;
    // tests with a service role can purge them.
  });

  it("cannot insert a vote while signed out", async () => {
    const { error } = await anon().from("votes").insert({
      venue_id: "00000000-0000-0000-0000-000000000000",
      user_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("cannot enumerate vote rows (voter privacy)", async () => {
    const { data, error } = await anon().from("votes").select("user_id");
    expect(error !== null || data?.length === 0).toBe(true);
  });

  it("can read aggregate vote counts via the view", async () => {
    const { error } = await anon().from("venue_vote_counts").select("*");
    expect(error).toBeNull();
  });

  it("can read teams and matches publicly", async () => {
    const { data, error } = await anon().from("teams").select("code").limit(1);
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });
});

describe.skipIf(hasEnv)("RLS (skipped)", () => {
  it("skipped — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to run live RLS checks", () => {
    expect(true).toBe(true);
  });
});
