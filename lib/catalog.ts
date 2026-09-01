import { z } from "zod";

export const CATEGORIES = [
  "Face",
  "Eyes",
  "Lips",
  "Cheeks",
  "Brows",
  "Nails",
  "Skincare",
  "Tools & Brushes",
  "Hair",
  "Fragrance",
  "Accessories",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CONDITIONS = [
  "sealed",
  "new",
  "lightly used",
  "well used",
  "almost empty",
  "unknown",
] as const;

/** Bounding box in normalised 0-1000 image coordinates. */
export const BoxSchema = z.object({
  x0: z.number(),
  y0: z.number(),
  x1: z.number(),
  y1: z.number(),
});

/** What Claude returns for one physical item it sees in a photo. */
export const DetectedItemSchema = z.object({
  category: z.enum(CATEGORIES),
  product_type: z.string(),
  brand: z.string().nullable(),
  product_name: z.string().nullable(),
  shade_name: z.string().nullable(),
  shade_hex: z.string().nullable(),
  finish: z.string().nullable(),
  color_family: z.string().nullable(),
  size: z.string().nullable(),
  packaging: z.string().nullable(),
  condition: z.enum(CONDITIONS),
  visible_text: z.string().nullable(),
  notes: z.string().nullable(),
  confidence: z.number(),
  box: BoxSchema,
});

export const ScanResultSchema = z.object({
  items: z.array(DetectedItemSchema),
});

export type DetectedItem = z.infer<typeof DetectedItemSchema>;
export type Box = z.infer<typeof BoxSchema>;

/** A catalogued item as persisted to disk in `item.json`. */
export type Item = {
  id: string;
  category: Category | string;
  productType: string;
  brand: string | null;
  productName: string | null;
  shadeName: string | null;
  shadeHex: string | null;
  finish: string | null;
  colorFamily: string | null;
  size: string | null;
  packaging: string | null;
  condition: string;
  visibleText: string | null;
  notes: string | null;
  confidence: number;
  tags: string[];
  favorite: boolean;
  price: number | null;
  currency: string;
  purchasedOn: string | null;
  expiresOn: string | null;
  addedAt: string;
  updatedAt: string;
  /** Path of the cropped photo, relative to the collection root. */
  photo: string | null;
  /** Path of the original camera photo, relative to the collection root. */
  source: string | null;
  box: Box | null;
  /** Directory holding this item, relative to the collection root. */
  dir: string;
};

export const UNBRANDED = "Unbranded";

export function slugify(input: string): string {
  return (
    input
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "untitled"
  );
}

/** Turn a folder or file name into something safe for every filesystem. */
export function safeSegment(input: string): string {
  const cleaned = input
    .replace(/[/\\:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 60);
  return cleaned || "Unknown";
}

export function displayName(item: Item): string {
  return (
    item.productName ||
    [item.brand, item.productType].filter(Boolean).join(" ") ||
    item.productType ||
    "Unidentified item"
  );
}

/** collection/<Category>/<Brand>/<product-slug> — the human-browsable path. */
export function itemDirFor(fields: {
  category: string;
  brand: string | null;
  productName: string | null;
  productType: string;
  shadeName: string | null;
}): string {
  const category = safeSegment(fields.category || "Other");
  const brand = safeSegment(fields.brand || UNBRANDED);
  const leaf = slugify(
    [fields.productName || fields.productType, fields.shadeName]
      .filter(Boolean)
      .join(" ")
  );
  return `${category}/${brand}/${leaf}`;
}
