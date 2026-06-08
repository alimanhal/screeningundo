"use client";

import {
  VENUE_TYPE_LABELS,
  type VenueFilters,
  type VenueType,
} from "@/lib/venues";

const TOGGLES: Array<{
  key: keyof Pick<
    VenueFilters,
    "freeOnly" | "bigScreen" | "food" | "familyFriendly"
  >;
  label: string;
}> = [
  { key: "freeOnly", label: "Free entry" },
  { key: "bigScreen", label: "Big screen" },
  { key: "food", label: "Food" },
  { key: "familyFriendly", label: "Family friendly" },
];

export function FilterBar({
  filters,
  onChange,
  onNearMe,
  nearMeState,
}: {
  filters: VenueFilters;
  onChange: (next: VenueFilters) => void;
  onNearMe: () => void;
  nearMeState: "idle" | "locating" | "active" | "error";
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-line bg-surface px-4 py-3">
      <div className="flex gap-2">
        <input
          type="search"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search by name, city or country…"
          aria-label="Search venues"
          className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink outline-none placeholder:text-ink-faint focus:border-blue focus:ring-2 focus:ring-blue/15 sm:text-sm"
        />
        <button
          type="button"
          onClick={onNearMe}
          disabled={nearMeState === "locating"}
          aria-pressed={nearMeState === "active"}
          title="Sort venues by distance from your location"
          className={`near-me-btn press flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold disabled:opacity-60 ${
            nearMeState === "active"
              ? "pill-active"
              : "border border-blue/25 bg-blue-wash/60 text-blue-deep hover:border-blue/40"
          }`}
        >
          <svg
            aria-hidden
            className={`h-4 w-4 shrink-0 ${nearMeState === "locating" ? "animate-pulse" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <span className="hidden min-[400px]:inline">
            {nearMeState === "locating" ? "Locating…" : "Near me"}
          </span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <select
          value={filters.venueType}
          onChange={(e) =>
            onChange({
              ...filters,
              venueType: e.target.value as "all" | VenueType,
            })
          }
          aria-label="Venue type"
          className="rounded-full border border-line bg-surface px-3 py-1.5 font-semibold text-ink-soft outline-none focus:border-blue"
        >
          <option value="all">All types</option>
          {Object.entries(VENUE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filters.setting}
          onChange={(e) =>
            onChange({
              ...filters,
              setting: e.target.value as VenueFilters["setting"],
            })
          }
          aria-label="Indoor or outdoor"
          className="rounded-full border border-line bg-surface px-3 py-1.5 font-semibold text-ink-soft outline-none focus:border-blue"
        >
          <option value="all">Indoor + outdoor</option>
          <option value="indoor">Indoor</option>
          <option value="outdoor">Outdoor</option>
        </select>

        {TOGGLES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={filters[key]}
            onClick={() => onChange({ ...filters, [key]: !filters[key] })}
            className={`rounded-full px-3 py-1.5 font-semibold transition ${
              filters[key]
                ? "pill-active"
                : "border border-line bg-surface text-ink-soft hover:border-blue/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {nearMeState === "error" && (
        <p className="text-xs text-red">
          Couldn&apos;t get your location — check browser permissions and try
          again.
        </p>
      )}
    </div>
  );
}
