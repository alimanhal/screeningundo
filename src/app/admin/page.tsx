import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/supabase/helpers";
import { VENUE_TYPE_LABELS, type VenueRow } from "@/lib/venues";
import {
  approveVenue,
  rejectVenue,
  resolveVenueReports,
  unpublishVenue,
} from "./actions";

export const metadata: Metadata = {
  title: "Moderation",
};

type ReportWithVenue = {
  id: string;
  venue_id: string;
  reason: string;
  details: string;
  created_at: string;
  venues: Pick<VenueRow, "id" | "name" | "city" | "status"> | null;
};

export default async function AdminPage() {
  if (!(await getIsAdmin())) redirect("/");

  const supabase = await createClient();
  const [{ data: pending }, { data: openReports }] = await Promise.all([
    supabase
      .from("venues")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("reports")
      .select("id, venue_id, reason, details, created_at, venues(id, name, city, status)")
      .eq("status", "open")
      .order("created_at", { ascending: true }),
  ]);

  // Group open reports by venue; most-reported first (admin priority).
  const reportsByVenue = new Map<string, ReportWithVenue[]>();
  for (const r of (openReports ?? []) as unknown as ReportWithVenue[]) {
    reportsByVenue.set(r.venue_id, [
      ...(reportsByVenue.get(r.venue_id) ?? []),
      r,
    ]);
  }
  const reportedVenues = [...reportsByVenue.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );
  const reportCount = (venueId: string) =>
    reportsByVenue.get(venueId)?.length ?? 0;

  // Reported pending venues float to the top of the queue.
  const pendingSorted = [...(pending ?? [])].sort(
    (a, b) => reportCount(b.id) - reportCount(a.id),
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="display text-2xl text-ink">Moderation</h1>
      <p className="mt-1 text-sm text-ink-soft">
        <span className="scoreboard">{pendingSorted.length}</span> pending ·{" "}
        <span className="scoreboard">{reportedVenues.length}</span> venues with
        open reports
      </p>

      <div className="rule my-6" />

      <section>
        <h2 className="text-sm font-semibold text-ink-faint">
          Pending review
        </h2>
        {pendingSorted.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink-faint">
            Queue is clear.
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {pendingSorted.map((venue) => (
              <li
                key={venue.id}
                className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/venues/${venue.id}`}
                      className="font-bold text-ink hover:text-blue-deep"
                    >
                      {venue.name}
                    </Link>
                    <p className="text-xs text-ink-faint">
                      {VENUE_TYPE_LABELS[venue.venue_type]} · {venue.address},{" "}
                      {venue.city}, {venue.country} ·{" "}
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      }).format(new Date(venue.created_at))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {reportCount(venue.id) > 0 && (
                      <span className="rounded-xl bg-red-wash px-2 py-0.5 text-xs font-bold text-red">
                        {reportCount(venue.id)} open{" "}
                        {reportCount(venue.id) === 1 ? "report" : "reports"}
                      </span>
                    )}
                    {venue.hidden_reason && (
                      <span className="rounded-xl bg-yellow-wash px-2 py-0.5 text-xs font-bold text-yellow-deep">
                        Re-review: {venue.hidden_reason}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-ink-soft">
                  {venue.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={approveVenue.bind(null, venue.id)}>
                    <button
                      type="submit"
                      className="press rounded-full bg-ink px-4 py-2 text-sm font-semibold text-surface"
                    >
                      Approve
                    </button>
                  </form>
                  <form
                    action={rejectVenue.bind(null, venue.id)}
                    className="flex flex-1 items-center gap-2"
                  >
                    <input
                      name="note"
                      placeholder="Rejection note (shown to submitter)"
                      maxLength={500}
                      className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-red"
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-red transition hover:bg-red-wash"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="rule my-8" />

      <section>
        <h2 className="text-sm font-semibold text-red">
          Open reports
        </h2>
        {reportedVenues.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink-faint">
            No open reports.
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {reportedVenues.map(([venueId, reports]) => {
              const venue = reports[0].venues;
              return (
                <li
                  key={venueId}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-ink">
                      <Link
                        href={`/venues/${venueId}`}
                        className="hover:text-blue-deep"
                      >
                        {venue?.name ?? "Unknown venue"}
                      </Link>{" "}
                      <span className="text-xs font-normal text-ink-faint">
                        {venue ? `· ${venue.city} · ${venue.status}` : ""}
                      </span>
                    </p>
                    <span className="rounded-xl bg-red-wash px-2 py-0.5 text-xs font-bold text-red">
                      {reports.length} open
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                    {reports.map((r) => (
                      <li key={r.id}>
                        <strong className="capitalize">
                          {r.reason.replace("_", " ")}
                        </strong>
                        {r.details && <> — {r.details}</>}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <form action={resolveVenueReports.bind(null, venueId)}>
                      <button
                        type="submit"
                        className="rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:border-blue hover:text-blue-deep"
                      >
                        Resolve all
                      </button>
                    </form>
                    {venue?.status === "approved" && (
                      <form
                        action={unpublishVenue.bind(null, venueId)}
                        className="flex flex-1 items-center gap-2"
                      >
                        <input
                          name="reason"
                          placeholder="Reason for unpublishing"
                          maxLength={500}
                          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-red"
                        />
                        <button
                          type="submit"
                          className="rounded-xl border border-red px-3.5 py-2 text-sm font-semibold text-red transition hover:bg-red hover:text-surface"
                        >
                          Unpublish
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
