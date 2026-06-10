import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  distanceKm,
  filterVenues,
  formatDistanceKm,
  parseGmapsCoords,
  sortVenues,
  type VenueListItem,
} from "@/lib/venues";

function makeVenue(overrides: Partial<VenueListItem> = {}): VenueListItem {
  return {
    id: crypto.randomUUID(),
    name: "Test Venue",
    description: "A venue",
    address: "1 Main St",
    city: "Mexico City",
    country: "Mexico",
    lat: 19.43,
    lng: -99.13,
    venue_type: "pub_bar",
    capacity_estimate: null,
    is_free_entry: false,
    indoor_outdoor: "indoor",
    big_screen: false,
    food_available: false,
    family_friendly: false,
    screens_all_matches: true,
    photo_url: null,
    gmaps_link: "https://maps.example.com/test",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    vote_count: 0,
    ...overrides,
  };
}

describe("distanceKm", () => {
  it("is zero for identical points", () => {
    expect(distanceKm(40, -74, 40, -74)).toBe(0);
  });

  it("computes a known distance (NYC ↔ LA ≈ 3936 km)", () => {
    const d = distanceKm(40.7128, -74.006, 34.0522, -118.2437);
    expect(d).toBeGreaterThan(3900);
    expect(d).toBeLessThan(3980);
  });

  it("is symmetric", () => {
    expect(distanceKm(10, 20, -30, 40)).toBeCloseTo(
      distanceKm(-30, 40, 10, 20),
      10,
    );
  });
});

describe("formatDistanceKm", () => {
  it("formats metres under 1 km", () => {
    expect(formatDistanceKm(0.4)).toBe("400 m");
  });
  it("formats one decimal under 10 km", () => {
    expect(formatDistanceKm(5.25)).toBe("5.3 km");
  });
  it("rounds whole km above 10 km", () => {
    expect(formatDistanceKm(123.4)).toBe("123 km");
  });
});

describe("filterVenues", () => {
  const venues = [
    makeVenue({ name: "Aztec Fan Zone", city: "Mexico City", venue_type: "fan_zone", indoor_outdoor: "outdoor", is_free_entry: true }),
    makeVenue({ name: "Brooklyn Tavern", city: "New York", venue_type: "pub_bar", indoor_outdoor: "indoor", big_screen: true }),
    makeVenue({ name: "Plaza Central", city: "Guadalajara", venue_type: "public_square", indoor_outdoor: "both", family_friendly: true, food_available: true }),
  ];

  it("returns everything with default filters", () => {
    expect(filterVenues(venues, DEFAULT_FILTERS)).toHaveLength(3);
  });

  it("matches text against name, city, and country (case-insensitive)", () => {
    expect(filterVenues(venues, { ...DEFAULT_FILTERS, q: "brooklyn" })).toHaveLength(1);
    expect(filterVenues(venues, { ...DEFAULT_FILTERS, q: "MEXICO" })).toHaveLength(3); // country matches all
  });

  it("filters by venue type", () => {
    const out = filterVenues(venues, { ...DEFAULT_FILTERS, venueType: "fan_zone" });
    expect(out.map((v) => v.name)).toEqual(["Aztec Fan Zone"]);
  });

  it('treats "both" venues as matching indoor and outdoor', () => {
    const indoor = filterVenues(venues, { ...DEFAULT_FILTERS, setting: "indoor" });
    expect(indoor.map((v) => v.name).sort()).toEqual(["Brooklyn Tavern", "Plaza Central"]);
    const outdoor = filterVenues(venues, { ...DEFAULT_FILTERS, setting: "outdoor" });
    expect(outdoor.map((v) => v.name).sort()).toEqual(["Aztec Fan Zone", "Plaza Central"]);
  });

  it("applies boolean amenity toggles cumulatively", () => {
    const out = filterVenues(venues, { ...DEFAULT_FILTERS, food: true, familyFriendly: true });
    expect(out.map((v) => v.name)).toEqual(["Plaza Central"]);
  });

  it("filters free entry only", () => {
    const out = filterVenues(venues, { ...DEFAULT_FILTERS, freeOnly: true });
    expect(out.map((v) => v.name)).toEqual(["Aztec Fan Zone"]);
  });
});

describe("sortVenues", () => {
  const near = makeVenue({ name: "Near", lat: 19.44, lng: -99.14, vote_count: 0 });
  const far = makeVenue({ name: "Far", lat: 25.0, lng: -100.0, vote_count: 10 });
  const favFar = makeVenue({ name: "FavFar", lat: 19.6, lng: -99.3, vote_count: 1 });

  it("sorts by votes (desc) without an origin", () => {
    const out = sortVenues([near, far], null, () => false);
    expect(out.map((v) => v.name)).toEqual(["Far", "Near"]);
  });

  it("puts favorite-team venues first without an origin", () => {
    const out = sortVenues([far, favFar], null, (v) => v.name === "FavFar");
    expect(out[0].name).toBe("FavFar");
  });

  it("sorts nearest-first with an origin", () => {
    const out = sortVenues([far, near], { lat: 19.43, lng: -99.13 }, () => false);
    expect(out.map((v) => v.name)).toEqual(["Near", "Far"]);
  });

  it("boosts highlighted venues in near-me sort without overriding much-closer ones", () => {
    const out = sortVenues(
      [favFar, near],
      { lat: 19.43, lng: -99.13 },
      (v) => v.name === "FavFar",
    );
    // near is ~1.5km, favFar ~25km; even boosted, near wins.
    expect(out[0].name).toBe("Near");
  });

  it("does not mutate the input array", () => {
    const input = [far, near];
    sortVenues(input, { lat: 19.43, lng: -99.13 }, () => false);
    expect(input.map((v) => v.name)).toEqual(["Far", "Near"]);
  });

  it("sinks null-coord venues to the bottom of a near-me list", () => {
    const noCoords = makeVenue({ name: "NoCoords", lat: null, lng: null });
    const out = sortVenues(
      [noCoords, near, far],
      { lat: 19.43, lng: -99.13 },
      () => false,
    );
    expect(out.map((v) => v.name)).toEqual(["Near", "Far", "NoCoords"]);
  });
});

describe("filterVenues null-safety", () => {
  it("does not match the literal string 'null' against null fields", () => {
    const v = makeVenue({
      name: "Anonymous Spot",
      city: null,
      country: null,
      address: null,
    });
    const out = filterVenues([v], { ...DEFAULT_FILTERS, q: "null" });
    expect(out).toHaveLength(0);
  });

  it("still matches the name when city/country/address are null", () => {
    const v = makeVenue({
      name: "Anonymous Spot",
      city: null,
      country: null,
      address: null,
    });
    const out = filterVenues([v], { ...DEFAULT_FILTERS, q: "anonymous" });
    expect(out).toHaveLength(1);
  });
});

describe("parseGmapsCoords", () => {
  it("parses an /@lat,lng,zoom URL", () => {
    expect(
      parseGmapsCoords(
        "https://www.google.com/maps/@37.7749,-122.4194,15z/data=foo",
      ),
    ).toEqual({ lat: 37.7749, lng: -122.4194 });
  });

  it("parses a place URL with !3dLAT!4dLNG", () => {
    expect(
      parseGmapsCoords(
        "https://www.google.com/maps/place/X/data=!3m1!4b1!4m6!3m5!1s0x80!8m2!3d40.7128!4d-74.006!16s/g/foo",
      ),
    ).toEqual({ lat: 40.7128, lng: -74.006 });
  });

  it("parses a ?q=lat,lng URL", () => {
    expect(
      parseGmapsCoords("https://maps.google.com/?q=51.5074,-0.1278"),
    ).toEqual({ lat: 51.5074, lng: -0.1278 });
  });

  it("returns null for short-link shapes it cannot expand", () => {
    expect(parseGmapsCoords("https://maps.app.goo.gl/AbcXyz123")).toBeNull();
  });

  it("returns null for empty / nonsense input", () => {
    expect(parseGmapsCoords("")).toBeNull();
    expect(parseGmapsCoords("not a url")).toBeNull();
  });

  it("rejects out-of-range coordinates", () => {
    expect(
      parseGmapsCoords("https://www.google.com/maps/@95.0,-200.0,12z"),
    ).toBeNull();
  });
});
