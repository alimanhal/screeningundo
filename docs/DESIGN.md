# WC26 Screenings — Design Context: **Bauhaus**

> Reference: *“50 Design Styles Every Designer Should Know”* (UX Planet) —
> Bauhaus entry: “functional, geometric, and minimal. Rooted in the German
> design school of the 1920s, it favors ‘form follows function’ and uses
> basic shapes and primary colors. Grid systems, sans-serif fonts,
> red-blue-yellow palette, circles/triangles/squares, minimal text.
> Mood: rational, structured, modern.”

This document is the single source of truth for the app's visual language.
Every component change must conform to it.

## 1. Principles

1. **Form follows function.** No decoration that doesn't communicate.
   Ornament = data (counts, statuses, distances) made visible.
2. **Geometry is the brand.** Circle ● triangle ▲ square ■ are the only
   decorative vocabulary. They encode meaning consistently (see §4).
3. **Primary colors, used as signals — not paint.** Large surfaces stay
   paper/white; red, blue, yellow appear as functional accents.
4. **The grid is visible.** Hard edges, black rules, no rounded corners,
   no soft shadows, no gradients, no blur.
5. **Typography does the design.** One geometric sans, tight hierarchy,
   uppercase display headings, minimal text.

## 2. Color tokens (`src/app/globals.css`)

| Token | Value (oklch) | ≈ Hex | Role |
| --- | --- | --- | --- |
| `--paper` | `oklch(0.955 0.012 90)` | `#F3EFE6` | App background (warm gallery paper) |
| `--surface` | `oklch(0.99 0.002 90)` | `#FCFBF9` | Cards, panels |
| `--ink` | `oklch(0.22 0.005 270)` | `#16161A` | Text, borders, rules |
| `--ink-soft` | `oklch(0.42 0.005 270)` | — | Secondary text |
| `--ink-faint` | `oklch(0.55 0.005 270)` | — | Tertiary text |
| `--red` | `oklch(0.55 0.2 30)` | `#D2331F` | Primary action, rejection/danger, map pins |
| `--red-wash` | `oklch(0.94 0.035 30)` | — | Danger backgrounds |
| `--blue` | `oklch(0.45 0.15 262)` | `#2149A8` | Links, approved state, interactive secondary |
| `--blue-deep` | `oklch(0.36 0.13 262)` | — | Hover on blue |
| `--blue-wash` | `oklch(0.93 0.025 262)` | — | Info/selected backgrounds |
| `--yellow` | `oklch(0.85 0.16 90)` | `#F0BE00` | Favorite-team highlight, pending state |
| `--yellow-deep` | `oklch(0.62 0.12 85)` | — | Text on light when yellow context |
| `--yellow-wash` | `oklch(0.96 0.05 95)` | — | Highlight backgrounds |
| `--line` | `oklch(0.85 0.012 90)` | — | Hairline list dividers only |

Black borders (`--ink`) are structural; `--line` is only for quiet row
separation inside panels. **Never** introduce green, purple, pink, or
gradients.

## 3. Typography

- **Face:** `Jost` (variable, self-hosted via Fontsource) — a Futura/Renner
  revival, the canonical Bauhaus letterform. No second typeface.
- `.display` — uppercase, weight 700, tracking `+0.02em`. Page titles,
  section headings, wordmark.
- `.scoreboard` — tabular numerals, weight 600. Kickoff times, counts,
  distances.
- Body: weight 400/500, sentence case, short lines. Minimal text.

## 4. Shape language (meaning-coded)

| Shape | Meaning in app |
| --- | --- |
| ● Red circle | A venue (map pins, list bullets) |
| ▲ Yellow triangle | Favorite team / highlight / pending attention |
| ■ Blue square | Structure: matches, schedule, admin/meta |
| — Black bar | Section rule (`.bauhaus-rule`, 3px ink bar with shape caps) |

Wordmark = ● ▲ ■ + “WC26 SCREENINGS”. User location on map = blue square.
Highlighted venues = yellow circle pin with ink ring.

## 5. Component rules

- **Corners:** `border-radius: 0` everywhere. No exceptions (circles are
  circles via `rounded-full` only when the element *is* the shape ●).
- **Borders:** interactive elements get `2px solid var(--ink)`.
  Primary button: red fill, paper text, ink border. Secondary: surface fill,
  ink text, ink border. Tertiary/links: blue text, no border.
- **Hover:** translate up-left 2px + hard offset shadow `4px 4px 0 var(--ink)`
  (poster-print feel), or invert fill. Never opacity fades on color.
- **Focus:** `2px` ink outline offset 2px — visible, rectangular.
- **Chips/tags:** square-edged, thin ink border, uppercase 11px.
- **Status:** pending = yellow fill/ink text · approved = blue fill/paper
  text · rejected = red fill/paper text.
- **Forms:** rectangular fields, 2px ink border, paper background; labels
  bold, above the field.
- **Map:** OSM tiles untouched; pins follow §4; popup buttons square.
- **Empty states:** one shape + one sentence + one action.

## 6. Accessibility

- Text contrast ≥ 4.5:1 — body text is always `--ink` on `--paper`/`--surface`,
  or `--paper` on `--red`/`--blue`/`--ink`. Yellow is never used under
  paper-colored text; on yellow, text is `--ink`.
- Focus states required on all interactive elements (§5).
- Shape coding is always paired with a text label — never shape-only meaning.

## 7. Don'ts

No rounded cards · no drop/blur shadows (hard offset only) · no gradients ·
no glassmorphism · no pastel washes beyond the three `-wash` tokens · no
extra typefaces · no icons libraries (shapes + text suffice) · no green.
