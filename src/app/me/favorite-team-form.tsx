"use client";

import { useTransition } from "react";
import type { TeamRow } from "@/lib/matches";
import { updateFavoriteTeam } from "./actions";

export function FavoriteTeamForm({
  teams,
  current,
}: {
  teams: TeamRow[];
  current: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => updateFavoriteTeam(formData))}
      className="flex flex-wrap items-center gap-2"
    >
      <select
        name="favorite_team"
        defaultValue={current ?? ""}
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/15"
      >
        <option value="">No favorite team</option>
        {teams.map((t) => (
          <option key={t.code} value={t.code}>
            {t.flag_emoji} {t.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary press rounded-full px-4 py-2 text-sm disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      {current && (
        <span className="text-xs text-ink-faint">
          Venues screening your team&apos;s next match get a ⭐ on the home
          page.
        </span>
      )}
    </form>
  );
}
