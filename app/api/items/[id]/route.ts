import { NextRequest, NextResponse } from "next/server";
import { Item } from "@/lib/catalog";
import { deleteItem, updateItem } from "@/lib/store";

export const runtime = "nodejs";

const EDITABLE = [
  "category",
  "productType",
  "brand",
  "productName",
  "shadeName",
  "shadeHex",
  "finish",
  "colorFamily",
  "size",
  "packaging",
  "condition",
  "notes",
  "tags",
  "favorite",
  "price",
  "currency",
  "purchasedOn",
  "expiresOn",
] as const satisfies readonly (keyof Item)[];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patch: Partial<Item> = {};
  for (const key of EDITABLE) {
    if (key in body) {
      (patch as Record<string, unknown>)[key] = body[key];
    }
  }

  const updated = await updateItem(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }
  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const removed = await deleteItem(id);
  if (!removed) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
