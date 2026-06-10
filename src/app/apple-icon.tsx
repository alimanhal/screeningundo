import { ImageResponse } from "next/og";

/**
 * iOS home-screen icon (180×180). iOS doesn't accept SVG favicons,
 * so Next renders this JSX to a PNG at build time via `ImageResponse`.
 *
 * Visual is intentionally the same as `src/app/icon.svg`: a gold
 * location pin with a tiny black-and-white football inside —
 * combines the two main motifs of the app (maps + football) into
 * one mark. iOS will round the corners automatically, so the
 * design is built to fill the square.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(160deg, #fdfaf2 0%, #f7eed6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="140" height="140" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d6b34a" />
              <stop offset="50%" stopColor="#b78b3a" />
              <stop offset="100%" stopColor="#8e6526" />
            </linearGradient>
          </defs>
          <path
            d="M32 4 C18.7 4 8 14.7 8 28 c0 17.5 24 32 24 32 s24 -14.5 24 -32 c0 -13.3 -10.7 -24 -24 -24 z"
            fill="url(#g)"
            stroke="#111111"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle
            cx="32"
            cy="26"
            r="13"
            fill="#ffffff"
            stroke="#111111"
            strokeWidth="2"
          />
          <polygon
            points="32,20 37,23.6 35.1,29.5 28.9,29.5 27,23.6"
            fill="#111111"
          />
          <g stroke="#444444" strokeWidth="0.8" strokeLinecap="round">
            <line x1="32" y1="20" x2="32" y2="14" />
            <line x1="37" y1="23.6" x2="42" y2="22" />
            <line x1="35.1" y1="29.5" x2="39" y2="34" />
            <line x1="28.9" y1="29.5" x2="25" y2="34" />
            <line x1="27" y1="23.6" x2="22" y2="22" />
          </g>
          <circle cx="32" cy="14" r="1.6" fill="#111111" />
          <circle cx="42" cy="22" r="1.6" fill="#111111" />
          <circle cx="39" cy="34" r="1.6" fill="#111111" />
          <circle cx="25" cy="34" r="1.6" fill="#111111" />
          <circle cx="22" cy="22" r="1.6" fill="#111111" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
