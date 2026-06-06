import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUser } from "@/lib/supabase/helpers";
import { VENUE_TYPE_LABELS } from "@/lib/venues";
import { FavoriteTeamForm } from "./favorite-team-form";

export const metadata: Metadata = {
  title: "My venues",
};

const STATUS_STYLES = {
  pending: "bg-yellow-wash text-yellow-deep",
  approved: "bg-green-wash text-green",
  rejected: "bg-red-wash text-red",
} as const;

export default async function MePage() {
  const supabase = await createClient();
  const user = await getUser();
  const profile = await getProfile();

  const [{ data: myVenues }, { data: teams }, { data: myVotes }] =
    await Promise.all([
      supabase
        .from("venues")
        .select("*")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false }),
      supabase.from("teams").select("*").order("name"),
      supabase
        .from("votes")
        .select("venues(id, name, city, status)")
        .eq("user_id", user!.id),
    ]);

  const upvoted = (myVotes ?? [])
    .map((v) => v.venues as unknown as {
      id: string;
      name: string;
      city: string;
      status: string;
    } | null)
    .filter((v): v is NonNullable<typeof v> => v !== null && v.status === "approved");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="display text-2xl text-ink">My venues</h1>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-ink-faint">
          Favorite team
        </h2>
        <div className="mt-2">
          <FavoriteTeamForm
            teams={teams ?? []}
            current={profile?.favorite_team ?? null}
          />
        </div>
      </section>

      <div className="rule my-6" />

      <section>
        <h2 className="text-sm font-semibold text-ink-faint">
          My submissions
        </h2>
        {(myVenues ?? []).length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink-soft">
            You haven&apos;t added any venues yet.{" "}
            <Link href="/submit" className="text-blue-deep underline">
              Add your first screening spot
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
            {(myVenues ?? []).map((venue) => (
              <li key={venue.id}>
                <Link
                  href={`/venues/${venue.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 transition hover:bg-blue-wash/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-ink">
                      {venue.name}
                    </span>
                    <span className="ml-2 text-xs text-ink-faint">
                      {VENUE_TYPE_LABELS[venue.venue_type]} · {venue.city}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[venue.status]}`}
                  >
                    {venue.status}
                  </span>
                </Link>
                {venue.status === "rejected" && venue.rejection_note && (
                  <p className="px-4 pb-3 text-xs text-red">
                    Note from moderators: {venue.rejection_note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {upvoted.length > 0 && (
        <>
          <div className="rule my-6" />
          <section>
            <h2 className="text-sm font-semibold text-ink-faint">
              Venues I upvoted
            </h2>
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
              {upvoted.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/venues/${v.id}`}
                    className="block px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-blue-wash/50"
                  >
                    {v.name}{" "}
                    <span className="font-normal text-ink-faint">
                      · {v.city}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
