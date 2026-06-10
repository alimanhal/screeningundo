"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitReport, toggleVote } from "@/app/venues/[id]/actions";
import { loginUrl } from "@/lib/auth/redirect";
import { FootballLoader } from "@/components/ui/football-loader";

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
            className={`scoreboard rounded-xl px-3.5 py-2 text-sm transition disabled:opacity-60 ${
              hasVoted
                ? "pill-active"
                : "bg-blue-wash text-blue-deep hover:bg-blue/15"
            }`}
            title={hasVoted ? "Remove upvote" : "Upvote this venue"}
          >
            ▲ {voteCount}
          </button>
        ) : (
          <Link
            href={loginUrl(`/venues/${venueId}`)}
            className="scoreboard rounded-xl bg-blue-wash px-3.5 py-2 text-sm text-blue-deep transition hover:bg-blue/20"
            title="Sign in to upvote"
          >
            ▲ {voteCount}
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            setReportOpen((o) => !o);
            setReportResult(null);
          }}
          className="rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:border-red hover:text-red"
        >
          Report
        </button>
      </div>

      {reportOpen &&
        (isSignedIn ? (
          <form
            action={handleReport}
            className="mt-3 space-y-2 rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-card)]"
          >
            <label className="block text-xs font-semibold text-ink">
              What&apos;s wrong?
              <select
                name="reason"
                required
                className="mt-1 w-full rounded-xl border border-line bg-paper px-2 py-1.5 text-sm font-normal"
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
              className="w-full rounded-xl border border-line bg-paper px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-red px-3.5 py-2 text-sm font-semibold text-surface transition hover:opacity-90 disabled:opacity-60"
            >
              {isPending && <FootballLoader size="sm" variant="spin" />}
              {isPending ? "Sending…" : "Send report"}
            </button>
          </form>
        ) : (
          <p className="mt-2 text-xs text-ink-faint">
            <Link
              href={loginUrl(`/venues/${venueId}`)}
              className="text-blue-deep underline"
            >
              Sign in
            </Link>{" "}
            to report this venue.
          </p>
        ))}

      {reportResult && (
        <p
          className={`mt-2 text-xs ${reportResult.ok ? "text-blue-deep" : "text-red"}`}
        >
          {reportResult.message}
        </p>
      )}
    </div>
  );
}
