/**
 * Football loader — the app's signature loading affordance.
 *
 * One classic black-and-white soccer ball SVG, used in three sizes
 * and two motion variants:
 *
 *   variant="spin"  → ball rotates in place. For inline button
 *                     contexts where horizontal travel would
 *                     overflow or shift layout.
 *   variant="roll"  → ball rolls back-and-forth across a small
 *                     track with a ground shadow that pulses in
 *                     sync. For page-level / panel-level loaders.
 *
 * Animations live in `globals.css` (`.football-spin`,
 * `.football-roll`, `.football-shadow`) and respect
 * `prefers-reduced-motion`.
 *
 * Accessibility: when `label` is provided, the loader announces it
 * as a polite live region. For purely decorative inline usage
 * (where the surrounding button text already says "Sending…",
 * "Saving…", etc.) pass `label={undefined}` — the SVG is then
 * marked aria-hidden.
 */

export type FootballLoaderSize = "sm" | "md" | "lg";
export type FootballLoaderVariant = "spin" | "roll";

const SIZES: Record<FootballLoaderSize, number> = {
  sm: 16,
  md: 32,
  lg: 56,
};

export function FootballLoader({
  size = "md",
  variant = "spin",
  label,
  className,
}: {
  size?: FootballLoaderSize;
  variant?: FootballLoaderVariant;
  label?: string;
  className?: string;
}) {
  const px = SIZES[size];

  if (variant === "roll") {
    // `roll` needs horizontal travel room + a ground shadow, so we
    // wrap the ball in a small track sized to the chosen ball.
    // Track width = ball + travel (~64px on the largest size).
    const trackWidth = px + 80;
    const trackHeight = px + 12;
    return (
      <div
        className={className}
        role={label ? "status" : undefined}
        aria-live={label ? "polite" : undefined}
        aria-label={label}
      >
        <div
          className="relative mx-auto"
          style={{ width: trackWidth, height: trackHeight }}
        >
          <div
            className="football-roll absolute top-0"
            style={{
              left: "50%",
              width: px,
              height: px,
              marginLeft: -px / 2,
            }}
          >
            <FootballSvg size={px} />
          </div>
          <div
            className="football-shadow absolute rounded-[50%] bg-ink"
            style={{
              bottom: 2,
              left: "50%",
              width: px * 0.9,
              height: Math.max(3, Math.round(px * 0.12)),
              marginLeft: -(px * 0.9) / 2,
              filter: "blur(2px)",
            }}
          />
        </div>
        {label && (
          <p className="mt-2 text-center text-xs font-medium text-ink-soft">
            {label}
          </p>
        )}
      </div>
    );
  }

  // spin variant: just the ball, no track, no shadow.
  return (
    <span
      className={`inline-flex items-center justify-center ${className ?? ""}`}
      role={label ? "status" : undefined}
      aria-live={label ? "polite" : undefined}
      aria-label={label}
    >
      <span
        className="football-spin inline-block"
        style={{ width: px, height: px }}
      >
        <FootballSvg size={px} />
      </span>
    </span>
  );
}

/**
 * Classic truncated-icosahedron soccer ball: predominantly white
 * sphere with one central black pentagon plus five small black
 * pentagons spaced around the rim, connected by faint grey seams
 * that suggest the hexagon edges. Reads unmistakably as a football
 * even at 16px.
 */
function FootballSvg({ size }: { size: number }) {
  // Five outer pentagon centers at 72° intervals, radius ~21 from
  // the ball's centre (32,32). Starting angle -90° puts the first
  // outer pentagon at top, matching the inner pentagon's apex.
  const outers: Array<{ cx: number; cy: number }> = [];
  for (let i = 0; i < 5; i++) {
    const a = (-Math.PI / 2) + (i * 2 * Math.PI) / 5;
    outers.push({ cx: 32 + 21 * Math.cos(a), cy: 32 + 21 * Math.sin(a) });
  }
  // Inner pentagon vertices (apex up) — used both for the central
  // black shape AND as the inner endpoints of the connecting seams.
  const innerR = 9;
  const innerPts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 5; i++) {
    const a = (-Math.PI / 2) + (i * 2 * Math.PI) / 5;
    innerPts.push({ x: 32 + innerR * Math.cos(a), y: 32 + innerR * Math.sin(a) });
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Sphere */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="#ffffff"
        stroke="#111111"
        strokeWidth="2"
      />
      {/* Hexagon-edge seams: thin grey lines from each inner-pentagon
          vertex out to the corresponding outer pentagon. Gives the
          ball its patterned silhouette without going all-black. */}
      <g stroke="#444444" strokeWidth="1.2" strokeLinecap="round">
        {innerPts.map((p, i) => (
          <line
            key={i}
            x1={p.x}
            y1={p.y}
            x2={outers[i].cx}
            y2={outers[i].cy}
          />
        ))}
      </g>
      {/* Central black pentagon (front-facing). */}
      <polygon
        points={innerPts.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="#111111"
      />
      {/* Five small outer pentagons around the rim. */}
      {outers.map((c, i) => (
        <polygon key={i} points={pentagonPoints(c.cx, c.cy, 4.5)} fill="#111111" />
      ))}
      {/* Subtle highlight for sphere depth */}
      <ellipse
        cx="22"
        cy="20"
        rx="8"
        ry="4"
        fill="#ffffff"
        fillOpacity="0.35"
      />
    </svg>
  );
}

function pentagonPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (-Math.PI / 2) + (i * 2 * Math.PI) / 5;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}
