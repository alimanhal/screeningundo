import type { Database } from "@/types/database";

export type VenueRow = Database["public"]["Tables"]["venues"]["Row"];
export type VenueType = VenueRow["venue_type"];

/** Venue as listed publicly, with its upvote count. */
export type VenueListItem = VenueRow & { vote_count: number };

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  fan_zone: "Fan zone",
  pub_bar: "Pub / bar",
  restaurant: "Restaurant",
  public_square: "Public square",
  other: "Other",
};

export const INDOOR_OUTDOOR_LABELS: Record<
  VenueRow["indoor_outdoor"],
  string
> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  both: "Indoor + outdoor",
};

export type VenueFilters = {
  q: string;
  venueType: "all" | VenueType;
  setting: "all" | "indoor" | "outdoor";
  freeOnly: boolean;
  bigScreen: boolean;
  food: boolean;
  familyFriendly: boolean;
};

export const DEFAULT_FILTERS: VenueFilters = {
  q: "",
  venueType: "all",
  setting: "all",
  freeOnly: false,
  bigScreen: false,
  food: false,
  familyFriendly: false,
};

/** Great-circle distance in kilometres (haversine). */
export function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Pure, client-side venue filtering. */
export function filterVenues<T extends VenueRow>(
  venues: T[],
  filters: VenueFilters,
): T[] {
  const q = filters.q.trim().toLowerCase();
  return venues.filter((v) => {
    if (q) {
      const haystack =
        `${v.name} ${v.city} ${v.country} ${v.address}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.venueType !== "all" && v.venue_type !== filters.venueType) {
      return false;
    }
    if (
      filters.setting !== "all" &&
      v.indoor_outdoor !== filters.setting &&
      v.indoor_outdoor !== "both"
    ) {
      return false;
    }
    if (filters.freeOnly && !v.is_free_entry) return false;
    if (filters.bigScreen && !v.big_screen) return false;
    if (filters.food && !v.food_available) return false;
    if (filters.familyFriendly && !v.family_friendly) return false;
    return true;
  });
}

export type LatLng = { lat: number; lng: number };

/** Merge venue rows with their public vote counts (venue_vote_counts view). */
export function attachVoteCounts<T extends VenueRow>(
  venues: T[] | null,
  counts: Array<{ venue_id: string; vote_count: number }> | null,
): Array<T & { vote_count: number }> {
  const byVenue = new Map(
    (counts ?? []).map((c) => [c.venue_id, c.vote_count]),
  );
  return (venues ?? []).map((v) => ({
    ...v,
    vote_count: byVenue.get(v.id) ?? 0,
  }));
}

/**
 * Sort venues for display. With an origin (near-me), nearest first with a
 * boost for favorite-team venues; otherwise favorite-team venues first,
 * then most upvoted.
 */
export function sortVenues<T extends VenueListItem>(
  venues: T[],
  origin: LatLng | null,
  isHighlighted: (venue: T) => boolean,
): T[] {
  const sorted = [...venues];
  if (origin) {
    sorted.sort((a, b) => {
      const boostA = isHighlighted(a) ? 0.6 : 1;
      const boostB = isHighlighted(b) ? 0.6 : 1;
      return (
        distanceKm(origin.lat, origin.lng, a.lat, a.lng) * boostA -
        distanceKm(origin.lat, origin.lng, b.lat, b.lng) * boostB
      );
    });
  } else {
    sorted.sort((a, b) => {
      const hl = Number(isHighlighted(b)) - Number(isHighlighted(a));
      if (hl !== 0) return hl;
      return b.vote_count - a.vote_count;
    });
  }
  return sorted;
}
