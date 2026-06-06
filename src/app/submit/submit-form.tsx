"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/images";
import { VENUE_TYPE_LABELS, type LatLng, type VenueType } from "@/lib/venues";
import {
  formatKickoff,
  matchLabel,
  type MatchRow,
  type TeamRow,
} from "@/lib/matches";
import type { GeocodeResult } from "@/app/api/geocode/route";

const LocationPicker = dynamic(
  () =>
    import("@/components/map/location-picker").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-pitch-wash text-sm text-ink-faint">
        Loading map…
      </div>
    ),
  },
);

const inputClass =
  "mt-1 w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-pitch focus:ring-2 focus:ring-pitch/15";
const labelClass = "block text-sm font-semibold text-ink";

export function SubmitForm({
  matches,
  teams,
}: {
  matches: MatchRow[];
  teams: TeamRow[];
}) {
  const teamsByCode = new Map(teams.map((t) => [t.code, t]));

  const [position, setPosition] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 30, lng: -40 });
  const [screensAll, setScreensAll] = useState(true);
  const [selectedMatches, setSelectedMatches] = useState<Set<number>>(
    new Set(),
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  // Nominatim search (debounced ≥1.1s per OSMF policy; pin-drop is primary)
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchInput(q: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const { results } = (await res.json()) as {
            results: GeocodeResult[];
          };
          setSearchResults(results);
        }
      } catch {
        // Search is best-effort; pin-drop still works.
      }
    }, 1100);
  }

  function pickSearchResult(r: GeocodeResult) {
    const pos = { lat: r.lat, lng: r.lng };
    setPosition(pos);
    setMapCenter(pos);
    setSearchResults([]);
  }

  function toggleMatch(id: number) {
    setSelectedMatches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    // Honeypot: bots fill hidden fields; pretend success.
    if ((data.get("website") as string)?.length) {
      setState("done");
      return;
    }
    if (!position) {
      setError("Drop a pin on the map to mark the exact location.");
      return;
    }
    if (!screensAll && selectedMatches.size === 0) {
      setError("Select at least one match, or switch back to all matches.");
      return;
    }

    setState("saving");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Your session expired — please sign in again.");
      setState("error");
      return;
    }

    try {
      let photoUrl: string | null = null;
      if (photo) {
        const blob = await compressImage(photo);
        const path = `${user.id}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("venue-photos")
          .upload(path, blob, { contentType: "image/webp" });
        if (uploadError) throw new Error(uploadError.message);
        photoUrl = supabase.storage.from("venue-photos").getPublicUrl(path)
          .data.publicUrl;
      }

      const { data: venue, error: insertError } = await supabase
        .from("venues")
        .insert({
          name: (data.get("name") as string).trim(),
          description: (data.get("description") as string).trim(),
          address: (data.get("address") as string).trim(),
          city: (data.get("city") as string).trim(),
          country: (data.get("country") as string).trim(),
          lat: position.lat,
          lng: position.lng,
          venue_type: data.get("venue_type") as VenueType,
          capacity_estimate: data.get("capacity_estimate")
            ? Number(data.get("capacity_estimate"))
            : null,
          is_free_entry: data.get("is_free_entry") === "on",
          indoor_outdoor: data.get("indoor_outdoor") as
            | "indoor"
            | "outdoor"
            | "both",
          big_screen: data.get("big_screen") === "on",
          food_available: data.get("food_available") === "on",
          family_friendly: data.get("family_friendly") === "on",
          screens_all_matches: screensAll,
          photo_url: photoUrl,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (insertError) throw new Error(insertError.message);

      if (!screensAll && venue) {
        const { error: matchError } = await supabase
          .from("venue_matches")
          .insert(
            [...selectedMatches].map((match_id) => ({
              venue_id: venue.id,
              match_id,
            })),
          );
        if (matchError) throw new Error(matchError.message);
      }

      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-line bg-pitch-wash/60 p-8 text-center">
        <p className="display text-xl text-pitch-deep">Submitted ⚽</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
          Thanks! Your venue is now <strong>pending review</strong>. It will
          appear publicly once a moderator approves it — track its status in{" "}
          <Link href="/me" className="text-pitch-deep underline">
            My venues
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`${labelClass} sm:col-span-2`}>
          Venue name *
          <input
            name="name"
            required
            maxLength={120}
            placeholder="e.g. Riverside Fan Zone"
            className={inputClass}
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Description *
          <textarea
            name="description"
            required
            rows={3}
            maxLength={1000}
            placeholder="What's the vibe? Screen size, atmosphere, when to arrive…"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Venue type *
          <select name="venue_type" required className={inputClass}>
            {Object.entries(VENUE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Indoor / outdoor *
          <select name="indoor_outdoor" required className={inputClass}>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
            <option value="both">Both</option>
          </select>
        </label>
        <label className={labelClass}>
          Estimated capacity
          <input
            name="capacity_estimate"
            type="number"
            min={1}
            max={500000}
            placeholder="e.g. 250"
            className={inputClass}
          />
        </label>
        <fieldset className="flex flex-wrap items-end gap-4 pb-1 text-sm font-medium text-ink-soft">
          {(
            [
              ["is_free_entry", "Free entry"],
              ["big_screen", "Big screen"],
              ["food_available", "Food"],
              ["family_friendly", "Family friendly"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="flex items-center gap-1.5">
              <input type="checkbox" name={name} className="accent-pitch" />
              {label}
            </label>
          ))}
        </fieldset>
      </div>

      <div className="pitch-divider" />

      {/* Location */}
      <div>
        <p className={labelClass}>Location *</p>
        <p className="mt-0.5 text-xs text-ink-faint">
          Click the map (or drag the pin) to mark the exact spot. The address
          search can help you get close.
        </p>
        <div className="relative mt-2">
          <input
            type="search"
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search address or place (optional)…"
            aria-label="Search address"
            className={inputClass}
          />
          {searchResults.length > 0 && (
            <ul className="absolute z-[1200] mt-1 w-full overflow-hidden rounded-lg border border-line bg-paper-raised shadow-lg">
              {searchResults.map((r) => (
                <li key={`${r.lat},${r.lng}`}>
                  <button
                    type="button"
                    onClick={() => pickSearchResult(r)}
                    className="w-full px-3 py-2 text-left text-sm text-ink-soft hover:bg-pitch-wash"
                  >
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-2 h-72 overflow-hidden rounded-xl border border-line">
          <LocationPicker
            value={position}
            onChange={setPosition}
            center={mapCenter}
          />
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          {position
            ? `Pinned at ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
            : "No pin yet."}
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <label className={`${labelClass} sm:col-span-1`}>
            Address *
            <input name="address" required maxLength={200} className={inputClass} />
          </label>
          <label className={labelClass}>
            City *
            <input name="city" required maxLength={80} className={inputClass} />
          </label>
          <label className={labelClass}>
            Country *
            <input name="country" required maxLength={80} className={inputClass} />
          </label>
        </div>
      </div>

      <div className="pitch-divider" />

      {/* Matches */}
      <div>
        <p className={labelClass}>Which matches are screened?</p>
        <div className="mt-2 flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setScreensAll(true)}
            className={`rounded-full px-3 py-1.5 font-semibold transition ${
              screensAll
                ? "bg-pitch-deep text-paper"
                : "border border-line-strong text-ink-soft"
            }`}
          >
            All matches
          </button>
          <button
            type="button"
            onClick={() => setScreensAll(false)}
            className={`rounded-full px-3 py-1.5 font-semibold transition ${
              !screensAll
                ? "bg-pitch-deep text-paper"
                : "border border-line-strong text-ink-soft"
            }`}
          >
            Specific matches
          </button>
        </div>
        {!screensAll && (
          <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-line">
            {matches.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2 text-sm last:border-b-0 hover:bg-pitch-wash/50"
              >
                <input
                  type="checkbox"
                  checked={selectedMatches.has(m.id)}
                  onChange={() => toggleMatch(m.id)}
                  className="accent-pitch"
                />
                <span className="flex-1 text-ink">
                  {matchLabel(m, teamsByCode)}
                </span>
                <span className="scoreboard text-xs text-ink-faint">
                  {formatKickoff(m.kickoff_utc)}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="pitch-divider" />

      {/* Photo */}
      <label className={labelClass}>
        Photo (optional)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-pitch-wash file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-pitch-deep"
        />
        <span className="mt-1 block text-xs font-normal text-ink-faint">
          Compressed in your browser before upload.
        </span>
      </label>

      {error && (
        <p className="rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "saving"}
        className="w-full rounded-xl bg-pitch px-4 py-3 font-bold text-paper transition hover:bg-pitch-deep disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {state === "saving" ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
