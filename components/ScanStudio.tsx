"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { CATEGORIES, Box } from "@/lib/catalog";
import { Button, ShadeDot, inputClass } from "./ui";

type Detection = {
  key: string;
  category: string;
  product_type: string;
  brand: string | null;
  product_name: string | null;
  shade_name: string | null;
  shade_hex: string | null;
  finish: string | null;
  color_family: string | null;
  size: string | null;
  packaging: string | null;
  condition: string;
  visible_text: string | null;
  notes: string | null;
  confidence: number;
  box: Box;
  preview: string | null;
};

type PhotoResult = {
  photo: string;
  source: string | null;
  error: string | null;
  detections: Detection[];
};

type Row = Detection & { source: string | null; include: boolean };

const MAX_PHOTOS = 12;

export default function ScanStudio() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [queue, setQueue] = useState<{ file: File; url: string }[]>([]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "scanning" | "filing">("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;
    setQueue((previous) =>
      [...previous, ...images.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(
        0,
        MAX_PHOTOS
      )
    );
    setError(null);
  }, []);

  function removeFromQueue(index: number) {
    setQueue((previous) => {
      URL.revokeObjectURL(previous[index].url);
      return previous.filter((_, i) => i !== index);
    });
  }

  async function scan() {
    if (queue.length === 0) return;
    setStatus("scanning");
    setError(null);
    setPhotoErrors([]);

    try {
      const form = new FormData();
      for (const entry of queue) form.append("photos", entry.file);

      const response = await fetch("/api/scan", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The scan failed.");

      const results = data.results as PhotoResult[];
      setPhotoErrors(
        results.filter((r) => r.error).map((r) => `${r.photo || "photo"}: ${r.error}`)
      );
      setRows(
        results.flatMap((result) =>
          result.detections.map((detection) => ({
            ...detection,
            source: result.source,
            include: true,
          }))
        )
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The scan failed.");
    } finally {
      setStatus("idle");
    }
  }

  async function fileItems() {
    if (!rows) return;
    const chosen = rows.filter((row) => row.include);
    if (chosen.length === 0) return;

    setStatus("filing");
    setError(null);
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: chosen.map((row) => ({
            category: row.category,
            productType: row.product_type,
            brand: row.brand,
            productName: row.product_name,
            shadeName: row.shade_name,
            shadeHex: row.shade_hex,
            finish: row.finish,
            colorFamily: row.color_family,
            size: row.size,
            packaging: row.packaging,
            condition: row.condition,
            visibleText: row.visible_text,
            notes: row.notes,
            confidence: row.confidence,
            source: row.source,
            box: row.box,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not file these items.");

      for (const entry of queue) URL.revokeObjectURL(entry.url);
      router.push("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not file these items.");
      setStatus("idle");
    }
  }

  function update(key: string, patch: Partial<Row>) {
    setRows((previous) =>
      previous?.map((row) => (row.key === key ? { ...row, ...patch } : row)) ?? null
    );
  }

  const chosenCount = rows?.filter((row) => row.include).length ?? 0;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-ground/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3.5">
          <Link href="/" className="display text-[26px] leading-none">
            Vanity
          </Link>
          <span className="caps">Add items</span>
          <Link href="/" className="ml-auto text-sm text-ink-soft transition hover:text-ink">
            Back to collection
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {!rows ? (
          <>
            <h1 className="display text-[34px] leading-tight sm:text-[40px]">Photograph your collection</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
              Lay items out on a plain surface with labels facing up — a whole drawer per photo is
              fine. Each item gets identified, cropped out of the photo, and filed into its own
              folder.
            </p>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                addFiles(event.dataTransfer.files);
              }}
              onClick={() => fileInput.current?.click()}
              className={`mt-7 cursor-pointer rounded-[var(--radius-card)] border-2 border-dashed px-6 py-16 text-center transition ${
                dragging ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-accent/60"
              }`}
            >
              <p className="display text-2xl">Drop photos here</p>
              <p className="mt-2 text-sm text-ink-soft">
                or click to choose · up to {MAX_PHOTOS} at a time
              </p>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </div>

            {queue.length > 0 && (
              <>
                <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {queue.map((entry, index) => (
                    <div
                      key={entry.url}
                      className="group relative aspect-square overflow-hidden rounded-[var(--radius-control)] border border-line"
                    >
                      <img src={entry.url} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          removeFromQueue(index);
                        }}
                        className="absolute top-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <Button onClick={scan} disabled={status === "scanning"} className="mt-7 px-6 py-3.5">
                  {status === "scanning"
                    ? `Reading ${queue.length} photo${queue.length === 1 ? "" : "s"}…`
                    : `Identify items in ${queue.length} photo${queue.length === 1 ? "" : "s"}`}
                </Button>
                {status === "scanning" && (
                  <p className="mt-3 text-sm text-ink-soft">
                    Claude is reading the labels. Busy photos take a little longer.
                  </p>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="display text-[34px] leading-tight sm:text-[40px]">
                  Found {rows.length} item{rows.length === 1 ? "" : "s"}
                </h1>
                <p className="mt-2 text-sm text-ink-soft">
                  Fix anything Claude misread, then file them. Low-confidence reads are flagged.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRows(null);
                    setPhotoErrors([]);
                  }}
                >
                  Start over
                </Button>
                <Button onClick={fileItems} disabled={chosenCount === 0 || status === "filing"}>
                  {status === "filing" ? "Filing…" : `File ${chosenCount} into collection`}
                </Button>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              {rows.map((row) => (
                <article
                  key={row.key}
                  className={`lift flex gap-4 rounded-[var(--radius-card)] border bg-surface p-3.5 transition ${
                    row.include ? "border-line" : "border-line/60 opacity-45"
                  }`}
                >
                  <div className="photo-ground h-28 w-28 shrink-0 overflow-hidden rounded-[var(--radius-control)]">
                    {row.preview ? (
                      <img src={row.preview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-ink-soft">
                        no crop
                      </div>
                    )}
                  </div>

                  <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <input
                      className={inputClass}
                      value={row.brand ?? ""}
                      placeholder="Brand"
                      onChange={(event) => update(row.key, { brand: event.target.value || null })}
                    />
                    <input
                      className={`${inputClass} sm:col-span-2`}
                      value={row.product_name ?? row.product_type}
                      placeholder="Product name"
                      onChange={(event) =>
                        update(row.key, { product_name: event.target.value || null })
                      }
                    />
                    <div className="flex items-center gap-2">
                      <ShadeDot hex={row.shade_hex} size={22} />
                      <input
                        className={inputClass}
                        value={row.shade_name ?? ""}
                        placeholder="Shade"
                        onChange={(event) =>
                          update(row.key, { shade_name: event.target.value || null })
                        }
                      />
                    </div>
                    <select
                      className={inputClass}
                      value={row.category}
                      onChange={(event) => update(row.key, { category: event.target.value })}
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <input
                      className={inputClass}
                      value={row.product_type}
                      placeholder="Type"
                      onChange={(event) => update(row.key, { product_type: event.target.value })}
                    />
                    <div className="col-span-2 flex items-center justify-between gap-3 text-xs text-ink-soft">
                      <span>
                        {row.confidence < 0.45 ? "⚠ low confidence · " : ""}
                        {Math.round(row.confidence * 100)}% sure
                      </span>
                      <label className="flex shrink-0 items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={row.include}
                          onChange={(event) => update(row.key, { include: event.target.checked })}
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                        Include
                      </label>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {photoErrors.length > 0 && (
          <div className="mt-6 rounded-[var(--radius-control)] bg-sand/60 px-4 py-3.5 text-sm">
            <p className="caps mb-1.5">Some photos could not be read</p>
            <ul className="list-inside list-disc space-y-1 text-ink-soft">
              {photoErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-[var(--radius-control)] bg-accent-soft px-4 py-3.5 text-sm">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
