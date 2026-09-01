"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, CONDITIONS, Item, displayName } from "@/lib/catalog";
import { SelectField, ShadeDot, TextAreaField, TextField, inputClass } from "./fields";

type Props = {
  item: Item;
  onClose: () => void;
  onSaved: (item: Item) => void;
  onDeleted: (id: string) => void;
};

export default function ItemDrawer({ item, onClose, onSaved, onDeleted }: Props) {
  const [draft, setDraft] = useState<Item>(item);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof Item>(key: K, value: Item[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(item);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save changes.");
      onSaved(data.item as Item);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      const response = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete this item.");
      onDeleted(item.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete this item.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl">
        <header className="flex items-start gap-3 border-b border-line px-5 py-4">
          <ShadeDot hex={draft.shadeHex} size={36} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow truncate">{draft.brand || "Unbranded"}</p>
            <h2 className="font-display truncate text-xl leading-tight">{displayName(draft)}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-lg leading-none text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            ×
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {draft.photo && (
            <div className="swatch-grid overflow-hidden rounded-xl border border-line">
              <img
                src={`/api/media/${draft.photo}`}
                alt={displayName(draft)}
                className="mx-auto max-h-64 w-auto object-contain"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Brand" value={draft.brand ?? ""} onChange={(v) => set("brand", v || null)} />
            <TextField
              label="Product type"
              value={draft.productType}
              onChange={(v) => set("productType", v)}
            />
          </div>

          <TextField
            label="Product name"
            value={draft.productName ?? ""}
            onChange={(v) => set("productName", v || null)}
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Shade"
              value={draft.shadeName ?? ""}
              onChange={(v) => set("shadeName", v || null)}
            />
            <div>
              <span className="eyebrow mb-1.5 block">Shade colour</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={/^#[0-9a-f]{6}$/i.test(draft.shadeHex ?? "") ? draft.shadeHex! : "#c08a80"}
                  onChange={(event) => set("shadeHex", event.target.value)}
                  className="h-9 w-10 cursor-pointer rounded-lg border border-line bg-surface p-1"
                />
                <input
                  className={inputClass}
                  value={draft.shadeHex ?? ""}
                  placeholder="#rrggbb"
                  onChange={(event) => set("shadeHex", event.target.value || null)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Category"
              value={draft.category}
              onChange={(v) => set("category", v)}
              options={CATEGORIES}
            />
            <SelectField
              label="Condition"
              value={draft.condition}
              onChange={(v) => set("condition", v)}
              options={CONDITIONS}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <TextField label="Finish" value={draft.finish ?? ""} onChange={(v) => set("finish", v || null)} />
            <TextField label="Size" value={draft.size ?? ""} onChange={(v) => set("size", v || null)} />
            <TextField
              label="Price"
              value={draft.price === null ? "" : String(draft.price)}
              onChange={(v) => set("price", v.trim() === "" ? null : Number(v) || null)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Bought on"
              value={draft.purchasedOn ?? ""}
              onChange={(v) => set("purchasedOn", v || null)}
              placeholder="2026-04-12"
            />
            <TextField
              label="Use by"
              value={draft.expiresOn ?? ""}
              onChange={(v) => set("expiresOn", v || null)}
              placeholder="2027-04-12"
            />
          </div>

          <TextField
            label="Tags"
            value={draft.tags.join(", ")}
            onChange={(v) =>
              set(
                "tags",
                v.split(",").map((tag) => tag.trim()).filter(Boolean)
              )
            }
            placeholder="everyday, travel kit"
          />

          <TextAreaField label="Notes" value={draft.notes ?? ""} onChange={(v) => set("notes", v || null)} />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.favorite}
              onChange={(event) => set("favorite", event.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Favourite
          </label>

          {draft.visibleText && (
            <details className="rounded-lg border border-line bg-surface-2/50 px-3 py-2 text-sm">
              <summary className="cursor-pointer text-muted">Text read off the packaging</summary>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed">{draft.visibleText}</p>
            </details>
          )}

          <div className="space-y-1 border-t border-line pt-4 text-xs text-muted">
            <p>
              Filed at <code className="text-[11px]">collection/{item.dir}</code>
            </p>
            <p>
              Added {new Date(item.addedAt).toLocaleDateString()} · identification confidence{" "}
              {Math.round(item.confidence * 100)}%
            </p>
          </div>
        </div>

        {error && <p className="border-t border-line px-5 py-2 text-sm text-accent">{error}</p>}

        <footer className="flex items-center gap-2 border-t border-line px-5 py-4">
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="flex-1 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-bg transition hover:opacity-90 disabled:opacity-40"
          >
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
          <button
            onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
            disabled={saving}
            className="rounded-lg border border-line px-4 py-2.5 text-sm text-accent transition hover:bg-accent-soft disabled:opacity-40"
          >
            {confirmDelete ? "Really delete?" : "Delete"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
