"use client";

import { useEffect } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/ui/map";
import type { LatLng } from "@/lib/venues";

function ClickHandler({ onPick }: { onPick: (pos: LatLng) => void }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    const handler = (e: { lngLat: { lng: number; lat: number } }) => {
      onPick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    };
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [map, isLoaded, onPick]);
  return null;
}

export function LocationPicker({
  value,
  onChange,
  center,
}: {
  value: LatLng | null;
  onChange: (pos: LatLng) => void;
  center: LatLng;
}) {
  return (
    <Map
      key={`${center.lat.toFixed(4)},${center.lng.toFixed(4)}`}
      center={[center.lng, center.lat]}
      zoom={value ? 15 : 4}
      className="z-0"
      styles={{
        light: "https://tiles.openfreemap.org/styles/bright",
        dark: "https://tiles.openfreemap.org/styles/bright",
      }}
    >
      <ClickHandler onPick={onChange} />
      {value && (
        <MapMarker
          longitude={value.lng}
          latitude={value.lat}
          draggable
          onDragEnd={(lngLat) =>
            onChange({ lat: lngLat.lat, lng: lngLat.lng })
          }
        >
          <MarkerContent>
            <div className="h-[22px] w-[22px] rounded-full border-[3px] border-white shadow-lg" style={{ background: "var(--blue)" }} />
          </MarkerContent>
        </MapMarker>
      )}
    </Map>
  );
}
