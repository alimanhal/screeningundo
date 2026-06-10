"use client";

import dynamic from "next/dynamic";
import type { VenueListItem } from "@/lib/venues";

const VenueMap = dynamic(
  () => import("@/components/map/venue-map").then((m) => m.VenueMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-blue-wash text-sm text-ink-faint">
        Loading map…
      </div>
    ),
  },
);

/** Small single-venue map for detail pages. Renders nothing if the venue
 *  has no coordinates. */
export function MiniMap({ venue }: { venue: VenueListItem }) {
  if (venue.lat == null || venue.lng == null) return null;
  return (
    <VenueMap
      venues={[venue]}
      highlightedIds={new Set()}
      focus={null}
      userLocation={null}
      center={{ lat: venue.lat, lng: venue.lng }}
      zoom={15}
      interactivePopups={false}
    />
  );
}
