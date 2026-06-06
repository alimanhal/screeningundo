import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Live RLS policy checks — run only when a Supabase project is configured:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npm test
 *
 * These verify the verification model from the anonymous client's
 * perspective: pending venues must be invisible and unwritable.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasEnv = Boolean(url && anonKey);

describe.skipIf(!hasEnv)("RLS (anonymous client)", () => {
  const anon = () => createClient<Database>(url!, anonKey!);

  it("cannot see pending or rejected venues", async () => {
    const { data, error } = await anon()
      .from("venues")
      .select("id, status")
      .neq("status", "approved");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("cannot insert a venue while signed out", async () => {
    const { error } = await anon().from("venues").insert({
      name: "RLS probe",
      description: "should fail",
      address: "x",
      city: "x",
      country: "x",
      lat: 0,
      lng: 0,
      venue_type: "other",
      indoor_outdoor: "indoor",
      created_by: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("cannot insert a venue pre-approved even with a spoofed status", async () => {
    const { error } = await anon().from("venues").insert({
      name: "RLS probe approved",
      description: "should fail",
      address: "x",
      city: "x",
      country: "x",
      lat: 0,
      lng: 0,
      venue_type: "other",
      indoor_outdoor: "indoor",
      status: "approved",
      created_by: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("cannot read admin_users (deny-all)", async () => {
    const { data, error } = await anon().from("admin_users").select("user_id");
    // Either an error or an empty result is acceptable deny behavior.
    expect(error !== null || data?.length === 0).toBe(true);
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
