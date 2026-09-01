# Vanity

Photograph your makeup and accessories; get back a browsable, searchable catalogue
where every item lives in its own folder on disk.

Point a camera at a drawer, a tray, or a single product. Claude reads the labels,
finds every distinct item in the frame, crops each one out of the photo, and files
it under `collection/<Category>/<Brand>/<product-slug>/`.

## Setup

1. Add your Anthropic API key (get one at https://console.anthropic.com/settings/keys):

   ```bash
   cp .env.example .env.local
   # then edit .env.local and paste your key into ANTHROPIC_API_KEY
   ```

2. Start it:

   ```bash
   npm run dev
   ```

   Open the URL it prints (http://localhost:3000 unless that port is busy).

## Using it

**Add photos** → drop in up to 12 photos at a time, or shoot straight from your
phone's camera. Claude reads each photo and returns everything it found.

**Review** → every detection is editable before anything is written to disk, and
low-confidence reads are flagged with `⚠`. Untick anything you don't want. Nothing
touches your collection until you press *File into collection*.

**Browse** → search across brand, shade, finish, notes and the raw label text;
filter by category and brand; click any item to edit it, price it, tag it, mark it
a favourite, or delete it.

Photograph tips: plain background, labels facing up, even light. Shade names and
sizes are printed in small type, so get close enough that they're legible to you —
if you can read them, so can Claude.

## Where your data lives

```
collection/
├── Lips/
│   └── Maybelline/
│       └── superstay-matte-ink-pioneer/
│           ├── item.json     ← every field, human-readable
│           └── photo.jpg     ← cropped out of the original photo
├── Eyes/
│   └── Urban Decay/
│       └── naked-ultraviolet/
└── _sources/                 ← your original camera photos, untouched
```

`item.json` is the source of truth — there's no database. The catalogue is rebuilt
by walking the folder tree, so you can move, rename, back up, or sync the
`collection/` folder freely, and edit any `item.json` by hand. It is gitignored by
default since it's personal data; point `COLLECTION_DIR` at Dropbox or iCloud in
`.env.local` if you'd rather it sync.

## Configuration

| Variable | Default | What it does |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | — | Required. Your Anthropic API key. |
| `CATALOG_MODEL` | `claude-opus-5` | Model used to read photos. |
| `COLLECTION_DIR` | `./collection` | Where the catalogue is stored. |

## How it works

- `lib/vision.ts` — sends each photo to Claude with a structured-output schema, so
  the response is a validated list of items rather than prose. Fields it can't read
  come back `null` instead of guessed; each item carries a bounding box.
- `lib/crop.ts` — turns those boxes into cropped per-item photos with `sharp`.
- `lib/store.ts` — owns the folder layout: creating item directories, de-duplicating
  slugs, and pruning empty brand folders when you delete something.
