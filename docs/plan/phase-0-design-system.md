# Phase 0 — Design system, and v1 rebuilt on it

**Goal:** one deliberate warm-minimal light aesthetic, applied across everything that
already exists. No new features.

**Why first:** every later phase adds UI. Build the coaching screens on the current
system and they get rebuilt twice.

**Needs an API key:** no. Everything here is verifiable offline.

## The system

Palette — warm white ground `#FDFBF8`, sand surface `#F3EBE3`, clay-rose accent
`#C08D7E`, warm brown ink `#3A2E28`, muted taupe for secondary text. No pure white,
no pure black, anywhere.

Type — Fraunces for display (soft optical serif), a quiet sans for UI. Brand names in
small letterspaced caps; product names in the serif.

Form — radii 12–20px, warm-tinted low-opacity shadows, generous spacing, slow easing
on transitions.

## Steps

- [x] **Tokens.** Rewrite `app/globals.css`: palette, type scale, radii, shadow, spacing,
      motion. Delete the `prefers-color-scheme` block and every dark-mode token.
- [x] **Fonts.** Swap Instrument Serif → Fraunces in `app/layout.tsx`; pick and wire the
      UI sans.
- [x] **Primitives.** `components/ui/` — Button, Card, Pill, Field, Sheet. Everything
      else composes these instead of restating Tailwind classes inline.
- [x] **Card treatment.** Replace the `swatch-grid` checkerboard with a soft cream
      ground. Brand in caps, product in serif, shade dot kept but restyled.
- [x] **Collection browser.** Rebuild `CollectionView`: header, filters, grid. Replace the
      big-number stats row with a quiet single line ("24 pieces · 11 brands").
- [x] **Item detail.** Rebuild `ItemDrawer` — bottom sheet on mobile, side panel on
      desktop.
- [x] **Add flow.** Rebuild `ScanStudio`: dropzone, queue, review cards.
- [~] **Mobile-first pass.** Bottom action bar instead of top-right buttons. Verify the
      review cards, which are the densest screen, actually work at 390px.
      *Written but NOT visually verified — Chrome would not resize below its minimum
      window width in the dev environment. Needs checking on a real phone.*
- [x] **Empty and loading states.** Including the no-API-key message on the add screen.
- [ ] *(optional)* **Manual item entry** — add an item without a photo. Makes the app
      fully usable with no key at all.

## Done when

- No dark mode, no checkerboard, no stats dashboard anywhere in the codebase.
- Renders correctly at 390px, 768px and 1440px. *(1540px verified; narrow widths outstanding.)*
- `npx tsc --noEmit`, `npx eslint .` and `npm run build` all clean.
- Screenshots at all three widths reviewed and approved.
