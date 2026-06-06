import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/helpers";
import {
  INDOOR_OUTDOOR_LABELS,
  VENUE_TYPE_LABELS,
  type VenueListItem,
} from "@/lib/venues";
import {
  formatKickoff,
  matchLabel,
  STAGE_LABELS,
  type MatchRow,
} from "@/lib/matches";
import { MiniMap } from "@/components/map/mini-map";
import { ShareButton } from "@/components/venues/share-button";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: venue } = await supabase
    .from("venues")
    .select("name, city, country")
    .eq("id", id)
    .maybeSingle();
  if (!venue) return { title: "Venue not found" };
  return {
    title: `${venue.name} — ${venue.city}`,
    description: `Watch 2026 World Cup matches at ${venue.name}, ${venue.city}, ${venue.country}.`,
  };
}

export default async function VenuePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: venueRow } = await supabase
    .from("venues")
    .select("*, votes(count)")
    .eq("id", id)
    .maybeSingle();
  if (!venueRow) notFound();

  const { votes, ...rest } = venueRow;
  const venue: VenueListItem = { ...rest, vote_count: votes?.[0]?.count ?? 0 };

  const user = await getUser();
  const isOwner = user?.id === venue.created_by;

  let screenedMatches: MatchRow[] = [];
  const teamsByCode = new Map<
    string,
    { code: string; name: string; group_letter: string; flag_emoji: string }
  >();
  if (!venue.screens_all_matches) {
    const [{ data: vm }, { data: teams }] = await Promise.all([
      supabase
        .from("venue_matches")
        .select("matches(*)")
        .eq("venue_id", venue.id),
      supabase.from("teams").select("*"),
    ]);
    screenedMatches = (vm ?? [])
      .map((row) => row.matches as unknown as MatchRow)
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime(),
      );
    for (const t of teams ?? []) teamsByCode.set(t.code, t);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      {isOwner && venue.status !== "approved" && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${
            venue.status === "pending"
              ? "bg-gold-wash text-gold-deep"
              : "bg-danger-wash text-danger"
          }`}
        >
          {venue.status === "pending" ? (
            <>
              <strong>Pending review.</strong> Only you (and moderators) can
              see this page until it&apos;s approved.
            </>
          ) : (
            <>
              <strong>Rejected.</strong>{" "}
              {venue.rejection_note ?? "This venue was not approved."}
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="display text-3xl text-ink">{venue.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {venue.address} · {venue.city}, {venue.country}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="scoreboard rounded-full bg-pitch-wash px-3 py-1.5 text-sm text-pitch-deep">
            ▲ {venue.vote_count}
          </span>
          <ShareButton title={venue.name} />
        </div>
      </div>

      <p className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
        <span className="rounded bg-pitch-wash px-1.5 py-0.5 text-pitch-deep">
          {VENUE_TYPE_LABELS[venue.venue_type]}
        </span>
        <span className="rounded bg-pitch-wash px-1.5 py-0.5 text-pitch-deep">
          {INDOOR_OUTDOOR_LABELS[venue.indoor_outdoor]}
        </span>
        {venue.is_free_entry && (
          <span className="rounded bg-pitch-wash px-1.5 py-0.5 text-pitch-deep">
            Free entry
          </span>
        )}
        {venue.big_screen && (
          <span className="rounded bg-pitch-wash px-1.5 py-0.5 text-pitch-deep">
            Big screen
          </span>
        )}
        {venue.food_available && (
          <span className="rounded bg-pitch-wash px-1.5 py-0.5 text-pitch-deep">
            Food
          </span>
        )}
        {venue.family_friendly && (
          <span className="rounded bg-pitch-wash px-1.5 py-0.5 text-pitch-deep">
            Family friendly
          </span>
        )}
        {venue.capacity_estimate && (
          <span className="rounded bg-pitch-wash px-1.5 py-0.5 text-pitch-deep">
            ~{venue.capacity_estimate.toLocaleString()} people
          </span>
        )}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">
            {venue.description}
          </p>

          <h2 className="display mt-8 text-lg text-ink">Matches screened</h2>
          {venue.screens_all_matches ? (
            <p className="mt-2 rounded-lg bg-pitch-wash/60 px-3 py-2 text-sm text-pitch-deep">
              ⚽ Screening <strong>all matches</strong> of the tournament.
            </p>
          ) : screenedMatches.length === 0 ? (
            <p className="mt-2 text-sm text-ink-faint">
              No specific matches listed.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
              {screenedMatches.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span className="text-ink">{matchLabel(m, teamsByCode)}</span>
                  <span className="scoreboard shrink-0 text-xs text-ink-faint">
                    {STAGE_LABELS[m.stage]} · {formatKickoff(m.kickoff_utc)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          {venue.photo_url && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line">
              <Image
                src={venue.photo_url}
                alt={venue.name}
                fill
                sizes="(min-width: 768px) 320px, 100vw"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="h-56 overflow-hidden rounded-xl border border-line">
            <MiniMap venue={venue} />
          </div>
          <a
            href={`https://www.openstreetmap.org/?mlat=${venue.lat}&mlon=${venue.lng}#map=17/${venue.lat}/${venue.lng}`}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-sm font-semibold text-pitch-deep underline"
          >
            Open in OpenStreetMap →
          </a>
        </div>
      </div>
    </main>
  );
}
