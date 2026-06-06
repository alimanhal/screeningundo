import type { Metadata } from "next";
// Self-hosted variable font — keeps builds free of network fetches.
import "@fontsource-variable/plus-jakarta-sans";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: {
    default: "WC26 Screenings — Where to watch the World Cup near you",
    template: "%s — WC26 Screenings",
  },
  description:
    "Community-curated public screening locations for the 2026 World Cup. Find fan zones, pubs and plazas showing the matches — or add your own.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-svh flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
