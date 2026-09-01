# Decisions

Why things are the way they are. Written down so a future session doesn't
relitigate settled questions or re-derive the reasoning.

## Architecture

**The coaching loop is photo-based and turn-taking, not live video.**
She takes a photo, gets guidance, applies it, takes another photo. This isn't a
compromise for simplicity — it *solves* the hardest problem in the live version.
During application her hand and brush occlude the exact region being judged, so a
live system can never see what it's evaluating. Photographing after the stroke means
the hand is out of frame by construction. It also removes the latency budget: she's
paused and waiting, so a 3-second response is fine, which means Claude can do the
judging and no realtime CV loop is needed at all.

**Send the previous photo and the current photo in the same call.**
Judging "is there blush on her cheeks" from one image is genuinely hard — subtle
product on a phone camera sits at the edge of reliable. Judging "what changed between
these two, and is that what the step asked for" is far easier, and it's the actual
question. Same cost, materially better accuracy.

**Presets and reference photos both produce a *look spec*.**
Everything downstream — matching, ordering, coaching — only ever sees the spec and
never knows where it came from. A preset is a hand-written spec; a reference photo is
a Claude-generated one. This means the whole pipeline can be built and validated on
three hand-written presets with no AI in the planning path, and the reference-photo
feature later becomes one new step emitting an existing data structure.

**The spec says what and where; canonical order says when.**
Makeup order is standardised (prep → base → concealer → set → brows → eyes → cheeks
→ lips). Keep sequencing out of the look spec and both stay simple.

**When live AR eventually arrives, it's two loops at different speeds.**
Fast loop (30–60fps, on-device, free): face landmarks, region tracking, overlay,
coarse colour differencing. Slow loop (on demand): Claude judges quality. The fast
loop owns *placement*, the slow loop owns *quality*. Merging them gives you something
either broke or laggy.

## Product

**Guide before grade.** Showing *where* a product goes on her live face is ~80% of the
value at ~20% of the risk. Judgment is where the hard problems and the failure modes
live. Ship guidance first.

**The look adapts to what she owns.** No bronzer → the look reroutes silently. The
moment it says "you need to buy X" it becomes a storefront, and there are already
plenty of those. This is the anti-storefront; that's the whole positioning.

**Never say left or right.** The front camera is mirrored because that's what a mirror
does, which makes left/right genuinely ambiguous. Say "toward your nose", "toward your
ear", "up toward your brow".

**Label looks by time, not just occasion.** "Party" means different things to different
people; "~20 min, 11 steps" is an honest promise and sets expectations about the
commitment.

**Gate on inventory before she starts.** Check required slots up front. Failing at step
six with makeup half-on is a much worse experience than a five-second check.

**Pick a default product, offer a swap.** When three blushes fit the cheek slot, choose
one. Making her decide eight times turns a 5-minute look into a shopping trip.

**Expect placement, not polish.** Claude is solid at "is there product, roughly the
right place, roughly the right colour" and much shakier at "is this streaky or well
blended". Promise directional coaching, not a professional critique. Overpromising
here is how it loses trust on day one.

**Local-first.** A live camera on a face plus an inventory of her belongings is about
as personal as data gets. Nothing leaves the device except the still frames she
chooses to send.

## Design

**Warm minimal, light only.** Glossier / Rhode / Aesop: sand, cream, soft blush,
rounded corners, generous air, gentle shadows, quiet sans with a serif accent.

**No dark mode.** Following the system theme is the tell of a generic app. A luxury
brand commits to one palette and controls it completely.

**Everything custom in `globals.css` lives inside a cascade layer.** Unlayered CSS
outranks every layered rule regardless of specificity, and Tailwind puts all its
utilities in `@layer utilities`. A single unlayered `button { color: inherit }`
silently beat every `text-*` utility on buttons, inputs, selects and textareas —
which is how the primary button ended up rendering its label in the same colour as
its background. Never add a bare element selector to that file.

**Disabled controls recolour, they do not fade.** `opacity-40` on a dark button
takes the label down with it and the text vanishes.

**Things that read as generic and are banned:** checkerboard behind product photos
(that's an image editor), big-number stat dashboards (that's analytics), high-contrast
pill filters with hard black active states, decorative glyphs standing in for icons,
pure white and pure black.

## Data

**`item.json` files are the source of truth. There is no database.** The catalogue is
rebuilt by walking the folder tree, so the collection can be moved, renamed, synced or
hand-edited freely. Keep it that way — it's why the data outlives the app.

**HEIC is decoded at ingest, not downstream.** iPhones shoot HEIC by default, and
the prebuilt libheif bundled with sharp has no HEVC decoder — sharp reads AVIF but
not HEIC. `lib/decode.ts` converts to JPEG on the way in, so vision, cropping and
serving all deal with one format they can always read. Detection sniffs the ISO-BMFF
brand rather than the file extension, because HEIC bytes turn up under `.png` names
in the wild. Cost is ~2s per 24MP photo, all local.

**Bounding boxes are requested in pixels, with the image's dimensions stated in the
prompt, and normalised to a 0-1000 grid server-side.** Asking the model to rescale to
an abstract grid is not reliably obeyed — Sonnet 5 returned raw pixel coordinates of
the resized image while Opus 5 honoured the grid, and a pixel box that happens to fall
under 1000 looks valid while cropping the wrong region entirely. State the real
coordinate space, do the arithmetic here, and fall back to the whole frame if a box
comes back degenerate.

**Unreadable fields come back `null`, never guessed.** A null is more useful than a
confident wrong brand, and it's what drives the "check me" flag.
