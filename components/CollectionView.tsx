"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, Item, displayName } from "@/lib/catalog";
import ItemDrawer from "./ItemDrawer";
import { ShadeDot } from "./fields";

const SORTS = {
  recent: "Recently added",
  brand: "Brand A–Z",
  name: "Product A–Z",
  category: "Category",
} as const;

type Sort = keyof typeof SORTS;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-24">
      <p className="font-display text-3xl leading-none">{value}</p>
      <p className="eyebrow mt-1.5">{label}</p>
    </div>
  );
}

function ItemCard({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const subtitle = [item.shadeName, item.finish].filter(Boolean).join(" · ");
  return (
    <button
      onClick={onOpen}
      className="card-shadow group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left transition hover:-translate-y-0.5 hover:border-accent/40"
    >
      <div className="swatch-grid relative aspect-4/5 w-full overflow-hidden">
        {item.photo ? (
          <img
            src={`/api/media/${item.photo}`}
            alt={displayName(item)}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">No photo</div>
        )}
        {item.favorite && (
          <span className="absolute top-2 right-2 rounded-full bg-surface/90 px-2 py-0.5 text-xs">
            ★
          </span>
        )}
        {item.confidence > 0 && item.confidence < 0.45 && (
          <span className="absolute bottom-2 left-2 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] text-muted">
            check me
          </span>
        )}
      </div>
      <div className="flex items-start gap-2.5 p-3">
        <ShadeDot hex={item.shadeHex} size={22} />
        <div className="min-w-0 flex-1">
          <p className="eyebrow truncate">{item.brand || "Unbranded"}</p>
          <p className="font-display truncate text-[17px] leading-snug">{displayName(item)}</p>
          <p className="truncate text-xs text-muted">{subtitle || item.productType}</p>
        </div>
      </div>
    </button>
  );
}

export default function CollectionView({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [brand, setBrand] = useState<string>("All");
  const [sort, setSort] = useState<Sort>("recent");
  const [openId, setOpenId] = useState<string | null>(null);

  const brands = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.brand || "Unbranded"))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [items]
  );

  const categoriesInUse = useMemo(
    () => CATEGORIES.filter((c) => items.some((item) => item.category === c)),
    [items]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = items.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (brand !== "All" && (item.brand || "Unbranded") !== brand) return false;
      if (!needle) return true;
      return [
        item.brand,
        item.productName,
        item.productType,
        item.shadeName,
        item.colorFamily,
        item.finish,
        item.category,
        item.notes,
        item.visibleText,
        ...item.tags,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });

    const sorted = [...matches];
    if (sort === "brand") {
      sorted.sort((a, b) => (a.brand || "~").localeCompare(b.brand || "~"));
    } else if (sort === "name") {
      sorted.sort((a, b) => displayName(a).localeCompare(displayName(b)));
    } else if (sort === "category") {
      sorted.sort(
        (a, b) => a.category.localeCompare(b.category) || (a.brand || "").localeCompare(b.brand || "")
      );
    }
    return sorted;
  }, [items, query, category, brand, sort]);

  const open = items.find((item) => item.id === openId) ?? null;
  const valued = items.filter((item) => typeof item.price === "number");
  const total = valued.reduce((sum, item) => sum + (item.price ?? 0), 0);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3.5">
          <Link href="/" className="font-display text-2xl leading-none tracking-tight">
            Vanity
          </Link>
          <span className="hidden text-xs text-muted sm:inline">
            {items.length} item{items.length === 1 ? "" : "s"} catalogued
          </span>
          <div className="ml-auto flex items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search brand, shade, finish…"
              className="w-44 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:w-60 focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-56"
            />
            <Link
              href="/add"
              className="rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-bg transition hover:opacity-90"
            >
              Add photos
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        {items.length === 0 ? (
          <div className="mx-auto max-w-lg py-24 text-center">
            <div className="swatch-grid mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-line">
              <span className="text-3xl">◍</span>
            </div>
            <h1 className="font-display text-4xl leading-tight">Your vanity is empty</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Photograph your makeup — a whole drawer at a time is fine. Every item in the frame gets
              identified, cropped out, and filed into its own folder under{" "}
              <code className="text-xs">collection/</code>.
            </p>
            <Link
              href="/add"
              className="mt-7 inline-block rounded-lg bg-ink px-5 py-3 text-sm font-medium text-bg transition hover:opacity-90"
            >
              Add your first photos
            </Link>
          </div>
        ) : (
          <>
            <section className="mb-8 flex flex-wrap items-end gap-x-10 gap-y-5 border-b border-line pb-7">
              <Stat label="Items" value={items.length} />
              <Stat label="Brands" value={brands.length} />
              <Stat label="Categories" value={categoriesInUse.length} />
              <Stat label="Favourites" value={items.filter((item) => item.favorite).length} />
              {valued.length > 0 && (
                <Stat
                  label={`Value · ${valued.length} priced`}
                  value={`${Math.round(total).toLocaleString()}`}
                />
              )}
            </section>

            <section className="mb-6 flex flex-wrap items-center gap-2">
              {["All", ...categoriesInUse].map((option) => (
                <button
                  key={option}
                  onClick={() => setCategory(option)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                    category === option
                      ? "border-transparent bg-ink text-bg"
                      : "border-line bg-surface text-muted hover:border-accent/40 hover:text-ink"
                  }`}
                >
                  {option}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <select
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm outline-none"
                >
                  <option value="All">All brands</option>
                  {brands.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as Sort)}
                  className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm outline-none"
                >
                  {Object.entries(SORTS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {visible.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted">
                Nothing matches those filters.
              </p>
            ) : (
              <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visible.map((item) => (
                  <ItemCard key={item.id} item={item} onOpen={() => setOpenId(item.id)} />
                ))}
              </section>
            )}
          </>
        )}
      </main>

      {open && (
        <ItemDrawer
          key={open.id}
          item={open}
          onClose={() => setOpenId(null)}
          onSaved={(saved) =>
            setItems((previous) => previous.map((item) => (item.id === saved.id ? saved : item)))
          }
          onDeleted={(id) => {
            setItems((previous) => previous.filter((item) => item.id !== id));
            setOpenId(null);
          }}
        />
      )}
    </div>
  );
}
