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
      const haystack = [v.name, v.city, v.country, v.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
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

/**
 * Best-effort extraction of `lat,lng` from a Google Maps URL.
 *
 * Handles three common shapes returned by Google Maps:
 *   1. `@37.7749,-122.4194,15z`   (URL path "at" segment, includes zoom)
 *   2. `!3d37.7749!4d-122.4194`   (encoded place coords used in /place/ links)
 *   3. `?q=37.7749,-122.4194`     (raw query coord pair, also `?ll=`)
 *
 * Returns null when the URL is missing/invalid or no coord pair is found.
 * Short-link redirects (`maps.app.goo.gl/...`) cannot be expanded client-side
 * — those will return null and the user can drop a pin instead.
 */
export function parseGmapsCoords(url: string): LatLng | null {
  if (!url) return null;

  const inRange = (lat: number, lng: number) =>
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  // 1. /@lat,lng,zoom
  const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) {
    const lat = Number(at[1]);
    const lng = Number(at[2]);
    if (inRange(lat, lng)) return { lat, lng };
  }

  // 2. !3dLAT!4dLNG (place coordinates)
  const place = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (place) {
    const lat = Number(place[1]);
    const lng = Number(place[2]);
    if (inRange(lat, lng)) return { lat, lng };
  }

  // 3. ?q=lat,lng or ?ll=lat,lng
  const query = url.match(/[?&](?:q|ll|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (query) {
    const lat = Number(query[1]);
    const lng = Number(query[2]);
    if (inRange(lat, lng)) return { lat, lng };
  }

  return null;
}

/**
 * Build an external "open in map" link for a venue, preferring the user-
 * submitted Google Maps URL and falling back to OpenStreetMap built from
 * lat/lng. Returns null when the venue has neither (legacy rows pre-dating
 * the required-gmaps_link form rule).
 *
 * Single source of truth so the venue card, detail page, and any future
 * surface render the same href/label without duplicated branching.
 */
export function getVenueMapHref(
  venue: Pick<VenueRow, "gmaps_link" | "lat" | "lng">,
): { href: string; label: string } | null {
  if (venue.gmaps_link && venue.gmaps_link.trim()) {
    return { href: venue.gmaps_link, label: "Open in Google Maps" };
  }
  if (venue.lat != null && venue.lng != null) {
    return {
      href: `https://www.openstreetmap.org/?mlat=${venue.lat}&mlon=${venue.lng}#map=17/${venue.lat}/${venue.lng}`,
      label: "Open in OpenStreetMap",
    };
  }
  return null;
}

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
    // Venues without coordinates sink to the bottom of a near-me list.
    const effectiveDistance = (v: T) => {
      if (v.lat == null || v.lng == null) return Number.POSITIVE_INFINITY;
      const boost = isHighlighted(v) ? 0.6 : 1;
      return distanceKm(origin.lat, origin.lng, v.lat, v.lng) * boost;
    };
    sorted.sort((a, b) => effectiveDistance(a) - effectiveDistance(b));
  } else {
    sorted.sort((a, b) => {
      const hl = Number(isHighlighted(b)) - Number(isHighlighted(a));
      if (hl !== 0) return hl;
      return b.vote_count - a.vote_count;
    });
  }
  return sorted;
}
