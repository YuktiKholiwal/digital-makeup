"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, Item, displayName } from "@/lib/catalog";
import ItemDrawer from "./ItemDrawer";
import { Chip, ShadeDot } from "./ui";

const SORTS = {
  recent: "Recently added",
  brand: "Brand A–Z",
  name: "Product A–Z",
  category: "Category",
} as const;

type Sort = keyof typeof SORTS;

function ItemCard({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const subtitle = [item.shadeName, item.finish].filter(Boolean).join(" · ");
  return (
    <button
      onClick={onOpen}
      className="lift group flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-surface text-left transition-all duration-300 [transition-timing-function:var(--ease)] hover:-translate-y-1 hover:shadow-[var(--lift-high)]"
    >
      <div className="photo-ground relative aspect-4/5 w-full overflow-hidden">
        {item.photo ? (
          <img
            src={`/api/media/${item.photo}`}
            alt={displayName(item)}
            loading="lazy"
            className="h-full w-full object-contain p-5 transition-transform duration-500 [transition-timing-function:var(--ease)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-faint">
            No photo
          </div>
        )}
        {item.favorite && (
          <span className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-accent" />
        )}
      </div>

      <div className="flex flex-col gap-1 px-4 pt-3.5 pb-4">
        <p className="caps truncate">{item.brand || "Unbranded"}</p>
        <p className="display truncate text-[19px] leading-snug">{displayName(item)}</p>
        <div className="mt-0.5 flex items-center gap-2">
          {item.shadeHex && <ShadeDot hex={item.shadeHex} size={13} />}
          <p className="truncate text-[13px] text-ink-soft">{subtitle || item.productType}</p>
        </div>
        {item.confidence > 0 && item.confidence < 0.45 && (
          <p className="mt-1 text-[11px] text-accent">Worth a check</p>
        )}
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

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="display text-[42px] leading-none">Vanity</p>
        <div className="my-9 h-px w-14 bg-line" />
        <h1 className="display text-[28px] leading-tight">Nothing catalogued yet</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          Photograph your makeup — a whole drawer at a time is fine. Every item in the
          frame is identified, cropped out, and filed into its own folder.
        </p>
        <Link
          href="/add"
          className="mt-9 rounded-[var(--radius-control)] bg-ink px-6 py-3.5 text-sm font-medium text-ground transition-colors duration-200 hover:bg-[#463a2d]"
        >
          Add your first photos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 sm:pb-16">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-ground/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="display shrink-0 text-[26px] leading-none">
            Vanity
          </Link>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search brand, shade, finish…"
            className="ml-auto w-40 rounded-full border border-line bg-surface px-4 py-2 text-sm outline-none transition-all duration-300 [transition-timing-function:var(--ease)] placeholder:text-ink-faint focus:w-56 focus:border-accent sm:w-56 sm:focus:w-72"
          />
          <Link
            href="/add"
            className="hidden rounded-[var(--radius-control)] bg-ink px-4 py-2.5 text-sm font-medium text-ground transition-colors duration-200 hover:bg-[#463a2d] sm:block"
          >
            Add photos
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="display text-[32px] leading-none sm:text-[38px]">Your collection</h1>
          <p className="text-[13px] text-ink-soft">
            {items.length} {items.length === 1 ? "piece" : "pieces"} · {brands.length}{" "}
            {brands.length === 1 ? "brand" : "brands"}
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          <div className="-mx-5 flex flex-1 gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
            {["All", ...categoriesInUse].map((option) => (
              <Chip
                key={option}
                active={category === option}
                onClick={() => setCategory(option)}
              >
                {option}
              </Chip>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <select
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="rounded-full border border-line bg-surface px-3.5 py-2 text-sm text-ink-soft outline-none"
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
              className="rounded-full border border-line bg-surface px-3.5 py-2 text-sm text-ink-soft outline-none"
            >
              {Object.entries(SORTS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="py-24 text-center text-[15px] text-ink-soft">
            Nothing matches those filters.
          </p>
        ) : (
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((item) => (
              <ItemCard key={item.id} item={item} onOpen={() => setOpenId(item.id)} />
            ))}
          </section>
        )}
      </main>

      {/* Phone: the primary action lives within thumb reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-ground/90 px-5 py-3 backdrop-blur-md sm:hidden">
        <Link
          href="/add"
          className="block rounded-[var(--radius-control)] bg-ink py-3.5 text-center text-sm font-medium text-ground"
        >
          Add photos
        </Link>
      </div>

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
