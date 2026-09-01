"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, CONDITIONS, Item, displayName } from "@/lib/catalog";
import { Button, SelectField, TextAreaField, TextField, inputClass } from "./ui";

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-[#33291f]/25 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Bottom sheet on a phone, side panel on a desktop. */}
      <aside className="relative flex max-h-[92vh] w-full flex-col rounded-t-[var(--radius-sheet)] bg-surface shadow-[var(--lift-high)] sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none">
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-sand-deep sm:hidden" />

        <header className="flex items-start gap-3 px-6 pt-5 pb-4">
          <div className="min-w-0 flex-1">
            <p className="caps truncate">{draft.brand || "Unbranded"}</p>
            <h2 className="display mt-1 truncate text-[26px] leading-tight">
              {displayName(draft)}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 shrink-0 rounded-full px-2.5 py-1 text-xl leading-none text-ink-faint transition-colors hover:bg-sand hover:text-ink"
          >
            ×
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
          {draft.photo && (
            <div className="photo-ground overflow-hidden rounded-[var(--radius-card)]">
              <img
                src={`/api/media/${draft.photo}`}
                alt={displayName(draft)}
                className="mx-auto max-h-60 w-auto object-contain p-4"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Shade"
              value={draft.shadeName ?? ""}
              onChange={(v) => set("shadeName", v || null)}
            />
            <div>
              <span className="caps mb-2 block">Shade colour</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={/^#[0-9a-f]{6}$/i.test(draft.shadeHex ?? "") ? draft.shadeHex! : "#c08d7e"}
                  onChange={(event) => set("shadeHex", event.target.value)}
                  className="h-10 w-11 shrink-0 cursor-pointer rounded-[var(--radius-control)] border border-line bg-surface p-1"
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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-3 gap-4">
            <TextField label="Finish" value={draft.finish ?? ""} onChange={(v) => set("finish", v || null)} />
            <TextField label="Size" value={draft.size ?? ""} onChange={(v) => set("size", v || null)} />
            <TextField
              label="Price"
              value={draft.price === null ? "" : String(draft.price)}
              onChange={(v) => set("price", v.trim() === "" ? null : Number(v) || null)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              set("tags", v.split(",").map((tag) => tag.trim()).filter(Boolean))
            }
            placeholder="everyday, travel kit"
          />

          <TextAreaField label="Notes" value={draft.notes ?? ""} onChange={(v) => set("notes", v || null)} />

          <label className="flex cursor-pointer items-center gap-2.5 text-[15px]">
            <input
              type="checkbox"
              checked={draft.favorite}
              onChange={(event) => set("favorite", event.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Favourite
          </label>

          {draft.visibleText && (
            <details className="rounded-[var(--radius-control)] bg-sand/60 px-4 py-3 text-sm">
              <summary className="cursor-pointer text-ink-soft">
                Text read off the packaging
              </summary>
              <p className="mt-2.5 text-[13px] leading-relaxed whitespace-pre-wrap">
                {draft.visibleText}
              </p>
            </details>
          )}

          <div className="space-y-1.5 border-t border-line pt-5 text-[12px] leading-relaxed text-ink-faint">
            <p>
              Filed at <span className="text-ink-soft">collection/{item.dir}</span>
            </p>
            <p>
              Added {new Date(item.addedAt).toLocaleDateString()} · identified with{" "}
              {Math.round(item.confidence * 100)}% confidence
            </p>
          </div>
        </div>

        {error && <p className="px-6 pb-2 text-sm text-accent">{error}</p>}

        <footer className="flex items-center gap-2.5 border-t border-line bg-surface px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button onClick={save} disabled={!dirty || saving} className="flex-1">
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
            disabled={saving}
            className={confirmDelete ? "!text-accent" : ""}
          >
            {confirmDelete ? "Really delete?" : "Delete"}
          </Button>
        </footer>
      </aside>
    </div>
  );
}
