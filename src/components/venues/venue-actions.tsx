"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitReport, toggleVote } from "@/app/venues/[id]/actions";

export function VenueActions({
  venueId,
  voteCount,
  hasVoted,
  isSignedIn,
}: {
  venueId: string;
  voteCount: number;
  hasVoted: boolean;
  isSignedIn: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportResult, setReportResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  // Optimistic display
  const displayCount = voteCount;

  function handleVote() {
    startTransition(() => toggleVote(venueId));
  }

  function handleReport(formData: FormData) {
    startTransition(async () => {
      const result = await submitReport(venueId, formData);
      setReportResult(result);
      if (result.ok) setReportOpen(false);
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {isSignedIn ? (
          <button
            type="button"
            onClick={handleVote}
            disabled={isPending}
            aria-pressed={hasVoted}
            className={`scoreboard rounded-full px-3 py-1.5 text-sm transition disabled:opacity-60 ${
              hasVoted
                ? "bg-pitch text-paper"
                : "bg-pitch-wash text-pitch-deep hover:bg-pitch hover:text-paper"
            }`}
            title={hasVoted ? "Remove upvote" : "Upvote this venue"}
          >
            ▲ {displayCount}
          </button>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(`/venues/${venueId}`)}`}
            className="scoreboard rounded-full bg-pitch-wash px-3 py-1.5 text-sm text-pitch-deep transition hover:bg-pitch hover:text-paper"
            title="Sign in to upvote"
          >
            ▲ {displayCount}
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            setReportOpen((o) => !o);
            setReportResult(null);
          }}
          className="rounded-full border border-line-strong px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:border-danger hover:text-danger"
        >
          Report
        </button>
      </div>

      {reportOpen &&
        (isSignedIn ? (
          <form
            action={handleReport}
            className="mt-3 space-y-2 rounded-xl border border-line bg-paper-raised p-3"
          >
            <label className="block text-xs font-semibold text-ink">
              What&apos;s wrong?
              <select
                name="reason"
                required
                className="mt-1 w-full rounded-lg border border-line-strong bg-paper px-2 py-1.5 text-sm font-normal"
              >
                <option value="outdated">Outdated info</option>
                <option value="wrong_info">Wrong info</option>
                <option value="closed">Permanently closed</option>
                <option value="inappropriate">Inappropriate</option>
                <option value="other">Other</option>
              </select>
            </label>
            <textarea
              name="details"
              rows={2}
              maxLength={500}
              placeholder="Details (optional)"
              className="w-full rounded-lg border border-line-strong bg-paper px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-danger px-3 py-1.5 text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Sending…" : "Send report"}
            </button>
          </form>
        ) : (
          <p className="mt-2 text-xs text-ink-faint">
            <Link
              href={`/login?next=${encodeURIComponent(`/venues/${venueId}`)}`}
              className="text-pitch-deep underline"
            >
              Sign in
            </Link>{" "}
            to report this venue.
          </p>
        ))}

      {reportResult && (
        <p
          className={`mt-2 text-xs ${reportResult.ok ? "text-pitch-deep" : "text-danger"}`}
        >
          {reportResult.message}
        </p>
      )}
    </div>
  );
}
