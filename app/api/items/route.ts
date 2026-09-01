import { NextRequest, NextResponse } from "next/server";
import { createItem, listItems } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: await listItems() });
}

type IncomingItem = {
  category?: string;
  productType?: string;
  brand?: string | null;
  productName?: string | null;
  shadeName?: string | null;
  shadeHex?: string | null;
  finish?: string | null;
  colorFamily?: string | null;
  size?: string | null;
  packaging?: string | null;
  condition?: string;
  visibleText?: string | null;
  notes?: string | null;
  confidence?: number;
  price?: number | null;
  source?: string | null;
  box?: { x0: number; y0: number; x1: number; y1: number } | null;
};

export async function POST(request: NextRequest) {
  let body: { items?: IncomingItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const incoming = Array.isArray(body.items) ? body.items : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: "No items to file." }, { status: 400 });
  }

  const created = [];
  const failed: string[] = [];

  for (const raw of incoming) {
    try {
      created.push(
        await createItem({
          category: raw.category || "Other",
          productType: raw.productType || "Unidentified item",
          brand: raw.brand ?? null,
          productName: raw.productName ?? null,
          shadeName: raw.shadeName ?? null,
          shadeHex: raw.shadeHex ?? null,
          finish: raw.finish ?? null,
          colorFamily: raw.colorFamily ?? null,
          size: raw.size ?? null,
          packaging: raw.packaging ?? null,
          condition: raw.condition ?? "unknown",
          visibleText: raw.visibleText ?? null,
          notes: raw.notes ?? null,
          confidence: typeof raw.confidence === "number" ? raw.confidence : 0,
          price: typeof raw.price === "number" ? raw.price : null,
          source: raw.source ?? null,
          box: raw.box ?? null,
        })
      );
    } catch (error) {
      console.error("Could not file item:", error);
      failed.push(raw.productName || raw.productType || "unnamed item");
    }
  }

  return NextResponse.json({ created, failed });
}
