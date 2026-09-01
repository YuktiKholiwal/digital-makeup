# Phase 3 — The coaching loop

**Goal:** the actual product. Photo → guidance → she applies → photo → check → next.

**Needs an API key:** yes. This phase cannot be verified without one.

## The loop

1. Bare face photo. Baseline, and the "before" shot.
2. Step *n*: show what to apply, which of her products, and where — placement in plain
   language, never left/right.
3. She applies it, then photographs.
4. Claude gets **the previous photo and the current photo together**, plus the step, the
   chosen product and her profile. It returns a verdict, feedback, and what it saw change.
5. Verdict `done` → next step. Verdict `retry` → actionable correction, re-photograph
   the same step.
6. Last step → before/after.

## Steps

- [ ] **Session model** — `collection/_sessions/<id>/`: the look, the plan, per-step
      photos, verdicts and timestamps. Files, like everything else.
- [ ] **Camera capture** — `getUserMedia`, mirrored preview, large tap target. She has
      makeup on her hands; assume clumsy input.
- [ ] **Step runner UI** — current step, product, placement, capture button, feedback.
- [ ] **`POST /api/coach`** — accepts both photos plus step context.
- [ ] **The coaching prompt** with structured output:
      `{ verdict: "done" | "retry", whatChanged, feedback, correction }`.
      Feedback must reference what is visibly on *her* face. Generic encouragement is
      the failure mode that makes the whole thing worthless.
- [ ] **Retry path** as a first-class flow, not a dead end. This *is* the value prop.
- [ ] **Skip step** — she must always be able to move on. Never trap her.
- [ ] **Before/after** — baseline against final. The most rewarding screen; it costs
      nothing because both photos already exist.
- [ ] **Session history** — past sessions, revisitable.

## Risks to watch

- **Generic feedback.** If it reads like a tutorial rather than a response to her photo,
  the product has no reason to exist. Test this before polishing anything else.
- **Lighting drift** between shots. Claude judges semantically rather than by pixel, so
  this hurts less than it would a CV approach — but it still degrades comparisons.
- **Cost.** ~10 steps is ~10 vision calls, roughly $0.50–1.00 a session on Opus 5.
  `CATALOG_MODEL` already allows dropping to Sonnet; consider a separate model setting
  for coaching.
- **Tone.** This points a camera at someone's face and tells her what's wrong with it.
  "Nudge that up a touch" and "you did that wrong" are not the same product.

## Done when

- A full session runs start to finish on a real face.
- Retry produces a *different, more specific* correction rather than repeating itself.
- Before/after renders from the session's own photos.
