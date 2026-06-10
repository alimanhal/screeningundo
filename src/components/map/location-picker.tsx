"use client";

import { useEffect, useState } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/ui/map";
import type { LatLng } from "@/lib/venues";

function ClickHandler({
  onPick,
}: {
  onPick: (pos: LatLng) => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const handler = (e: {
      lngLat: { lng: number; lat: number };
    }) => {
      onPick({
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
      });
    };

    map.on("click", handler);

    return () => {
      map.off("click", handler);
    };
  }, [map, isLoaded, onPick]);

  return null;
}

function FlyTo({
  target,
  zoom = 9,
}: {
  target: LatLng | null;
  zoom?: number;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || !target) return;

    map.flyTo({
      center: [target.lng, target.lat],
      zoom,
      duration: 1000,
    });
  }, [map, isLoaded, target, zoom]);

  return null;
}

export function LocationPicker({
  value,
  onChange,
  center: centerProp,
  flyTo,
}: {
  value: LatLng | null;
  onChange: (pos: LatLng) => void;
  center?: LatLng;
  /**
   * Imperative fly target. Any new reference (use a fresh object) re-runs
   * the camera animation, so the parent can pan/zoom to a search pick,
   * GPS result, etc. without taking full controlled-viewport ownership.
   */
  flyTo?: LatLng | null;
}) {
  const [userLocation, setUserLocation] =
    useState<LatLng | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    // Geolocation is best-effort: it may be denied, unavailable, time out, or
    // be blocked on insecure origins. None of those are bugs — the user can
    // still drop a pin manually — so we silently swallow the failure.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        /* ignore: user can drop a pin manually */
      },
      { timeout: 8000, maximumAge: 60_000 },
    );
  }, []);

  const mapCenter =
    value ??
    centerProp ??
    userLocation ??
    { lat: 20.5937, lng: 78.9629 };

  return (
    <Map
      center={[mapCenter.lng, mapCenter.lat]}
      zoom={value ? 16 : userLocation ? 9 : 4}
      maxZoom={20}
      className="z-0"
      styles={{
        light: "https://tiles.openfreemap.org/styles/bright",
        dark: "https://tiles.openfreemap.org/styles/bright",
      }}
    >
      {/* Initial soft pan to the user's GPS on mount (no pin). */}
      <FlyTo target={userLocation} zoom={9} />
      {/* Parent-driven fly: search pick, "Add location" button, etc. */}
      <FlyTo target={flyTo ?? null} zoom={16} />

      <ClickHandler onPick={onChange} />

      {value && (
        <MapMarker
          longitude={value.lng}
          latitude={value.lat}
          draggable
          onDragEnd={(lngLat) =>
            onChange({
              lat: lngLat.lat,
              lng: lngLat.lng,
            })
          }
        >
          <MarkerContent>
            <div
              className="h-[22px] w-[22px] rounded-full border-[3px] border-white shadow-lg"
              style={{
                background: "var(--blue)",
              }}
            />
          </MarkerContent>
        </MapMarker>
      )}
    </Map>
  );
}