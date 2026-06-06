# WC26 Screenings — Design Context: **Modern Minimal**

> Reference: *“50 Design Styles Every Designer Should Know”* (UX Planet).
> Direction drawn from its **Minimalism** entry (“clean, restrained,
> whitespace-driven, typography-led, limited palette — mood: calm, focused,
> premium”) and **Flat / Modern UI** principles (no skeuomorphism, soft
> elevation, functional color). Explicitly **not** themed: no World Cup
> iconography, no sport color clichés — the content (venues, matches) is the
> theme.

This document is the single source of truth for the app's visual language.
Every component change must conform to it.

## 1. Principles

1. **Typography-led.** Hierarchy comes from size/weight contrast, not boxes.
   One variable typeface, tight tracking on headings.
2. **Whitespace is structure.** Generous padding and section spacing;
   hairline dividers only where grouping fails.
3. **One accent.** A single electric blue does all interactive signaling.
   Semantic colors (amber/green/red) appear only as statuses.
4. **Soft, honest elevation.** Subtle layered shadows on raised surfaces;
   no hard offsets, no glassmorphism, no gradients-as-decoration.
5. **Calm motion.** 120–200ms ease-out transitions on hover/press;
   nothing bounces.

## 2. Color tokens (`src/app/globals.css`)

| Token | Value (oklch) | Role |
| --- | --- | --- |
| `--paper` | `oklch(0.985 0.002 250)` | App background (cool near-white) |
| `--surface` | `oklch(1 0 0)` | Cards, panels, header |
| `--ink` | `oklch(0.21 0.015 260)` | Headings, primary buttons |
| `--ink-soft` | `oklch(0.45 0.015 260)` | Body/secondary text |
| `--ink-faint` | `oklch(0.6 0.012 260)` | Tertiary text, placeholders |
| `--accent` (`blue`) | `oklch(0.55 0.18 262)` | Links, focus, selection, interactive |
| `--blue-deep` | `oklch(0.45 0.16 262)` | Accent hover |
| `--blue-wash` | `oklch(0.95 0.022 262)` | Selected/tinted backgrounds |
| `--yellow` | `oklch(0.82 0.14 85)` | Favorite-team highlight, pending |
| `--yellow-deep` | `oklch(0.55 0.11 80)` | Text on highlight washes |
| `--yellow-wash` | `oklch(0.97 0.035 90)` | Highlight backgrounds |
| `--green` | `oklch(0.62 0.14 155)` | Approved/success |
| `--green-wash` | `oklch(0.96 0.03 155)` | Success backgrounds |
| `--red` | `oklch(0.58 0.2 27)` | Destructive/rejected/errors |
| `--red-wash` | `oklch(0.96 0.02 27)` | Danger backgrounds |
| `--line` | `oklch(0.92 0.005 260)` | Borders, dividers |

Neutrals are tinted toward the accent hue (260) for cohesion. Never pure
black/white except `--surface`.

## 3. Typography

- **Face:** `Plus Jakarta Sans` (variable, self-hosted via Fontsource).
- `.display` — weight 700, tracking `-0.02em`, sentence case. Page titles.
- Section headings — weight 600, `text-sm`, `--ink-faint`, sentence case.
- `.scoreboard` — tabular numerals, weight 600. Times, counts, distances.
- Body 14–15px / `--ink-soft`; inputs ≥16px below `sm` (iOS zoom).

## 4. Shape & elevation

- **Radii:** cards/panels `rounded-2xl` · inputs/list rows `rounded-xl` ·
  buttons/chips `rounded-full` (pills).
- **Borders:** `1px solid var(--line)`; the accent border appears only on
  focus/selection.
- **Shadows:** `--shadow-card` (subtle, layered) on raised surfaces;
  `hover:` raises one level. Never colored or hard-edged shadows.
- **Map pins:** accent dot with white ring + soft shadow; favorite-team
  highlight = amber dot; user location = ink dot.

## 5. Component rules

- **Primary button:** ink pill, white text, hover lifts (`.press`).
- **Secondary:** surface pill, `--line` border, ink text.
- **Tertiary/links:** accent text, no border.
- **Destructive:** red text/outline; solid red only for confirm actions.
- **Status pills:** pending = yellow-wash/yellow-deep · approved =
  green-wash/green · rejected = red-wash/red. Dot + label.
- **Chips/filters:** pill, line border; selected = ink fill, white text.
- **Forms:** rounded-xl fields, line border, accent focus ring; bold labels
  above fields.
- **Empty states:** one sentence + one action, centered, faint.
- **Focus:** visible accent ring (`:focus-visible`) on all interactive
  elements.

## 6. Responsive (all screens, 320px → 4K)

- Mobile-first; single column < `lg`, map/list split ≥ `lg`.
- Touch targets ≥ 44px; inputs `text-base` below `sm`.
- Header collapses gracefully (wrapping, no hidden core actions).
- Max content width 72rem; whitespace scales with `clamp()`/responsive
  paddings.

## 7. Don'ts

No sport/World Cup iconography or color theming · no gradients-as-decoration ·
no glassmorphism/blur cards · no hard offset shadows · no uppercase display
type · no second typeface · no neon-on-dark "AI" palette · no modals where
inline disclosure works.
