# Phase 4 — Later

Not scheduled. Recorded so the reasoning isn't lost.

## Reference photo → look spec

"Here's a look I like, help me do it with what I own." Claude reads the reference and
emits a look spec — the same artifact the presets produce, so it drops into the existing
pipeline with no rewrite.

Deliberately after the presets, because reference photos have unpleasant failure modes:

- **They lie.** Professional lighting, filters, retouching. Claude reads "flawless skin"
  where the real answer was editing. She follows an unachievable spec and the gap lands
  as *her* failure.
- **Extract intent, not pixels.** Never sample hex values off the reference — a shade
  that reads soft on the model may read harsh on her. Store "soft warm flush", resolve
  against her tone and inventory at match time.
- **She may own nothing close.** Presets can be authored to be achievable; a reference
  photo can demand a cut crease from someone with four products. Reroute logic has to be
  much stronger here.

## Live AR overlay

Show placement on her live face rather than describing it. Two loops: MediaPipe Face
Landmarker on-device for landmarks, regions and overlay; Claude on demand for judgment.
See `docs/decisions.md`.

Hard parts, in order: hands occlude the region being judged; auto white-balance and
auto-exposure change the camera's own colour rendering as she applies; blend quality is
at the edge of what's reliable. Mid-stroke correction stays out of scope — occlusion
alone kills it.

## Smaller things

- Manual item entry with no photo — makes the app fully usable without an API key.
- Expiry and PAO tracking; the fields already exist on `Item`.
- "What should I buy" — gaps across looks she can't complete. Handle carefully; the
  product's whole positioning is that it isn't a storefront.
- Packing mode — pick a look, get the minimum kit to bring.
- Re-analyse an existing item against an improved prompt.
