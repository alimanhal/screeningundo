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

      <div className="pitch-divider my-6" />

      <section>
        <h2 className="display text-sm tracking-wide text-pitch-deep">
          Pending review
        </h2>
        {pendingSorted.length === 0 ? (
          <p className="mt-3 rounded-xl border border-line bg-paper-raised px-4 py-8 text-center text-sm text-ink-faint">
            Queue is clear. ⚽
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {pendingSorted.map((venue) => (
              <li
                key={venue.id}
                className="rounded-xl border border-line bg-paper-raised p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/venues/${venue.id}`}
                      className="font-bold text-ink hover:text-pitch-deep"
                    >
                      {venue.name}
                    </Link>
                    <p className="text-xs text-ink-faint">
                      {VENUE_TYPE_LABELS[venue.venue_type]} · {venue.address},{" "}
                      {venue.city}, {venue.country} ·{" "}
                      {new Date(venue.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {reportCount(venue.id) > 0 && (
                      <span className="rounded-full bg-danger-wash px-2 py-0.5 text-xs font-bold text-danger">
                        {reportCount(venue.id)} open{" "}
                        {reportCount(venue.id) === 1 ? "report" : "reports"}
                      </span>
                    )}
                    {venue.hidden_reason && (
                      <span className="rounded-full bg-gold-wash px-2 py-0.5 text-xs font-bold text-gold-deep">
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
                      className="rounded-lg bg-pitch px-4 py-1.5 text-sm font-semibold text-paper transition hover:bg-pitch-deep"
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
                      className="min-w-0 flex-1 rounded-lg border border-line-strong bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-danger"
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-danger px-4 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger hover:text-paper"
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

      <div className="pitch-divider my-8" />

      <section>
        <h2 className="display text-sm tracking-wide text-danger">
          Open reports
        </h2>
        {reportedVenues.length === 0 ? (
          <p className="mt-3 rounded-xl border border-line bg-paper-raised px-4 py-8 text-center text-sm text-ink-faint">
            No open reports.
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {reportedVenues.map(([venueId, reports]) => {
              const venue = reports[0].venues;
              return (
                <li
                  key={venueId}
                  className="rounded-xl border border-line bg-paper-raised p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-ink">
                      <Link
                        href={`/venues/${venueId}`}
                        className="hover:text-pitch-deep"
                      >
                        {venue?.name ?? "Unknown venue"}
                      </Link>{" "}
                      <span className="text-xs font-normal text-ink-faint">
                        {venue ? `· ${venue.city} · ${venue.status}` : ""}
                      </span>
                    </p>
                    <span className="rounded-full bg-danger-wash px-2 py-0.5 text-xs font-bold text-danger">
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
                        className="rounded-lg border border-line-strong px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:border-pitch hover:text-pitch-deep"
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
                          className="min-w-0 flex-1 rounded-lg border border-line-strong bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-danger"
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-danger px-3 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger hover:text-paper"
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
