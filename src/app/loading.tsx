import { FootballLoader } from "@/components/ui/football-loader";

/**
 * Root-level App Router Suspense fallback — shown for any pending
 * server component below `/`. Centered rolling football so route
 * transitions feel intentional instead of dropping users on a
 * blank screen while data streams.
 *
 * Per-route loading.tsx files can override this if a tighter
 * skeleton makes more sense (none exist yet).
 */
export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <FootballLoader variant="roll" size="lg" label="Loading…" />
    </main>
  );
}
