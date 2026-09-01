# Vanity — build plan

A makeup coach that works from what you actually own.

**v1 (built)** — photograph your makeup; every item is identified, cropped out of the
photo, and filed into `collection/<Category>/<Brand>/<slug>/`.

**v2 (the point)** — you pick a look, and it walks you through applying it step by
step using your own products, checking each step from a photo before you move on.

The inventory is not a side feature. It is what lets the coach say "use *your* Nars
blush, here" instead of "apply a blush."

## Status

| Phase | What | State |
| --- | --- | --- |
| — | Inventory: scan, identify, crop, file, browse, edit | ✅ built |
| [0](docs/plan/phase-0-design-system.md) | Design system + v1 rebuilt on it | ⬜ next |
| [1](docs/plan/phase-1-user-profile.md) | Know her: skin tone, richer product model | ⬜ |
| [2](docs/plan/phase-2-looks-and-matching.md) | Look specs + inventory matching | ⬜ |
| [3](docs/plan/phase-3-coaching-loop.md) | The photo-based coaching loop | ⬜ |
| [4](docs/plan/phase-4-later.md) | Reference photos, live AR, and the rest | ⬜ |

Design and architecture reasoning lives in [docs/decisions.md](docs/decisions.md) —
read that before changing direction on anything, it records *why* each call was made.

## Constraints to remember

- **Phase 3 needs an Anthropic API key.** Phases 0–2 are fully buildable and testable
  without one. The coaching loop cannot be verified until `ANTHROPIC_API_KEY` is in
  `.env.local`.
- **Mobile-first from Phase 0 on.** The coach is a phone propped in front of a face.
  Desktop should work; phone is the target.
- **`collection/` never gets committed.** It holds personal photos. Same for
  `.env.local`. Both are gitignored — keep it that way.

## Running it

```bash
npm install
cp .env.example .env.local   # add your key when you reach Phase 3
npm run dev
```
