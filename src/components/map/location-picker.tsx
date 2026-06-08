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

function FlyToUser({
  target,
}: {
  target: LatLng | null;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || !target) return;

    map.flyTo({
      center: [target.lng, target.lat],
      zoom: 9,
      duration: 1000,
    });
  }, [map, isLoaded, target]);

  return null;
}

export function LocationPicker({
  value,
  onChange,
  center: centerProp,
}: {
  value: LatLng | null;
  onChange: (pos: LatLng) => void;
  center?: LatLng;
}) {
  const [userLocation, setUserLocation] =
    useState<LatLng | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
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
      <FlyToUser target={userLocation} />

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