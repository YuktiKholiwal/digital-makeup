# Phase 1 — Know her

**Goal:** the app knows whose face it's looking at, and knows enough about each product
to give an instruction.

**Why here:** matching and coaching both need this. A shade can't be judged as suitable
without her skin tone, and "cream or powder" changes both the order and the tool.

**Needs an API key:** yes, for skin-tone extraction — but that's one call, and the
fields can be entered by hand as a fallback.

## Steps

- [ ] **Onboarding route** `/onboarding` — first-run, skippable, re-runnable from settings.
- [ ] **Bare-face capture** — camera or upload. This frame is also the reference for
      "what changed" during coaching sessions, so capture it in her real lighting.
- [ ] **Skin analysis call.** Claude reads the bare-face photo → tone and undertone per
      zone (forehead, cheek, jaw), each as hex plus a descriptor. Structured output,
      same pattern as `lib/vision.ts`.
- [ ] **Profile store** — `collection/_profile/profile.json`, alongside the catalogue and
      under the same "files are the source of truth" rule.
- [ ] **Extend the product schema** in `lib/catalog.ts`:
      - `formula` — cream / powder / liquid / balm / gel / pencil (drives order and tool)
      - `coverage` — sheer / light / medium / full
      - `roleTags` — which look-spec slots this product can fill
- [ ] **Extend the extraction prompt** in `lib/vision.ts` to capture those fields, keeping
      the null-over-guess rule.
- [ ] **Tool detail** — brush type and density, so instructions can name the right tool.
- [ ] **Backfill.** Existing `item.json` files predate the new fields; they must read as
      `null` and not crash. Optionally a re-analyse action per item.

## Done when

- `profile.json` holds her skin tone and undertone with a bare-face reference photo.
- New scans capture formula, coverage and role tags.
- Items catalogued before this phase still load and render.
