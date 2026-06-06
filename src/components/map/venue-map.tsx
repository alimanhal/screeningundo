"use client";

import { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import type { LatLng, VenueListItem } from "@/lib/venues";
import { VENUE_TYPE_LABELS } from "@/lib/venues";

// Shape-coded pins (docs/DESIGN.md §4): venue = red circle,
// favorite-team highlight = yellow circle with ink ring.
const pinIcon = (highlighted: boolean) =>
  L.divIcon({
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<span style="
      display:block;width:18px;height:18px;border-radius:9999px;
      background:${highlighted ? "var(--yellow)" : "var(--red)"};
      border:2px solid var(--ink);
    "></span>`,
  });

// User location = blue square (docs/DESIGN.md §4).
const userIcon = L.divIcon({
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: `<span style="
    display:block;width:14px;height:14px;
    background:var(--blue);border:2px solid var(--ink);
  "></span>`,
});

/** Re-centers the map when the focus target changes. */
function FlyTo({ target, zoom }: { target: LatLng | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], zoom, { duration: 0.8 });
  }, [map, target, zoom]);
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
  center = { lat: 30, lng: -40 }, // mid-Atlantic: shows the Americas + Europe
  zoom = 3,
  interactivePopups = true,
}: VenueMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom
      className="z-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo target={focus} zoom={focusZoom} />
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={userIcon}
        />
      )}
      {venues.map((venue) => (
        <Marker
          key={venue.id}
          position={[venue.lat, venue.lng]}
          icon={pinIcon(highlightedIds.has(venue.id))}
        >
          {interactivePopups && (
            <Popup>
              <span style={{ fontWeight: 700 }}>{venue.name}</span>
              <br />
              {VENUE_TYPE_LABELS[venue.venue_type]} · {venue.city}
              <br />
              <Link href={`/venues/${venue.id}`}>Details →</Link>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
