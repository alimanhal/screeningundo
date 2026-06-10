import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUser } from "@/lib/supabase/helpers";
import { FavoriteTeamForm } from "./favorite-team-form";

export const metadata: Metadata = {
  title: "My account",
};

export default async function MePage() {
  const supabase = await createClient();
  const user = await getUser();
  const profile = await getProfile();

  const [{ data: teams }, { data: myVotes }] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    supabase
      .from("votes")
      .select("venues(id, name, city)")
      .eq("user_id", user!.id),
  ]);

  const upvoted = (myVotes ?? [])
    .map(
      (v) =>
        v.venues as unknown as {
          id: string;
          name: string;
          city: string | null;
        } | null,
    )
    .filter((v): v is NonNullable<typeof v> => v !== null);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="display text-2xl text-ink">My account</h1>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-ink-faint">Favorite team</h2>
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
          Venues I upvoted
        </h2>
        {upvoted.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink-soft">
            You haven&apos;t upvoted any venues yet.{" "}
            <Link href="/" className="text-blue-deep underline">
              Browse venues
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
            {upvoted.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/venues/${v.id}`}
                  className="block px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-blue-wash/50"
                >
                  {v.name}
                  {v.city && (
                    <span className="font-normal text-ink-faint">
                      {" "}· {v.city}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
