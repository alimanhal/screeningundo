import { NextResponse } from "next/server";

/**
 * Server-side proxy for Nominatim search, per the OSMF usage policy:
 * identified User-Agent, globally throttled to at most 1 request/second,
 * with a tiny in-memory cache. Pin-drop remains the primary flow, so a
 * 429/failure here degrades gracefully on the client.
 */
const USER_AGENT = "WC26-Screenings/1.0 (worldcup-screenings community site)";
const MIN_INTERVAL_MS = 1100;

let lastRequestAt = 0;
const cache = new Map<string, { at: number; body: GeocodeResult[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export type GeocodeResult = {
  display_name: string;
  lat: number;
  lng: number;
};

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3 || q.length > 200) {
    return NextResponse.json({ results: [] });
  }

  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ results: cached.body });
  }

  const now = Date.now();
  if (now - lastRequestAt < MIN_INTERVAL_MS) {
    return NextResponse.json(
      { results: [], throttled: true },
      { status: 429 },
    );
  }
  lastRequestAt = now;

  try {
    const upstream = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": USER_AGENT }, cache: "no-store" },
    );
    if (!upstream.ok) {
      return NextResponse.json({ results: [] }, { status: 502 });
    }
    const data = (await upstream.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>;
    const results: GeocodeResult[] = data.map((r) => ({
      display_name: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));
    cache.set(key, { at: Date.now(), body: results });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 502 });
  }
}
