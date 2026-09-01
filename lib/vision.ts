import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import sharp from "sharp";
import { CATEGORIES, CONDITIONS, DetectedItem, ScanResultSchema } from "./catalog";

export const MODEL = process.env.CATALOG_MODEL || "claude-opus-5";

const SYSTEM = `You are a meticulous beauty-product cataloguer. You are shown photographs of \
someone's real makeup, skincare, and beauty-accessory collection and you turn each photo into \
precise catalogue entries.

Rules:
- Return exactly one entry per distinct physical item you can see. A palette, a set, or a kit is \
ONE item — do not emit an entry per pan or per pencil inside a fixed set. Loose items that merely \
sit next to each other are separate entries.
- Read the packaging. Brand names, product names, shade names and shade numbers are usually printed \
on the item; transcribe exactly what is printed, matching the brand's own capitalisation.
- Never invent a brand, product name or shade. If text is blurred, cropped, turned away or absent, \
use null for that field. A null is far more useful than a confident guess.
- product_type is always required and is a short generic noun phrase you can always supply from \
the item's shape alone: "Liquid Lipstick", "Eyeshadow Palette", "Foundation Bottle", "Blush Compact", \
"Mascara", "Makeup Sponge", "Blending Brush", "Hair Claw Clip", "Perfume Bottle".
- shade_hex is the actual colour of the PRODUCT (the bullet, the powder, the lacquer) as a #rrggbb \
hex. When the product colour is not visible, take the colour of the cap or packaging that indicates \
the shade. Use null only when the item genuinely has no shade (a brush, a sponge, a clip).
- condition: judge from wear on the packaging and how much product remains. Use "unknown" freely.
- visible_text: every legible word printed on the item, verbatim, in reading order. This is the \
audit trail for the fields above.
- confidence: 0.0-1.0, your confidence in the brand and product identification specifically. Use \
below 0.4 when you are working from shape alone.
- box: a tight bounding box around the item, in whole PIXELS of the image you were given, where \
x0,y0 is the top-left corner and x1,y1 the bottom-right. The image's exact pixel dimensions are \
stated in the request — use that coordinate space directly and do not rescale to any other range. \
Boxes are used to crop each item out of the photo, so they must be tight and correct.

Categories: ${CATEGORIES.join(", ")}.
Conditions: ${CONDITIONS.join(", ")}.`;

function userPrompt(width: number, height: number): string {
  return `This image is exactly ${width} pixels wide and ${height} pixels tall; give every box in \
that pixel space.

Catalogue every beauty item in this photo. Work left to right, top to bottom, so nothing is missed \
— including small items, items partly behind others, and tools or accessories. Transcribe the \
labels rather than recalling the product from memory.`;
}

export type ScanOutcome =
  | { ok: true; items: DetectedItem[] }
  | { ok: false; error: string };

export function hasCredentials(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/**
 * Identity-linked API keys must name the workspace each request acts in, which
 * the SDK has no first-class option for — it goes on as a header.
 */
function makeClient(): Anthropic {
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  return new Anthropic(
    workspace ? { defaultHeaders: { "anthropic-workspace-id": workspace } } : {}
  );
}

/** Downscale to Claude's sweet spot so large camera photos stay fast and cheap. */
export async function prepareForVision(
  buffer: Buffer
): Promise<{ data: string; mediaType: "image/jpeg"; width: number; height: number }> {
  const resized = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 1568, height: 1568, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  const meta = await sharp(resized).metadata();
  return {
    data: resized.toString("base64"),
    mediaType: "image/jpeg",
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
}

/**
 * Boxes come back in the pixel space of the image we sent; the catalogue stores
 * them on a 0-1000 grid so a crop stays correct whatever the source resolution.
 * Models vary in how well they respect a stated coordinate space, so anything
 * degenerate or off-canvas falls back to the whole frame rather than a bad crop.
 */
function toNormalisedBox(box: DetectedItem["box"], width: number, height: number) {
  if (!width || !height) return { x0: 0, y0: 0, x1: 1000, y1: 1000 };

  const scale = (value: number, extent: number) =>
    Math.min(1000, Math.max(0, Math.round((value / extent) * 1000)));

  const x0 = scale(Math.min(box.x0, box.x1), width);
  const x1 = scale(Math.max(box.x0, box.x1), width);
  const y0 = scale(Math.min(box.y0, box.y1), height);
  const y1 = scale(Math.max(box.y0, box.y1), height);

  if (x1 - x0 < 10 || y1 - y0 < 10) return { x0: 0, y0: 0, x1: 1000, y1: 1000 };
  return { x0, y0, x1, y1 };
}

export async function identifyItems(buffer: Buffer): Promise<ScanOutcome> {
  if (!hasCredentials()) {
    return {
      ok: false,
      error:
        "No Anthropic credentials found. Add ANTHROPIC_API_KEY to .env.local and restart the dev server.",
    };
  }

  const client = makeClient();
  const image = await prepareForVision(buffer);

  const request = {
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    thinking: { type: "adaptive" as const },
    output_config: {
      format: zodOutputFormat(ScanResultSchema),
      effort: "high" as const,
    },
    messages: [
      {
        role: "user" as const,
        content: [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: image.mediaType,
              data: image.data,
            },
          },
          { type: "text" as const, text: userPrompt(image.width, image.height) },
        ],
      },
    ],
  };

  try {
    let response;
    try {
      // Server-side fallbacks keep a stray safety refusal from losing the photo.
      response = await client.beta.messages.parse({
        ...request,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      } as Parameters<typeof client.beta.messages.parse>[0]);
    } catch (error) {
      if (error instanceof Anthropic.BadRequestError) {
        response = await client.messages.parse(request);
      } else {
        throw error;
      }
    }

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "Claude declined to describe this photo." };
    }
    if (!response.parsed_output) {
      return { ok: false, error: "Claude returned no structured result for this photo." };
    }
    const items = response.parsed_output.items.map((item) => ({
      ...item,
      box: toNormalisedBox(item.box, image.width, image.height),
    }));
    return { ok: true, items };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "Anthropic rejected the API key. Check ANTHROPIC_API_KEY." };
    }
    if (
      error instanceof Anthropic.BadRequestError &&
      /workspace/i.test(error.message)
    ) {
      return {
        ok: false,
        error:
          "This API key is identity-linked, so it needs a workspace. Add ANTHROPIC_WORKSPACE_ID to .env.local and restart, or create a workspace-scoped key instead.",
      };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Rate limited by the Anthropic API. Try again in a moment." };
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return { ok: false, error: "Could not reach the Anthropic API. Check your connection." };
    }
    console.error("Vision call failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error while identifying items.",
    };
  }
}
