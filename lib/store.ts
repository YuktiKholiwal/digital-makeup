import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Box, DetectedItem, Item, itemDirFor } from "./catalog";
import { cropToFile } from "./crop";

export const COLLECTION_ROOT =
  process.env.COLLECTION_DIR || path.join(process.cwd(), "collection");

export const SOURCES_DIR = "_sources";

export function absolute(relative: string): string {
  const full = path.resolve(/* turbopackIgnore: true */ COLLECTION_ROOT, relative);
  const root = path.resolve(/* turbopackIgnore: true */ COLLECTION_ROOT);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("Path escapes the collection directory");
  }
  return full;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

/** Store an original camera photo and return its collection-relative path. */
export async function saveSource(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  await ensureDir(absolute(SOURCES_DIR));
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const ext = (path.extname(originalName) || ".jpg").toLowerCase();
  const safeExt = /^\.(jpe?g|png|webp|heic|heif|avif)$/.test(ext) ? ext : ".jpg";
  const name = `${stamp}-${randomUUID().slice(0, 8)}${safeExt}`;
  const rel = path.posix.join(SOURCES_DIR, name);
  await fs.writeFile(absolute(rel), buffer);
  return rel;
}

/** Pick a directory that does not collide with an existing item. */
async function uniqueDir(base: string): Promise<string> {
  let candidate = base;
  let n = 2;
  while (true) {
    try {
      await fs.access(absolute(candidate));
      candidate = `${base}-${n++}`;
    } catch {
      return candidate;
    }
  }
}

export type NewItemInput = Partial<Item> &
  Pick<DetectedItem, never> & {
    category: string;
    productType: string;
    brand: string | null;
    productName: string | null;
    shadeName: string | null;
    source?: string | null;
    box?: Box | null;
  };

export async function createItem(input: NewItemInput): Promise<Item> {
  const dir = await uniqueDir(itemDirFor(input));
  await ensureDir(absolute(dir));

  let photo: string | null = null;
  if (input.source) {
    const photoRel = path.posix.join(dir, "photo.jpg");
    try {
      await cropToFile(absolute(input.source), input.box ?? null, absolute(photoRel));
      photo = photoRel;
    } catch (error) {
      console.error("Could not crop item photo:", error);
    }
  }

  const now = new Date().toISOString();
  const item: Item = {
    id: randomUUID(),
    category: input.category,
    productType: input.productType,
    brand: input.brand,
    productName: input.productName,
    shadeName: input.shadeName,
    shadeHex: input.shadeHex ?? null,
    finish: input.finish ?? null,
    colorFamily: input.colorFamily ?? null,
    size: input.size ?? null,
    packaging: input.packaging ?? null,
    condition: input.condition ?? "unknown",
    visibleText: input.visibleText ?? null,
    notes: input.notes ?? null,
    confidence: input.confidence ?? 0,
    tags: input.tags ?? [],
    favorite: false,
    price: input.price ?? null,
    currency: input.currency ?? "USD",
    purchasedOn: input.purchasedOn ?? null,
    expiresOn: input.expiresOn ?? null,
    addedAt: now,
    updatedAt: now,
    photo,
    source: input.source ?? null,
    box: input.box ?? null,
    dir,
  };

  await fs.writeFile(
    absolute(path.posix.join(dir, "item.json")),
    JSON.stringify(item, null, 2) + "\n"
  );
  return item;
}

async function* walk(relative: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await fs.readdir(absolute(relative), { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === SOURCES_DIR) continue;
    const child = relative ? path.posix.join(relative, entry.name) : entry.name;
    if (entry.isDirectory()) {
      yield* walk(child);
    } else if (entry.name === "item.json") {
      yield child;
    }
  }
}

export async function listItems(): Promise<Item[]> {
  const items: Item[] = [];
  for await (const rel of walk("")) {
    try {
      const raw = await fs.readFile(absolute(rel), "utf8");
      items.push(JSON.parse(raw) as Item);
    } catch (error) {
      console.error(`Skipping unreadable ${rel}:`, error);
    }
  }
  return items.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export async function findItem(id: string): Promise<Item | null> {
  const items = await listItems();
  return items.find((item) => item.id === id) ?? null;
}

export async function updateItem(
  id: string,
  patch: Partial<Item>
): Promise<Item | null> {
  const existing = await findItem(id);
  if (!existing) return null;

  const merged: Item = {
    ...existing,
    ...patch,
    id: existing.id,
    dir: existing.dir,
    photo: existing.photo,
    source: existing.source,
    box: existing.box,
    addedAt: existing.addedAt,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(
    absolute(path.posix.join(existing.dir, "item.json")),
    JSON.stringify(merged, null, 2) + "\n"
  );
  return merged;
}

/** Remove now-empty brand and category folders so the tree stays tidy. */
async function pruneEmptyParents(dir: string) {
  let current = path.posix.dirname(dir);
  while (current && current !== "." && current !== "/") {
    try {
      const remaining = await fs.readdir(absolute(current));
      if (remaining.length > 0) return;
      await fs.rmdir(absolute(current));
    } catch {
      return;
    }
    current = path.posix.dirname(current);
  }
}

export async function deleteItem(id: string): Promise<boolean> {
  const existing = await findItem(id);
  if (!existing) return false;
  await fs.rm(absolute(existing.dir), { recursive: true, force: true });
  await pruneEmptyParents(existing.dir);
  return true;
}
