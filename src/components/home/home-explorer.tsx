"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  DEFAULT_FILTERS,
  distanceKm,
  filterVenues,
  sortVenues,
  type LatLng,
  type VenueFilters,
  type VenueListItem,
} from "@/lib/venues";
import { FilterBar } from "./filter-bar";
import { VenueCard, type FavoriteHighlight } from "./venue-card";

const VenueMap = dynamic(
  () => import("@/components/map/venue-map").then((m) => m.VenueMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-blue-wash text-sm text-ink-faint">
        Loading map…
      </div>
    ),
  },
);

export type FavoriteContext = FavoriteHighlight & {
  /** Venues explicitly screening the favorite team's next match. */
  explicitVenueIds: string[];
};

export function HomeExplorer({
  venues,
  favorite,
}: {
  venues: VenueListItem[];
  favorite: FavoriteContext | null;
}) {
  const [filters, setFilters] = useState<VenueFilters>(DEFAULT_FILTERS);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [nearMeState, setNearMeState] = useState<
    "idle" | "locating" | "active" | "error"
  >("idle");

  const explicitIds = useMemo(
    () => new Set(favorite?.explicitVenueIds ?? []),
    [favorite],
  );
  const isHighlighted = useMemo(
    () => (venue: VenueListItem) =>
      favorite !== null &&
      (venue.screens_all_matches || explicitIds.has(venue.id)),
    [favorite, explicitIds],
  );

  const visible = useMemo(() => {
    return sortVenues(filterVenues(venues, filters), origin, isHighlighted);
  }, [venues, filters, origin, isHighlighted]);

  const highlightedIds = useMemo(
    () => new Set(visible.filter(isHighlighted).map((v) => v.id)),
    [visible, isHighlighted],
  );

  function handleNearMe() {
    if (origin) {
      // Toggle off
      setOrigin(null);
      setNearMeState("idle");
      return;
    }
    if (!("geolocation" in navigator)) {
      setNearMeState("error");
      return;
    }
    setNearMeState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMeState("active");
      },
      () => setNearMeState("error"),
      { maximumAge: 60_000, timeout: 10_000 },
    );
  }

  return (
    <div className="grid flex-1 grid-rows-[minmax(180px,40svh)_1fr] lg:grid-cols-[1fr_1fr] lg:grid-rows-1">
      <section className="order-2 flex min-h-0 flex-col overflow-hidden border-line lg:order-1 lg:border-r">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onNearMe={handleNearMe}
          nearMeState={nearMeState}
        />
        <div className="min-h-0 flex-1 overflow-y-auto" role="list">
          <p className="px-4 pt-3 text-xs font-semibold text-ink-faint">
            {visible.length}{" "}
            {visible.length === 1 ? "screening spot" : "screening spots"}
            {origin ? " · nearest first" : ""}
          </p>
          {visible.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="font-semibold text-ink">No venues match.</p>
              <p className="mt-1 text-sm text-ink-soft">
                Try clearing a filter — or{" "}
                <a href="/submit" className="text-blue-deep underline">
                  add the first screening spot here
                </a>
                .
              </p>
            </div>
          ) : (
            visible.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                distanceKm={
                  origin && venue.lat != null && venue.lng != null
                    ? distanceKm(origin.lat, origin.lng, venue.lat, venue.lng)
                    : null
                }
                highlight={isHighlighted(venue) && favorite ? favorite : null}
              />
            ))
          )}
        </div>
      </section>

      <section className="order-1 min-h-0 lg:order-2">
        <VenueMap
          venues={visible}
          highlightedIds={highlightedIds}
          focus={origin}
          focusZoom={11}
          userLocation={origin}
        />
      </section>
    </div>
  );
}
