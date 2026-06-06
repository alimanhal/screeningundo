"use client";

import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { LatLng } from "@/lib/venues";

const pickerIcon = L.divIcon({
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<span style="
    display:block;width:22px;height:22px;border-radius:9999px;
    background:var(--pitch);border:3px solid var(--paper-raised);
    box-shadow:0 1px 6px rgb(0 0 0 / 0.4);
  "></span>`,
});

function ClickHandler({ onPick }: { onPick: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
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
    <MapContainer
      key={`${center.lat.toFixed(4)},${center.lng.toFixed(4)}`}
      center={[value?.lat ?? center.lat, value?.lng ?? center.lng]}
      zoom={value ? 15 : 4}
      scrollWheelZoom
      className="z-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onChange} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pickerIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const pos = (e.target as L.Marker).getLatLng();
              onChange({ lat: pos.lat, lng: pos.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
