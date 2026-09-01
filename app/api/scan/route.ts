import { NextRequest, NextResponse } from "next/server";
import { cropToDataUrl } from "@/lib/crop";
import { normalizeImage } from "@/lib/decode";
import { saveSource } from "@/lib/store";
import { hasCredentials, identifyItems } from "@/lib/vision";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PHOTOS = 12;

export type ScanDetection = Awaited<ReturnType<typeof identifyItems>> extends { items: infer T }
  ? T
  : never;

export async function POST(request: NextRequest) {
  if (!hasCredentials()) {
    return NextResponse.json(
      {
        error:
          "No Anthropic credentials found. Put ANTHROPIC_API_KEY in .env.local and restart the dev server.",
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded photos." }, { status: 400 });
  }

  const photos = form.getAll("photos").filter((v): v is File => v instanceof File);
  if (photos.length === 0) {
    return NextResponse.json({ error: "No photos were uploaded." }, { status: 400 });
  }
  if (photos.length > MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Please scan at most ${MAX_PHOTOS} photos at a time.` },
      { status: 400 }
    );
  }

  const results = await Promise.all(
    photos.map(async (photo) => {
      const raw = Buffer.from(await photo.arrayBuffer());

      // iPhone HEIC becomes JPEG here so vision, cropping and serving all
      // work from a format every downstream step can read.
      let buffer: Buffer;
      let converted = false;
      try {
        ({ buffer, converted } = await normalizeImage(raw));
      } catch (error) {
        return {
          photo: photo.name,
          source: null,
          error: error instanceof Error ? error.message : "Unreadable image.",
          detections: [],
        };
      }

      let source: string;
      try {
        const name = converted
          ? (photo.name || "photo").replace(/\.(heic|heif)$/i, "") + ".jpg"
          : photo.name || "photo.jpg";
        source = await saveSource(buffer, name);
      } catch (error) {
        console.error("Could not store source photo:", error);
        return { photo: photo.name, source: null, error: "Could not store this photo.", detections: [] };
      }

      const outcome = await identifyItems(buffer);
      if (!outcome.ok) {
        return { photo: photo.name, source, error: outcome.error, detections: [] };
      }

      const detections = await Promise.all(
        outcome.items.map(async (item, index) => ({
          key: `${source}#${index}`,
          ...item,
          preview: await cropToDataUrl(buffer, item.box).catch(() => null),
        }))
      );

      return { photo: photo.name, source, error: null, detections };
    })
  );

  const found = results.reduce((total, r) => total + r.detections.length, 0);
  return NextResponse.json({ results, found });
}
