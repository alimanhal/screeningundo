"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  parseGmapsCoords,
  VENUE_TYPE_LABELS,
  type LatLng,
  type VenueType,
} from "@/lib/venues";
import {
  formatKickoff,
  matchLabel,
  type MatchRow,
  type TeamRow,
} from "@/lib/matches";
import type { GeocodeResult } from "@/app/api/geocode/route";
import type { ReverseGeocodeResult } from "@/app/api/geocode/reverse/route";

const LocationPicker = dynamic(
  () =>
    import("@/components/map/location-picker").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-blue-wash text-sm text-ink-faint">
        Loading map…
      </div>
    ),
  },
);

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base text-ink outline-none placeholder:text-ink-faint focus:border-blue focus:ring-2 focus:ring-blue/15 sm:text-sm";
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
  // `flyTarget` is consumed imperatively by LocationPicker — every new
  // object reference triggers a fresh flyTo. Keep it distinct from
  // `position` so dragging the pin doesn't re-pan the camera.
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
  // The single required location field. Users either type a place,
  // drop/drag a pin (auto-filled via reverse geocode), or hit
  // "Add location" (GPS → reverse geocode).
  const [locationText, setLocationText] = useState("");
  const [locating, setLocating] = useState(false);
  const [screensAll, setScreensAll] = useState(true);
  const [selectedMatches, setSelectedMatches] = useState<Set<number>>(
    new Set(),
  );
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  // Nominatim search (debounced ≥1.1s per OSMF policy; pin-drop is primary)
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the most recent reverse-geocode request so out-of-order
  // responses (e.g. user moves pin twice fast) can't overwrite the
  // text box with a stale address.
  const reverseSeq = useRef(0);

  function handleSearchInput(q: string) {
    setLocationText(q);
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

  /**
   * Reverse-geocode the given coords and fill the location text box.
   * Failure is non-fatal: we fall back to a "lat, lng" string so the
   * required field is still satisfied and the form remains submittable.
   */
  const reverseGeocodeInto = useCallback(async (pos: LatLng) => {
    const seq = ++reverseSeq.current;
    const fallback = `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
    try {
      const res = await fetch(
        `/api/geocode/reverse?lat=${pos.lat}&lng=${pos.lng}`,
      );
      if (seq !== reverseSeq.current) return; // a newer pin won
      if (res.ok) {
        const { result } = (await res.json()) as {
          result: ReverseGeocodeResult | null;
        };
        setLocationText(result?.display_name ?? fallback);
      } else {
        setLocationText(fallback);
      }
    } catch {
      if (seq === reverseSeq.current) setLocationText(fallback);
    }
  }, []);

  function handlePinChange(pos: LatLng) {
    setPosition(pos);
    setSearchResults([]);
    void reverseGeocodeInto(pos);
  }

  function pickSearchResult(r: GeocodeResult) {
    const pos = { lat: r.lat, lng: r.lng };
    setPosition(pos);
    setFlyTarget({ ...pos }); // fresh ref → triggers map flyTo
    setLocationText(r.display_name);
    setSearchResults([]);
    // Bump the reverse-geocode sequence so any in-flight reverse call
    // from a previous pin can't clobber the address we just wrote.
    reverseSeq.current++;
  }

  function handleLocateMe() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation isn't available in this browser.");
      return;
    }
    setError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (geo) => {
        const pos = { lat: geo.coords.latitude, lng: geo.coords.longitude };
        setPosition(pos);
        setFlyTarget({ ...pos });
        setSearchResults([]);
        setLocating(false);
        void reverseGeocodeInto(pos);
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Drop a pin or type an address instead."
            : "Couldn't get your location. Drop a pin or type an address instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
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
    if (!screensAll && selectedMatches.size === 0) {
      setError("Select at least one match, or switch back to all matches.");
      return;
    }

    // Coordinate fallback chain: dropped pin → parsed Google Maps URL → null.
    const gmapsLink = (data.get("gmaps_link") as string).trim();
    const fromGmaps = gmapsLink ? parseGmapsCoords(gmapsLink) : null;
    const coords = position ?? fromGmaps;

    // Google Maps link is required so every venue card always has a
    // "Open in Maps" target — no OSM fallback for new submissions.
    if (!gmapsLink) {
      setError(
        "Paste a Google Maps link — it's how visitors will open directions to your venue.",
      );
      return;
    }

    // Location is required: at least typed text, a pin, or a parsed
    // gmaps coordinate. Address/city/country remain optional.
    if (!locationText.trim() && !coords) {
      setError(
        "Add a location — type a place, drop a pin on the map, or use Add location.",
      );
      return;
    }

    setState("saving");
    const supabase = createClient();

    try {
      const { data: venue, error: insertError } = await supabase
        .from("venues")
        .insert({
          name: (data.get("name") as string).trim(),
          description: (data.get("description") as string).trim(),
          address: (data.get("address") as string).trim() || null,
          city: (data.get("city") as string).trim() || null,
          country: (data.get("country") as string).trim() || null,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
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
          gmaps_link: (data.get("gmaps_link") as string).trim(),
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
      <div className="rounded-xl border border-line bg-blue-wash/60 p-8 text-center">
        <p className="display text-xl text-blue-deep">Added</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
          Thanks! Your venue is now live and visible to everyone.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-semibold text-blue-deep underline"
        >
          Back to venues
        </Link>
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
              <input type="checkbox" name={name} className="accent-blue" />
              {label}
            </label>
          ))}
        </fieldset>
      </div>

      <div className="rule" />

      {/* Location */}
      <div>
        <label htmlFor="location-text" className={labelClass}>
          Location *
        </label>
        <p className="mt-0.5 text-xs text-ink-faint">
          Type a place, click the map (or drag the pin), or hit{" "}
          <span className="font-semibold">Add location</span> to use your
          current spot. Address, city and country below are optional.
        </p>
        <div className="relative mt-2 flex gap-2">
          <div className="relative flex-1">
            <input
              id="location-text"
              type="search"
              required
              value={locationText}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search address or place…"
              aria-label="Location"
              className={inputClass}
            />
            {searchResults.length > 0 && (
              <ul className="absolute z-[1200] mt-1 w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)] shadow-lg">
                {searchResults.map((r) => (
                  <li key={`${r.lat},${r.lng}`}>
                    <button
                      type="button"
                      onClick={() => pickSearchResult(r)}
                      className="w-full px-3 py-2 text-left text-sm text-ink-soft hover:bg-blue-wash"
                    >
                      {r.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            className="press shrink-0 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-blue-wash disabled:opacity-60"
            aria-label="Use my current location"
          >
            {locating ? "Locating…" : "Add location"}
          </button>
        </div>
        <div className="mt-2 h-72 overflow-hidden rounded-2xl border border-line">
          <LocationPicker
            value={position}
            onChange={handlePinChange}
            flyTo={flyTarget}
          />
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          {position
            ? `Pinned at ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
            : "No pin yet."}
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <label className={`${labelClass} sm:col-span-1`}>
            Address
            <input name="address" maxLength={200} className={inputClass} />
          </label>
          <label className={labelClass}>
            City
            <input name="city" maxLength={80} className={inputClass} />
          </label>
          <label className={labelClass}>
            Country
            <input name="country" maxLength={80} className={inputClass} />
          </label>
        </div>
        <label className={`${labelClass} mt-3 block`}>
          Google Maps link *
          <input
            name="gmaps_link"
            type="url"
            required
            placeholder="https://maps.app.goo.gl/…"
            className={inputClass}
          />
          <span className="mt-1 block text-xs font-normal text-ink-faint">
            Paste the share link from Google Maps — visitors tap this to
            open directions.
          </span>
        </label>
      </div>

      <div className="rule" />

      {/* Matches */}
      <div>
        <p className={labelClass}>Which matches are screened?</p>
        <div className="mt-2 flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setScreensAll(true)}
            className={`rounded-xl px-3 py-1.5 font-semibold transition ${
              screensAll
                ? "pill-active"
                : "border border-line bg-surface text-ink-soft"
            }`}
          >
            All matches
          </button>
          <button
            type="button"
            onClick={() => setScreensAll(false)}
            className={`rounded-xl px-3 py-1.5 font-semibold transition ${
              !screensAll
                ? "pill-active"
                : "border border-line bg-surface text-ink-soft"
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
                className="flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2 text-sm last:border-b-0 hover:bg-blue-wash/50"
              >
                <input
                  type="checkbox"
                  checked={selectedMatches.has(m.id)}
                  onChange={() => toggleMatch(m.id)}
                  className="accent-blue"
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

      {error && (
        <p className="rounded-xl bg-red-wash px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "saving"}
        className="btn-primary press w-full rounded-full px-4 py-3 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {state === "saving" ? "Adding…" : "Add venue"}
      </button>
    </form>
  );
}
