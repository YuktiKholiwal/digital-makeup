import convert from "heic-convert";
import sharp from "sharp";

/**
 * iPhones shoot HEIC by default, and the prebuilt libheif that ships with sharp
 * has no HEVC decoder — so HEIC has to be decoded separately and handed on as
 * JPEG. Everything downstream (vision, cropping, serving) then deals with one
 * format it can always read.
 */

const HEIC_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
]);

/** Sniff the ISO-BMFF brand rather than trusting the file extension. */
function looksLikeHeic(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  if (buffer.toString("ascii", 4, 8) !== "ftyp") return false;
  return HEIC_BRANDS.has(buffer.toString("ascii", 8, 12));
}

async function viaHeicConvert(buffer: Buffer): Promise<Buffer> {
  const output = await convert({
    buffer: new Uint8Array(buffer),
    format: "JPEG",
    quality: 0.92,
  });
  return Buffer.from(output);
}

async function decodableBySharp(buffer: Buffer): Promise<boolean> {
  try {
    // metadata() alone can succeed on a container sharp cannot actually decode,
    // so force a real decode of a single pixel.
    await sharp(buffer, { failOn: "none" }).resize(1, 1).jpeg().toBuffer();
    return true;
  } catch {
    return false;
  }
}

/**
 * Return a buffer sharp is guaranteed to be able to read, converting HEIC when
 * needed. Throws only if the bytes are not a usable image at all.
 */
export async function normalizeImage(
  buffer: Buffer
): Promise<{ buffer: Buffer; converted: boolean }> {
  if (looksLikeHeic(buffer)) {
    try {
      return { buffer: await viaHeicConvert(buffer), converted: true };
    } catch {
      // Generic HEIF brands (mif1/msf1) are sometimes AVIF, which sharp handles.
      if (await decodableBySharp(buffer)) return { buffer, converted: false };
      throw new Error("This looks like a HEIC photo but could not be decoded.");
    }
  }

  if (await decodableBySharp(buffer)) return { buffer, converted: false };

  try {
    return { buffer: await viaHeicConvert(buffer), converted: true };
  } catch {
    throw new Error("Unsupported or corrupt image file.");
  }
}
