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
    <div className="flex flex-col gap-2 border-b-2 border-ink bg-surface px-4 py-3">
      <div className="flex gap-2">
        <input
          type="search"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search by name, city or country…"
          aria-label="Search venues"
          className="w-full rounded-none border border-ink bg-paper px-3 py-2 text-base text-ink outline-none sm:text-sm placeholder:text-ink-faint focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
        <button
          type="button"
          onClick={onNearMe}
          disabled={nearMeState === "locating"}
          className={`shrink-0 rounded-none px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
            nearMeState === "active"
              ? "bg-blue text-paper"
              : "border border-ink text-ink-soft hover:border-blue hover:text-blue-deep"
          }`}
        >
          {nearMeState === "locating" ? "Locating…" : "📍 Near me"}
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
          className="rounded-none border border-ink bg-paper px-3 py-1.5 font-semibold text-ink-soft outline-none focus:border-blue"
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
          className="rounded-none border border-ink bg-paper px-3 py-1.5 font-semibold text-ink-soft outline-none focus:border-blue"
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
            className={`rounded-none px-3 py-1.5 font-semibold transition ${
              filters[key]
                ? "bg-blue-deep text-paper"
                : "border border-ink text-ink-soft hover:border-blue hover:text-blue-deep"
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
