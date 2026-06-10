import { NextResponse } from "next/server";
import { USER_AGENT, reserveSlot } from "../nominatim";

/**
 * Server-side proxy for Nominatim reverse geocoding. Same OSMF policy
 * rules as the forward route — identified User-Agent, shared global
 * throttle, in-memory cache. Used by the submit form to label a dropped
 * pin (or the GPS "Add location" button) with a human-readable address.
 *
 * A failure here is non-fatal: the client falls back to a "lat, lng"
 * string so the user can still complete the form.
 */
export type ReverseGeocodeResult = {
  display_name: string;
  lat: number;
  lng: number;
};

const cache = new Map<string, { at: number; body: ReverseGeocodeResult }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json({ result: null }, { status: 400 });
  }

  // 5 decimals ≈ 1.1m precision — fine enough to dedupe pin nudges and
  // keep the cache useful when the user is dragging the marker around.
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ result: cached.body });
  }

  if (!reserveSlot()) {
    return NextResponse.json(
      { result: null, throttled: true },
      { status: 429 },
    );
  }

  try {
    const upstream = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        String(lat),
      )}&lon=${encodeURIComponent(String(lng))}&zoom=18`,
      { headers: { "User-Agent": USER_AGENT }, cache: "no-store" },
    );
    if (!upstream.ok) {
      return NextResponse.json({ result: null }, { status: 502 });
    }
    const data = (await upstream.json()) as {
      display_name?: string;
      lat?: string;
      lon?: string;
    };
    if (!data.display_name) {
      return NextResponse.json({ result: null });
    }
    const result: ReverseGeocodeResult = {
      display_name: data.display_name,
      lat: data.lat ? Number(data.lat) : lat,
      lng: data.lon ? Number(data.lon) : lng,
    };
    cache.set(key, { at: Date.now(), body: result });
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ result: null }, { status: 502 });
  }
}
