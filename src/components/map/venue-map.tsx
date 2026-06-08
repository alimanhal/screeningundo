"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
  useMap,
} from "@/components/ui/map";
import type { LatLng, VenueListItem } from "@/lib/venues";
import { VENUE_TYPE_LABELS } from "@/lib/venues";

function FlyTo({
  target,
  zoom,
}: {
  target: LatLng | null;
  zoom: number;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!target || !map || !isLoaded) return;

    map.flyTo({
      center: [target.lng, target.lat],
      zoom,
      duration: 800,
    });
  }, [map, isLoaded, target, zoom]);

  return null;
}

export type VenueMapProps = {
  venues: VenueListItem[];
  highlightedIds: ReadonlySet<string>;
  focus: LatLng | null;
  focusZoom?: number;
  userLocation: LatLng | null;
  center?: LatLng;
  zoom?: number;
  interactivePopups?: boolean;
};

export function VenueMap({
  venues,
  highlightedIds,
  focus,
  focusZoom = 12,
  userLocation,
  center,
  zoom,
  interactivePopups = true,
}: VenueMapProps) {
  const mapCenter =
    userLocation ??
    center ??
    { lat: 20.5937, lng: 78.9629 };

  const mapZoom =
    userLocation ? 9 : zoom ?? 4;

  return (
    <Map
      center={[mapCenter.lng, mapCenter.lat]}
      zoom={mapZoom}
      maxZoom={20}
      className="z-0"
      styles={{
        light: "https://tiles.openfreemap.org/styles/bright",
        dark: "https://tiles.openfreemap.org/styles/bright",
      }}
    >
      <MapControls
        position="bottom-right"
        showZoom
        showCompass={false}
        showLocate={false}
        showFullscreen={false}
      />

      <FlyTo
        target={focus}
        zoom={focusZoom}
      />

      {userLocation && (
        <MapMarker
          longitude={userLocation.lng}
          latitude={userLocation.lat}
        >
          <MarkerContent>
            <div
              className="h-[14px] w-[14px] rounded-full border-[2.5px] border-white shadow-lg"
              style={{
                background: "var(--ink)",
              }}
            />
          </MarkerContent>
        </MapMarker>
      )}

      {venues.map((venue) => (
        <MapMarker
          key={venue.id}
          longitude={venue.lng}
          latitude={venue.lat}
        >
          <MarkerContent>
            <div
              className="h-[18px] w-[18px] rounded-full border-[2.5px] border-white shadow-lg"
              style={{
                background: highlightedIds.has(
                  venue.id
                )
                  ? "var(--yellow)"
                  : "var(--blue)",
              }}
            />
          </MarkerContent>

          {interactivePopups && (
            <MarkerPopup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">
                  {venue.name}
                </p>

                <p className="text-ink-soft">
                  {
                    VENUE_TYPE_LABELS[
                      venue.venue_type
                    ]
                  }{" "}
                  · {venue.city}
                </p>

                <Link
                  href={`/venues/${venue.id}`}
                  className="text-blue-deep underline"
                >
                  Details →
                </Link>
              </div>
            </MarkerPopup>
          )}
        </MapMarker>
      ))}
    </Map>
  );
}