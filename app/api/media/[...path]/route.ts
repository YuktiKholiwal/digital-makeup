import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { absolute } from "@/lib/store";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".heic": "image/heic",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const relative = segments.join("/");

  if (segments.some((s) => s === ".." || s === "." || s === "")) {
    return NextResponse.json({ error: "Bad path." }, { status: 400 });
  }

  let file: Buffer;
  try {
    file = await fs.readFile(absolute(relative));
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const ext = relative.slice(relative.lastIndexOf(".")).toLowerCase();
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
