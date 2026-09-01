# Phase 2 — Look specs and matching

**Goal:** she picks a look and sees a real plan — actual products from her shelf, in
order, before anything is applied.

**Why here:** this is the whole planning path. It's worth having working and inspectable
*before* the coaching loop, because a bad session should be traceable to either the plan
or the coach, not ambiguously both.

**Needs an API key:** no. Presets are hand-written data and matching is plain logic.
This phase is deliberately AI-free.

## The look spec

A look is slots, not steps. Each slot carries:

- `role` — base, cheek, lid, liner, brow, lip …
- `required` — whether the look survives without it
- `properties` — what to match against inventory (family, finish, formula, intensity)
- `placement` — plain-language description used to coach her

Step *order* comes from the canonical sequence, not the spec.

## Steps

- [ ] **Types** — `lib/looks.ts`: `LookSpec`, `Slot`, `SlotRole`.
- [ ] **Three presets** as data: Minimal (~5 min, ~4 steps), Going out (~12 min, ~7),
      Party (~20 min, ~11). Hand-authored, achievable with a modest kit.
- [ ] **Canonical step order** — prep → base → concealer → set → brows → eyes → cheeks →
      lips. One constant, filtered to the slots in play.
- [ ] **Matcher** — slot + inventory + profile → ranked candidates. Score on formula,
      colour family, finish, and suitability for her skin tone. Return a default plus
      alternates.
- [ ] **Inventory gate** — before the session, check required slots. Surface gaps up front
      with a "continue with a modified version?" choice. Never mid-session.
- [ ] **Look picker UI** — three cards, each labelled with time and step count.
- [ ] **Plan preview** — the ordered steps with the chosen product per slot and a swap
      control. She sees the whole session before committing to it.

## Done when

- Picking a look produces an ordered plan of real products from the catalogue.
- Swapping a product updates the plan.
- A look with an unfillable required slot is caught before the session starts, and
  offers a rerouted version rather than a dead end.
