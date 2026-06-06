export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <p>
          Community-curated screening locations for the 2026 World Cup.
          Listings are submitted by fans and reviewed before publishing.
        </p>
        <p className="shrink-0">
          Not affiliated with FIFA. Map data ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-ink"
          >
            OpenStreetMap
          </a>{" "}
          contributors.
        </p>
      </div>
    </footer>
  );
}
