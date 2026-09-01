import sharp, { Sharp } from "sharp";
import { Box } from "./catalog";

/** Translate a 0-1000 normalised box into pixel extract options, with padding. */
function regionFor(box: Box, width: number, height: number) {
  const padX = (box.x1 - box.x0) * 0.06;
  const padY = (box.y1 - box.y0) * 0.06;
  const clamp = (v: number) => Math.min(1000, Math.max(0, v));

  const left = Math.floor((clamp(Math.min(box.x0, box.x1) - padX) / 1000) * width);
  const top = Math.floor((clamp(Math.min(box.y0, box.y1) - padY) / 1000) * height);
  const right = Math.ceil((clamp(Math.max(box.x0, box.x1) + padX) / 1000) * width);
  const bottom = Math.ceil((clamp(Math.max(box.y0, box.y1) + padY) / 1000) * height);

  const safeLeft = Math.min(Math.max(0, left), Math.max(0, width - 1));
  const safeTop = Math.min(Math.max(0, top), Math.max(0, height - 1));

  return {
    left: safeLeft,
    top: safeTop,
    width: Math.max(1, Math.min(right - safeLeft, width - safeLeft)),
    height: Math.max(1, Math.min(bottom - safeTop, height - safeTop)),
  };
}

/** Crop one item out of a photo. Falls back to the whole frame when the box is unusable. */
async function cropped(image: Sharp, box: Box | null, maxEdge: number): Promise<Sharp> {
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const pipeline = box && width && height ? image.extract(regionFor(box, width, height)) : image;
  return pipeline.resize({
    width: maxEdge,
    height: maxEdge,
    fit: "inside",
    withoutEnlargement: true,
  });
}

export async function cropToFile(
  sourcePath: string,
  box: Box | null,
  destPath: string
): Promise<void> {
  const image = sharp(sourcePath, { failOn: "none" }).rotate();
  const out = await cropped(image, box, 900);
  await out.jpeg({ quality: 88 }).toFile(destPath);
}

export async function cropToDataUrl(buffer: Buffer, box: Box | null): Promise<string> {
  const image = sharp(buffer, { failOn: "none" }).rotate();
  const out = await cropped(image, box, 420);
  const jpeg = await out.jpeg({ quality: 78 }).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}
