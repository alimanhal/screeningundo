import { FootballLoader } from "@/components/ui/football-loader";

/**
 * Shared fallback for our three `next/dynamic` map imports (submit
 * form, home explorer, venue detail mini-map). Keeping the JSX
 * here means all three loading states look identical and any future
 * tweak (background tint, label copy, sizing) happens in one file.
 */
export function MapLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-blue-wash">
      <FootballLoader variant="roll" size="md" label="Loading map…" />
    </div>
  );
}
